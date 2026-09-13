import { db, pool } from "@/db";
import {
  bookings,
  bookingItems,
  showtimeSeats,
  seats,
  showtimes,
  movies,
  auditoriums,
  cinemas,
  payments,
  tickets,
  auditLogs,
} from "@/db/schema";
import { eq, and, inArray, lt, sql } from "drizzle-orm";
import { generateReferenceCode, generateTicketCode } from "./utils";
import { calculateOrderPricing } from "./pricing";
import { generateTicketQRCodeDataUrl } from "./qr";
import type { SeatType } from "@/types";

export const HOLD_DURATION_MS = 10 * 60 * 1000; // 10 minutes

export interface HoldSeatsInput {
  userId: string;
  showtimeId: string;
  seatIds: string[]; // seat UUIDs
  ipAddress?: string;
}

export interface HoldSeatsResult {
  success: boolean;
  error?: string;
  bookingId?: string;
  referenceCode?: string;
  expiresAt?: Date;
  pricing?: ReturnType<typeof calculateOrderPricing>;
  heldSeats?: Array<{
    seatId: string;
    showtimeSeatId: string;
    row: string;
    number: number;
    seatType: SeatType;
    priceCents: number;
  }>;
}

/**
 * Atomically locks and holds seats for a showtime, creating a PENDING booking.
 * Guarantees race condition prevention via database transaction & row locks.
 */
