import type { SeatType } from "@/types";

export const SEAT_TYPE_SURCHARGE_CENTS: Record<SeatType, number> = {
  STANDARD: 0,
  VIP: 600, // +$6.00
  RECLINER: 450, // +$4.50
  COUPLE: 800, // +$8.00
  ACCESSIBLE: 0,
};

export const SERVICE_FEE_PER_SEAT_CENTS = 150; // $1.50 per ticket
export const TAX_RATE = 0.0825; // 8.25% state/local sales tax

export interface CalculateOrderPricingInput {
  baseShowtimePriceCents: number;
  seats: Array<{
    seatType: SeatType;
    customMultiplierCents?: number;
  }>;
}

export interface PricingBreakdown {
  seatCount: number;
  itemizedSeats: Array<{
    seatType: SeatType;
    basePriceCents: number;
    surchargeCents: number;
    totalSeatPriceCents: number;
  }>;
  subtotalCents: number;
  serviceFeeCents: number;
  taxCents: number;
  totalCents: number;
}

export function calculateOrderPricing(
  input: CalculateOrderPricingInput
): PricingBreakdown {
  const { baseShowtimePriceCents, seats } = input;
  let subtotalCents = 0;

  const itemizedSeats = seats.map((s) => {
    const surcharge =
      s.customMultiplierCents !== undefined && s.customMultiplierCents > 0
        ? s.customMultiplierCents
        : SEAT_TYPE_SURCHARGE_CENTS[s.seatType] || 0;
    const totalSeatPrice = baseShowtimePriceCents + surcharge;
    subtotalCents += totalSeatPrice;
    return {
      seatType: s.seatType,
      basePriceCents: baseShowtimePriceCents,
      surchargeCents: surcharge,
      totalSeatPriceCents: totalSeatPrice,
    };
  });

  const seatCount = seats.length;
  const serviceFeeCents = seatCount * SERVICE_FEE_PER_SEAT_CENTS;
  const taxableAmount = subtotalCents + serviceFeeCents;
  const taxCents = Math.round(taxableAmount * TAX_RATE);
  const totalCents = subtotalCents + serviceFeeCents + taxCents;

  return {
    seatCount,
    itemizedSeats,
    subtotalCents,
    serviceFeeCents,
    taxCents,
    totalCents,
  };
}
