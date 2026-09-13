"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Ticket,
  Calendar,
  Clock,
  MapPin,
  QrCode,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Film,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { formatCurrency, formatDateTime } from "@/lib/utils";

export default function BookingsHistoryPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [cancelMessage, setCancelMessage] = useState<string | null>(null);

  const fetchBookings = async () => {
    try {
      const res = await fetch("/api/bookings/my");
      const data = await res.json();
      if (res.status === 401) {
        router.push("/login?returnUrl=/bookings");
        return;
      }
      setBookings(data.bookings || []);
    } catch (err) {
      console.error("Failed to load bookings:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleCancelBooking = async (bookingId: string) => {
    if (
      !confirm(
        "Are you sure you want to cancel this booking? Your seats will be immediately released and full payment refunded."
      )
    ) {
      return;
    }

    setCancellingId(bookingId);
    setCancelMessage(null);

    try {
      const res = await fetch(`/api/bookings/${bookingId}/cancel`, {
        method: "POST",
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to cancel booking");
      }

      setCancelMessage("Booking successfully cancelled and refunded.");
      await fetchBookings();
    } catch (err: any) {
      alert(err.message || "Could not cancel booking");
    } finally {
      setCancellingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "CONFIRMED":
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Confirmed
          </span>
        );
      case "CANCELLED":
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold flex items-center gap-1">
            <XCircle className="w-3.5 h-3.5" /> Cancelled & Refunded
          </span>
        );
      case "EXPIRED":
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-white/5 text-xs font-semibold">
            Expired Hold
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-cinema-rose uppercase tracking-widest">
            <Ticket className="w-4 h-4" />
            Your Reservations
          </div>
          <h1 className="text-3xl font-extrabold text-white mt-1">
            My Bookings & Digital Tickets
          </h1>
        </div>

        <Link
          href="/movies"
          className="px-4 py-2 text-xs font-bold bg-cinema-rose hover:bg-rose-600 text-white rounded-xl shadow-lg shadow-cinema-rose/20 flex items-center gap-1.5 transition-all self-start sm:self-auto"
        >
          <Film className="w-3.5 h-3.5" />
          Book Another Movie
        </Link>
      </div>

      {cancelMessage && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 animate-pop">
          {cancelMessage}
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-40 rounded-3xl bg-slate-900 animate-pulse border border-white/5"
            />
          ))}
        </div>
      ) : bookings.length > 0 ? (
        <div className="space-y-4">
          {bookings.map((b) => {
            const isConfirmed = b.status === "CONFIRMED";
            const showtimeDate = new Date(b.startTime);
            const now = new Date();
            const isEligibleForCancel =
              isConfirmed &&
              (showtimeDate.getTime() - now.getTime()) / (1000 * 60 * 60) >= 2;

            return (
              <div
                key={b.id}
                className="glass-panel p-6 rounded-3xl border border-white/10 space-y-4 transition-all hover:border-white/20"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm font-bold text-white">
                      Ref: {b.referenceCode}
                    </span>
                    {getStatusBadge(b.status)}
                  </div>
                  <span className="text-xs text-slate-400">
                    Booked on {formatDateTime(b.createdAt)}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                  {/* Movie & Venue Info */}
                  <div className="md:col-span-8 flex gap-4">
                    <div className="w-16 h-24 rounded-xl overflow-hidden bg-slate-900 flex-shrink-0 relative">
                      <img
                        src={b.moviePoster}
                        alt={b.movieTitle}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-bold text-base text-white">
                        {b.movieTitle}
                      </h3>
                      <p className="text-xs text-slate-400">
                        {b.cinemaName} • {b.auditoriumName} ({b.format})
                      </p>
                      <p className="text-xs text-cinema-gold font-medium">
                        {formatDateTime(b.startTime)}
                      </p>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {b.items?.map((item: any) => (
                          <span
                            key={item.id}
                            className="text-[10px] px-2 py-0.5 rounded-md bg-slate-900 text-slate-300 font-mono border border-white/5"
                          >
                            Seat {item.seatLabel}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Actions & Price (4 Cols) */}
                  <div className="md:col-span-4 flex flex-col items-end justify-center space-y-3">
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 uppercase">
                        Total Amount
                      </span>
                      <div className="text-lg font-black text-cinema-rose font-mono">
                        {formatCurrency(b.totalCents)}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {isConfirmed && (
                        <Link
                          href={`/tickets/${b.referenceCode}`}
                          className="px-4 py-2 rounded-xl bg-cinema-rose hover:bg-rose-600 text-xs font-bold text-white shadow-md shadow-cinema-rose/20 flex items-center gap-1.5 transition-all"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                          View QR Tickets
                        </Link>
                      )}

                      {isEligibleForCancel && (
                        <button
                          disabled={cancellingId === b.id}
                          onClick={() => handleCancelBooking(b.id)}
                          className="px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-xs font-semibold text-rose-300 border border-rose-500/30 transition-colors"
                        >
                          {cancellingId === b.id ? "Cancelling..." : "Cancel"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="glass-panel p-12 rounded-3xl border border-white/10 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
            <Ticket className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-white">No Bookings Found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            You don't have any movie reservations yet. Browse movies and pick your favorite seats!
          </p>
          <Link
            href="/movies"
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-cinema-rose text-white text-xs font-bold shadow-lg shadow-cinema-rose/25"
          >
            Explore Now Showing <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}
    </div>
  );
}