export async function holdSeatsTransaction(
  input: HoldSeatsInput
): Promise<HoldSeatsResult> {
  const { userId, showtimeId, seatIds, ipAddress } = input;

  if (!seatIds || seatIds.length === 0) {
    return { success: false, error: "No seats selected" };
  }
  if (seatIds.length > 10) {
    return {
      success: false,
      error: "Maximum 10 seats allowed per transaction",
    };
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN TRANSACTION ISOLATION LEVEL READ COMMITTED");

    // 1. Fetch showtime details
    const showtimeRes = await client.query(
      `SELECT id, movie_id, auditorium_id, price_cents, is_active FROM showtimes WHERE id = $1 FOR SHARE`,
      [showtimeId]
    );

    if (showtimeRes.rows.length === 0 || !showtimeRes.rows[0].is_active) {
      await client.query("ROLLBACK");
      return { success: false, error: "Showtime not found or inactive" };
    }

    const showtime = showtimeRes.rows[0];
    const basePriceCents = showtime.price_cents;

    // 2. Lock and fetch the showtime_seats and seat definitions
    // Clean expired holds on these seats first in this transaction
    const now = new Date();
    await client.query(
      `UPDATE showtime_seats
       SET status = 'AVAILABLE', held_by_user_id = NULL, held_until = NULL, booking_id = NULL, version = version + 1, updated_at = NOW()
       WHERE showtime_id = $1 AND seat_id = ANY($2) AND status = 'HELD' AND held_until < NOW()`,
      [showtimeId, seatIds]
    );

    // Lock the requested showtime_seats rows FOR UPDATE
    const seatsRes = await client.query(
      `SELECT ss.id as showtime_seat_id, ss.seat_id, ss.status, ss.held_by_user_id, ss.held_until, ss.version,
              s.row, s.number, s.seat_type, s.price_multiplier_cents
       FROM showtime_seats ss
       JOIN seats s ON s.id = ss.seat_id
       WHERE ss.showtime_id = $1 AND ss.seat_id = ANY($2)
       FOR UPDATE OF ss`,
      [showtimeId, seatIds]
    );

    if (seatsRes.rows.length !== seatIds.length) {
      await client.query("ROLLBACK");
      return {
        success: false,
        error: "One or more selected seats do not exist for this showtime",
      };
    }

    // 3. Verify that every seat is AVAILABLE or already held by the current user
    const unavailableSeats: string[] = [];
    for (const row of seatsRes.rows) {
      const isAvailable = row.status === "AVAILABLE";
      const isMyHold =
        row.status === "HELD" &&
        row.held_by_user_id === userId &&
        row.held_until &&
        new Date(row.held_until) > now;

      if (!isAvailable && !isMyHold) {
        unavailableSeats.push(`${row.row}${row.number}`);
      }
    }

    if (unavailableSeats.length > 0) {
      await client.query("ROLLBACK");
      return {
        success: false,
        error: `Seats already reserved or taken: ${unavailableSeats.join(", ")}`,
      };
    }

    // 4. Calculate server-side verified price
    const pricing = calculateOrderPricing({
      baseShowtimePriceCents: basePriceCents,
      seats: seatsRes.rows.map((r) => ({
        seatType: r.seat_type as SeatType,
        customMultiplierCents: r.price_multiplier_cents,
      })),
    });

    const expiresAt = new Date(Date.now() + HOLD_DURATION_MS);
    const referenceCode = generateReferenceCode();

    // 5. Create Pending Booking
    const bookingRes = await client.query(
      `INSERT INTO bookings (reference_code, user_id, showtime_id, status, subtotal_cents, service_fee_cents, tax_cents, total_cents, expires_at, created_at, updated_at)
       VALUES ($1, $2, $3, 'PENDING', $4, $5, $6, $7, $8, NOW(), NOW())
       RETURNING id, reference_code, expires_at`,
      [
        referenceCode,
        userId,
        showtimeId,
        pricing.subtotalCents,
        pricing.serviceFeeCents,
        pricing.taxCents,
        pricing.totalCents,
        expiresAt,
      ]
    );

    const booking = bookingRes.rows[0];

    // 6. Update showtime_seats to HELD & link to booking
    for (let i = 0; i < seatsRes.rows.length; i++) {
      const seatRow = seatsRes.rows[i];
      const itemized = pricing.itemizedSeats[i];
      const seatLabel = `${seatRow.row}${seatRow.number}`;

      await client.query(
        `UPDATE showtime_seats
         SET status = 'HELD', held_by_user_id = $1, held_until = $2, booking_id = $3, version = version + 1, updated_at = NOW()
         WHERE id = $4`,
        [userId, expiresAt, booking.id, seatRow.showtime_seat_id]
      );

      // Create booking items
      await client.query(
        `INSERT INTO booking_items (booking_id, showtime_seat_id, seat_id, seat_label, seat_type, price_cents, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
        [
          booking.id,
          seatRow.showtime_seat_id,
          seatRow.seat_id,
          seatLabel,
          seatRow.seat_type,
          itemized.totalSeatPriceCents,
        ]
      );
    }

    // 7. Audit Log
    await client.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, payload, ip_address, created_at)
       VALUES ($1, 'HOLD_SEATS', 'BOOKING', $2, $3, $4, NOW())`,
      [
        userId,
        booking.id,
        JSON.stringify({
          showtimeId,
          seatCount: seatIds.length,
          totalCents: pricing.totalCents,
        }),
        ipAddress || "127.0.0.1",
      ]
    );

    await client.query("COMMIT");

    return {
      success: true,
      bookingId: booking.id,
      referenceCode: booking.reference_code,
      expiresAt: new Date(booking.expires_at),
      pricing,
      heldSeats: seatsRes.rows.map((r, idx) => ({
        seatId: r.seat_id,
        showtimeSeatId: r.showtime_seat_id,
        row: r.row,
        number: r.number,
        seatType: r.seat_type,
        priceCents: pricing.itemizedSeats[idx].totalSeatPriceCents,
      })),
    };
  } catch (err: any) {
    await client.query("ROLLBACK");
    console.error("holdSeatsTransaction error:", err);
    return {
      success: false,
      error: err.message || "Failed to hold seats due to database error",
    };
  } finally {
    client.release();
  }
}

export interface ConfirmCheckoutInput {
  bookingId: string;
  userId: string;
  idempotencyKey: string;
  paymentMethod: {
    cardBrand?: string;
    last4?: string;
  };
  ipAddress?: string;
}

export interface ConfirmCheckoutResult {
  success: boolean;
  error?: string;
  booking?: any;
  tickets?: any[];
  isIdempotentReplay?: boolean;
}

/**
 * Confirms a pending booking after payment authorization.
 * Uses strict idempotency keys to ensure duplicate submissions return the existing confirmed order safely.
 */
export async function confirmCheckoutTransaction(
  input: ConfirmCheckoutInput
): Promise<ConfirmCheckoutResult> {
  const { bookingId, userId, idempotencyKey, paymentMethod, ipAddress } = input;

  if (!idempotencyKey) {
    return { success: false, error: "Idempotency key required for payment" };
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN TRANSACTION ISOLATION LEVEL READ COMMITTED");

    // 1. Check if a payment with this idempotencyKey already succeeded
    const existingPaymentRes = await client.query(
      `SELECT p.id, p.booking_id, p.status, b.reference_code
       FROM payments p
       JOIN bookings b ON b.id = p.booking_id
       WHERE p.idempotency_key = $1`,
      [idempotencyKey]
    );

    if (existingPaymentRes.rows.length > 0) {
      const existingPay = existingPaymentRes.rows[0];
      if (existingPay.status === "SUCCEEDED") {
        // Fetch tickets and return idempotent replay
        const ticketsRes = await client.query(
          `SELECT * FROM tickets WHERE booking_id = $1`,
          [existingPay.booking_id]
        );
        await client.query("COMMIT");
        return {
          success: true,
          isIdempotentReplay: true,
          booking: {
            id: existingPay.booking_id,
            referenceCode: existingPay.reference_code,
          },
          tickets: ticketsRes.rows,
        };
      }
    }

    // 2. Fetch and lock the booking FOR UPDATE
    const bookingRes = await client.query(
      `SELECT b.*, u.name as user_name, u.email as user_email,
              s.start_time, s.end_time, s.format,
              m.title as movie_title, m.poster_url as movie_poster, m.rating as movie_rating,
              a.name as auditorium_name,
              c.name as cinema_name, c.address as cinema_address
       FROM bookings b
       JOIN users u ON u.id = b.user_id
       JOIN showtimes s ON s.id = b.showtime_id
       JOIN movies m ON m.id = s.movie_id
       JOIN auditoriums a ON a.id = s.auditorium_id
       JOIN cinemas c ON c.id = a.cinema_id
       WHERE b.id = $1 FOR UPDATE OF b`,
      [bookingId]
    );

    if (bookingRes.rows.length === 0) {
      await client.query("ROLLBACK");
      return { success: false, error: "Booking not found" };
    }

    const booking = bookingRes.rows[0];

    // Verify user ownership
    if (booking.user_id !== userId) {
      await client.query("ROLLBACK");
      return {
        success: false,
        error: "Forbidden: You do not own this booking",
      };
    }

    // If already confirmed, return idempotently
    if (booking.status === "CONFIRMED") {
      const ticketsRes = await client.query(
        `SELECT * FROM tickets WHERE booking_id = $1`,
        [booking.id]
      );
      await client.query("COMMIT");
      return {
        success: true,
        isIdempotentReplay: true,
        booking,
        tickets: ticketsRes.rows,
      };
    }

    // Check if expired
    const now = new Date();
    if (booking.status === "EXPIRED" || new Date(booking.expires_at) < now) {
      await client.query(
        `UPDATE bookings SET status = 'EXPIRED', updated_at = NOW() WHERE id = $1`,
        [bookingId]
      );
      await client.query("COMMIT");
      return {
        success: false,
        error: "Booking hold has expired. Please select your seats again.",
      };
    }

    // 3. Fetch booking items and lock corresponding showtime_seats
    const itemsRes = await client.query(
      `SELECT bi.*, ss.id as showtime_seat_id, ss.status as seat_status, ss.held_by_user_id
       FROM booking_items bi
       JOIN showtime_seats ss ON ss.id = bi.showtime_seat_id
       WHERE bi.booking_id = $1
       FOR UPDATE OF ss`,
      [bookingId]
    );

    if (itemsRes.rows.length === 0) {
      await client.query("ROLLBACK");
      return { success: false, error: "No items found in this booking" };
    }

    // Verify seat hold validity
    for (const item of itemsRes.rows) {
      if (
        item.seat_status !== "HELD" ||
        item.held_by_user_id !== userId
      ) {
        await client.query("ROLLBACK");
        return {
          success: false,
          error: "Seat hold was released or claimed by another user",
        };
      }
    }

    // 4. Record Payment record
    const paymentIntentId = `pi_test_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    await client.query(
      `INSERT INTO payments (booking_id, payment_intent_id, provider, status, amount_cents, currency, idempotency_key, card_brand, last4, metadata, created_at, updated_at)
       VALUES ($1, $2, 'test_gateway', 'SUCCEEDED', $3, 'usd', $4, $5, $6, $7, NOW(), NOW())`,
      [
        booking.id,
        paymentIntentId,
        booking.total_cents,
        idempotencyKey,
        paymentMethod.cardBrand || "Visa",
        paymentMethod.last4 || "4242",
        JSON.stringify({ simulated: true }),
      ]
    );

    // 5. Update Booking to CONFIRMED
    await client.query(
      `UPDATE bookings
       SET status = 'CONFIRMED', idempotency_key = $1, updated_at = NOW()
       WHERE id = $2`,
      [idempotencyKey, booking.id]
    );

    // 6. Update showtime_seats to BOOKED
    for (const item of itemsRes.rows) {
      await client.query(
        `UPDATE showtime_seats
         SET status = 'BOOKED', held_until = NULL, version = version + 1, updated_at = NOW()
         WHERE id = $1`,
        [item.showtime_seat_id]
      );
    }

    // 7. Generate individual digital tickets with QR payload
    const generatedTickets: any[] = [];
    for (const item of itemsRes.rows) {
      const ticketCode = generateTicketCode();
      const qrPayload = {
        ticketCode,
        bookingRef: booking.reference_code,
        showtimeId: booking.showtime_id,
        seatLabel: item.seat_label,
        issuedAt: new Date().toISOString(),
      };
      const qrDataUrl = await generateTicketQRCodeDataUrl(qrPayload);

      const ticketRes = await client.query(
        `INSERT INTO tickets (booking_id, ticket_code, qr_code_data, user_id, showtime_seat_id, seat_label, is_checked_in, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, false, NOW())
         RETURNING *`,
        [
          booking.id,
          ticketCode,
          qrDataUrl,
          userId,
          item.showtime_seat_id,
          item.seat_label,
        ]
      );
      generatedTickets.push(ticketRes.rows[0]);
    }

    // 8. Audit Log
    await client.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, payload, ip_address, created_at)
       VALUES ($1, 'CHECKOUT_CONFIRMED', 'BOOKING', $2, $3, $4, NOW())`,
      [
        userId,
        booking.id,
        JSON.stringify({
          referenceCode: booking.reference_code,
          totalCents: booking.total_cents,
          ticketCount: generatedTickets.length,
          paymentIntentId,
        }),
        ipAddress || "127.0.0.1",
      ]
    );

    await client.query("COMMIT");

    return {
      success: true,
      booking: {
        ...booking,
        status: "CONFIRMED",
      },
      tickets: generatedTickets,
    };
  } catch (err: any) {
    await client.query("ROLLBACK");
    console.error("confirmCheckoutTransaction error:", err);
    return {
      success: false,
      error: err.message || "Failed to confirm payment and booking",
    };
  } finally {
    client.release();
  }
}

