"use client";

import React, { useState, useEffect } from "react";
import {
  Armchair,
  Info,
  Clock,
  Sparkles,
  ShieldAlert,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { calculateOrderPricing } from "@/lib/pricing";
import type { SeatWithState, SeatType } from "@/types";

interface SeatMapProps {
  showtime: {
    id: string;
    priceCents: number;
    format: string;
    movieTitle: string;
    movieRating: string;
    auditoriumName: string;
    cinemaName: string;
    startTime: string;
  };
  seats: SeatWithState[];
  onProceedToCheckout: (selectedSeatIds: string[]) => Promise<void>;
  isProcessing: boolean;
  holdExpiresAt?: string | null;
}

export default function SeatMap({
  showtime,
  seats,
  onProceedToCheckout,
  isProcessing,
  holdExpiresAt,
}: SeatMapProps) {
  const [selectedSeatIds, setSelectedSeatIds] = useState<string[]>([]);
  const [timeLeft, setTimeLeft] = useState<string | null>(null);

  // Countdown timer if seats are currently held
  useEffect(() => {
    if (!holdExpiresAt) {
      setTimeLeft(null);
      return;
    }

    const interval = setInterval(() => {
      const now = Date.now();
      const end = new Date(holdExpiresAt).getTime();
      const diffMs = end - now;

      if (diffMs <= 0) {
        setTimeLeft("00:00 (Expired)");
        clearInterval(interval);
      } else {
        const mins = Math.floor(diffMs / 60000);
        const secs = Math.floor((diffMs % 60000) / 1000);
        setTimeLeft(
          `${mins.toString().padStart(2, "0")}:${secs
            .toString()
            .padStart(2, "0")}`
        );
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [holdExpiresAt]);

  // Group seats by row
  const rowMap = new Map<string, SeatWithState[]>();
  seats.forEach((seat) => {
    if (!rowMap.has(seat.row)) {
      rowMap.set(seat.row, []);
    }
    rowMap.get(seat.row)!.push(seat);
  });

  // Sort rows alphabetically
  const sortedRows = Array.from(rowMap.keys()).sort();

  const toggleSeatSelection = (seat: SeatWithState) => {
    if (seat.status !== "AVAILABLE" && !seat.isMyHold) return;

    if (selectedSeatIds.includes(seat.seatId)) {
      setSelectedSeatIds(selectedSeatIds.filter((id) => id !== seat.seatId));
    } else {
      if (selectedSeatIds.length >= 8) {
        alert("Maximum 8 seats can be selected per booking.");
        return;
      }
      setSelectedSeatIds([...selectedSeatIds, seat.seatId]);
    }
  };

  // Selected seats objects
  const selectedSeatsObj = seats.filter((s) =>
    selectedSeatIds.includes(s.seatId)
  );

  const pricing = calculateOrderPricing({
    baseShowtimePriceCents: showtime.priceCents,
    seats: selectedSeatsObj.map((s) => ({
      seatType: s.seatType,
      customMultiplierCents: s.priceMultiplierCents,
    })),
  });

  const getSeatColor = (seat: SeatWithState, isSelected: boolean) => {
    if (isSelected) {
      return "bg-cinema-rose text-white shadow-lg shadow-cinema-rose/50 scale-110 border-rose-300 ring-2 ring-rose-400";
    }

    if (seat.status === "BOOKED") {
      return "bg-slate-800/60 text-slate-600 border-slate-800 cursor-not-allowed opacity-50";
    }

    if (seat.status === "BLOCKED") {
      return "bg-zinc-800 text-zinc-600 border-zinc-700 cursor-not-allowed opacity-40";
    }

    if (seat.status === "HELD") {
      if (seat.isMyHold) {
        return "bg-cinema-rose/80 text-white border-cinema-rose shadow-md animate-pulse";
      }
      return "bg-amber-500/20 text-amber-500 border-amber-500/40 cursor-not-allowed";
    }

    // Available seat styles by type
    switch (seat.seatType) {
      case "VIP":
        return "bg-purple-950/40 text-purple-300 border-purple-500/40 hover:bg-purple-900/60 hover:border-purple-400 hover:scale-105";
      case "RECLINER":
        return "bg-indigo-950/40 text-indigo-300 border-indigo-500/40 hover:bg-indigo-900/60 hover:border-indigo-400 hover:scale-105";
      case "ACCESSIBLE":
        return "bg-sky-950/40 text-sky-300 border-sky-500/40 hover:bg-sky-900/60 hover:border-sky-400 hover:scale-105";
      default:
        return "bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-800 hover:border-slate-500 hover:scale-105";
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Left 2 Cols: Screen & Interactive Grid */}
      <div className="lg:col-span-2 glass-panel p-6 rounded-3xl border border-white/10 flex flex-col items-center">
        {/* Curved Screen Visualizer */}
        <div className="w-full max-w-xl mx-auto text-center mb-8 relative">
          <div className="curved-screen mb-2" />
          <div className="h-12 w-full bg-gradient-to-b from-sky-400/10 to-transparent pointer-events-none rounded-b-full blur-sm" />
          <span className="text-[11px] font-bold uppercase tracking-widest text-sky-400/80">
            CINEMATIC SCREEN PROJECTION
          </span>
        </div>

        {/* Seat Grid */}
        <div className="w-full overflow-x-auto pb-4 scrollbar-none flex flex-col items-center">
          <div className="space-y-3 min-w-[500px]">
            {sortedRows.map((rowLetter) => {
              const rowSeats = rowMap
                .get(rowLetter)!
                .sort((a, b) => a.number - b.number);

              return (
                <div key={rowLetter} className="flex items-center justify-center gap-2">
                  {/* Row Letter Left */}
                  <span className="w-6 text-center text-xs font-bold text-slate-500">
                    {rowLetter}
                  </span>

                  {/* Seat Buttons */}
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    {rowSeats.map((seat) => {
                      const isSelected = selectedSeatIds.includes(seat.seatId);
                      const isUnavailable =
                        seat.status === "BOOKED" ||
                        seat.status === "BLOCKED" ||
                        (seat.status === "HELD" && !seat.isMyHold);

                      return (
                        <button
                          key={seat.seatId}
                          disabled={isUnavailable || isProcessing}
                          onClick={() => toggleSeatSelection(seat)}
                          title={`Seat ${seat.row}${seat.number} (${seat.seatType}) - ${formatCurrency(
                            seat.priceCents
                          )}`}
                          className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg border text-[10px] sm:text-xs font-bold flex items-center justify-center transition-all duration-150 relative group ${getSeatColor(
                            seat,
                            isSelected
                          )}`}
                        >
                          {seat.number}
                          {seat.seatType === "VIP" && !isSelected && (
                            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-purple-400 shadow-sm" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Row Letter Right */}
                  <span className="w-6 text-center text-xs font-bold text-slate-500">
                    {rowLetter}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Seat Legend */}
        <div className="mt-8 pt-6 border-t border-white/10 w-full flex flex-wrap items-center justify-center gap-4 text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <div className="w-5 h-5 rounded-md bg-slate-900 border border-slate-700 text-[10px] flex items-center justify-center font-bold">
              1
            </div>
            <span>Standard ({formatCurrency(showtime.priceCents)})</span>
          </div>
          <div className="flex items-center gap-2 text-purple-300">
            <div className="w-5 h-5 rounded-md bg-purple-950/50 border border-purple-500/40 text-[10px] flex items-center justify-center font-bold">
              1
            </div>
            <span>VIP (+{formatCurrency(600)})</span>
          </div>
          <div className="flex items-center gap-2 text-indigo-300">
            <div className="w-5 h-5 rounded-md bg-indigo-950/50 border border-indigo-500/40 text-[10px] flex items-center justify-center font-bold">
              1
            </div>
            <span>Recliner (+{formatCurrency(450)})</span>
          </div>
          <div className="flex items-center gap-2 text-cinema-rose">
            <div className="w-5 h-5 rounded-md bg-cinema-rose text-white text-[10px] flex items-center justify-center font-bold shadow-md shadow-cinema-rose/40">
              ✓
            </div>
            <span>Selected</span>
          </div>
          <div className="flex items-center gap-2 text-amber-400">
            <div className="w-5 h-5 rounded-md bg-amber-500/20 border border-amber-500/40 text-[10px] flex items-center justify-center font-bold">
              ⌛
            </div>
            <span>Held (In Cart)</span>
          </div>
          <div className="flex items-center gap-2 text-slate-500">
            <div className="w-5 h-5 rounded-md bg-slate-800/60 border border-slate-800 text-[10px] flex items-center justify-center font-bold opacity-50">
              ✕
            </div>
            <span>Sold / Unavailable</span>
          </div>
        </div>
      </div>

      {/* Right Col: Booking Order Summary & Hold Timer */}
      <div className="glass-panel p-6 rounded-3xl border border-white/10 flex flex-col justify-between space-y-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="border-b border-white/10 pb-4">
            <span className="text-[10px] font-bold text-cinema-rose tracking-wider uppercase">
              Selected Showtime
            </span>
            <h2 className="text-xl font-bold text-white mt-0.5">
              {showtime.movieTitle}
            </h2>
            <div className="text-xs text-slate-400 mt-1 flex items-center gap-2">
              <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-semibold">
                {showtime.format}
              </span>
              <span>{showtime.auditoriumName}</span>
            </div>
            <div className="text-xs text-slate-400 mt-1">
              📍 {showtime.cinemaName}
            </div>
          </div>

          {/* Hold Countdown if active */}
          {timeLeft && (
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-3 animate-pulse">
              <Clock className="w-5 h-5 text-amber-400 flex-shrink-0" />
              <div>
                <div className="text-xs font-bold text-amber-300">
                  Temporary Hold Active
                </div>
                <div className="text-[11px] text-slate-300">
                  Time remaining to complete checkout:{" "}
                  <span className="font-mono font-bold text-amber-400">
                    {timeLeft}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Selected Seats Chips */}
          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-2">
              Selected Seats ({selectedSeatIds.length}/8)
            </label>
            {selectedSeatIds.length === 0 ? (
              <div className="p-4 rounded-xl border border-dashed border-white/10 text-center text-xs text-slate-500">
                Click seats on the map above to select your spot.
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {selectedSeatsObj.map((s) => (
                  <div
                    key={s.seatId}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 border border-white/10 text-xs font-semibold text-white"
                  >
                    <span>{s.row}{s.number}</span>
                    <span className="text-[10px] text-slate-400">({s.seatType})</span>
                    <button
                      onClick={() => toggleSeatSelection(s)}
                      className="text-slate-400 hover:text-rose-400 ml-1"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Price Breakdown */}
          {selectedSeatIds.length > 0 && (
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-white/5 space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-300">
                <span>Tickets Subtotal ({pricing.seatCount})</span>
                <span className="font-mono">{formatCurrency(pricing.subtotalCents)}</span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>Service Fee ($1.50 / ticket)</span>
                <span className="font-mono">{formatCurrency(pricing.serviceFeeCents)}</span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>Estimated Tax (8.25%)</span>
                <span className="font-mono">{formatCurrency(pricing.taxCents)}</span>
              </div>
              <div className="border-t border-white/10 pt-2 flex items-center justify-between text-sm font-bold text-white">
                <span>Total Amount</span>
                <span className="text-base text-cinema-rose font-mono">
                  {formatCurrency(pricing.totalCents)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Action Button */}
        <div>
          <button
            disabled={selectedSeatIds.length === 0 || isProcessing}
            onClick={() => onProceedToCheckout(selectedSeatIds)}
            className="w-full py-3.5 px-6 rounded-2xl font-bold text-sm bg-cinema-rose hover:bg-rose-600 disabled:opacity-40 disabled:cursor-not-allowed text-white shadow-xl shadow-cinema-rose/30 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            {isProcessing ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Acquiring Seat Lock...</span>
              </div>
            ) : (
              <>
                <span>Hold & Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
          <p className="text-[10px] text-center text-slate-500 mt-2">
            Selected seats will be held for 10 minutes upon proceeding.
          </p>
        </div>
      </div>
    </div>
  );
}