/**
 * Cancels an eligible booking, releases seats back to AVAILABLE, and records refund.
 */
export async function cancelBookingTransaction(
  bookingId: string,
  userId: string,
  isAdmin = false
): Promise<{ success: boolean; error?: string; refundedCents?: number }> {
  const client = await pool.connect();

  try {
    await client.query("BEGIN TRANSACTION ISOLATION LEVEL READ COMMITTED");

    // Fetch booking
    const bookingRes = await client.query(
      `SELECT b.*, s.start_time
       FROM bookings b
       JOIN showtimes s ON s.id = b.showtime_id
       WHERE b.id = $1 FOR UPDATE OF b`,
      [bookingId]
    );

    if (bookingRes.rows.length === 0) {
      await client.query("ROLLBACK");
      return { success: false, error: "Booking not found" };
    }

    const booking = bookingRes.rows[0];

    if (!isAdmin && booking.user_id !== userId) {
      await client.query("ROLLBACK");
      return { success: false, error: "Unauthorized access to this booking" };
    }

    if (booking.status !== "CONFIRMED") {
      await client.query("ROLLBACK");
      return {
        success: false,
        error: `Cannot cancel a booking with status ${booking.status}`,
      };
    }

    // Cancellation policy: Only allowed up to 2 hours before showtime (unless admin)
    const now = new Date();
    const showtimeStart = new Date(booking.start_time);
    const diffHours =
      (showtimeStart.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (!isAdmin && diffHours < 2) {
      await client.query("ROLLBACK");
      return {
        success: false,
        error:
          "Bookings can only be cancelled up to 2 hours before showtime start.",
      };
    }

    // Release seats
    const itemsRes = await client.query(
      `SELECT showtime_seat_id FROM booking_items WHERE booking_id = $1`,
      [bookingId]
    );

    for (const item of itemsRes.rows) {
      await client.query(
        `UPDATE showtime_seats
         SET status = 'AVAILABLE', held_by_user_id = NULL, held_until = NULL, booking_id = NULL, version = version + 1, updated_at = NOW()
         WHERE id = $1`,
        [item.showtime_seat_id]
      );
    }

    // Update booking status
    await client.query(
      `UPDATE bookings SET status = 'CANCELLED', updated_at = NOW() WHERE id = $1`,
      [bookingId]
    );

    // Update payments to REFUNDED
    await client.query(
      `UPDATE payments SET status = 'REFUNDED', updated_at = NOW() WHERE booking_id = $1`,
      [bookingId]
    );

    // Audit Log
    await client.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, payload, created_at)
       VALUES ($1, 'BOOKING_CANCELLED_REFUNDED', 'BOOKING', $2, $3, NOW())`,
      [
        userId,
        bookingId,
        JSON.stringify({
          refundedCents: booking.total_cents,
          referenceCode: booking.reference_code,
          cancelledByAdmin: isAdmin,
        }),
      ]
    );

    await client.query("COMMIT");

    return { success: true, refundedCents: booking.total_cents };
  } catch (err: any) {
    await client.query("ROLLBACK");
    console.error("cancelBookingTransaction error:", err);
    return { success: false, error: err.message || "Failed to cancel booking" };
  } finally {
    client.release();
  }
}

/**
 * Idempotently releases expired seat holds across all showtimes.
 * Safe for repeated execution via cron or manual trigger.
 */
export async function releaseExpiredSeatHolds(): Promise<{
  releasedSeatsCount: number;
  expiredBookingsCount: number;
}> {
  const client = await pool.connect();

  try {
    await client.query("BEGIN TRANSACTION ISOLATION LEVEL READ COMMITTED");

    // 1. Find all expired held seats
    const expiredSeatsRes = await client.query(
      `UPDATE showtime_seats
       SET status = 'AVAILABLE', held_by_user_id = NULL, held_until = NULL, booking_id = NULL, version = version + 1, updated_at = NOW()
       WHERE status = 'HELD' AND held_until < NOW()
       RETURNING id, showtime_id, seat_id`
    );

    // 2. Mark pending bookings that passed their expiry time as EXPIRED
    const expiredBookingsRes = await client.query(
      `UPDATE bookings
       SET status = 'EXPIRED', updated_at = NOW()
       WHERE status = 'PENDING' AND expires_at < NOW()
       RETURNING id`
    );

    await client.query("COMMIT");

    return {
      releasedSeatsCount: expiredSeatsRes.rowCount || 0,
      expiredBookingsCount: expiredBookingsRes.rowCount || 0,
    };
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("releaseExpiredSeatHolds error:", err);
    throw err;
  } finally {
    client.release();
  }
}
