"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  CreditCard,
  ShieldCheck,
  Clock,
  Sparkles,
  Lock,
  CheckCircle,
  AlertTriangle,
  Film,
  Ticket,
} from "lucide-react";
import { formatCurrency, formatDateTime } from "@/lib/utils";

interface CheckoutFormProps {
  booking: any;
}

export default function CheckoutForm({ booking }: CheckoutFormProps) {
  const router = useRouter();
  const [cardNumber, setCardNumber] = useState("4242 4242 4242 4242");
  const [cardHolder, setCardHolder] = useState("Alex Mercer");
  const [expiry, setExpiry] = useState("12/28");
  const [cvv, setCvv] = useState("892");
  const [cardBrand, setCardBrand] = useState("Visa");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [idempotencyKey, setIdempotencyKey] = useState<string>("");
  const [timeLeft, setTimeLeft] = useState<string>("");

  useEffect(() => {
    // Generate unique idempotency key on mount
    setIdempotencyKey(`idemp_${booking.id}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`);
  }, [booking.id]);

  // Hold expiration countdown
  useEffect(() => {
    const expiresAt = new Date(booking.expires_at).getTime();

    const timer = setInterval(() => {
      const now = Date.now();
      const diff = expiresAt - now;

      if (diff <= 0) {
        setTimeLeft("00:00 (Hold Expired)");
        clearInterval(timer);
      } else {
        const mins = Math.floor(diff / 60000);
        const secs = Math.floor((diff % 60000) / 1000);
        setTimeLeft(`${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [booking.expires_at]);

  const handleTestCardFill = (brand: string, num: string) => {
    setCardBrand(brand);
    setCardNumber(num);
    setExpiry("12/28");
    setCvv("892");
  };

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setError(null);

    try {
      const last4 = cardNumber.replace(/\s+/g, "").slice(-4) || "4242";

      const res = await fetch("/api/bookings/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: booking.id,
          idempotencyKey,
          cardBrand,
          last4,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Payment failed");
      }

      // Route to digital ticket view
      router.push(`/tickets/${booking.reference_code}`);
    } catch (err: any) {
      setError(err.message || "An error occurred while confirming your reservation.");
      setIsProcessing(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Left 7 Cols: Payment Details */}
      <div className="lg:col-span-7 space-y-6">
        {/* Hold Expiry Alert */}
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-amber-400" />
            <div>
              <div className="text-xs font-bold text-amber-300">Seats Locked & Held</div>
              <div className="text-[11px] text-slate-300">
                Complete payment before hold expires.
              </div>
            </div>
          </div>
          <div className="font-mono text-sm font-bold text-amber-400 bg-amber-500/20 px-3 py-1 rounded-xl">
            {timeLeft || "Calculating..."}
          </div>
        </div>

        {/* Test Mode Notification */}
        <div className="glass-card p-4 rounded-2xl border border-sky-500/30 bg-sky-950/20 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-sky-400 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" />
              Test Gateway Sandbox Mode
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30">
              No Real Charges
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => handleTestCardFill("Visa", "4242 4242 4242 4242")}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] font-semibold text-slate-200 border border-white/5 transition-colors"
            >
              💳 Visa (4242)
            </button>
            <button
              type="button"
              onClick={() => handleTestCardFill("Mastercard", "5555 5555 5555 4444")}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] font-semibold text-slate-200 border border-white/5 transition-colors"
            >
              💳 Mastercard (5555)
            </button>
            <button
              type="button"
              onClick={() => handleTestCardFill("Amex", "3782 822463 10005")}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] font-semibold text-slate-200 border border-white/5 transition-colors"
            >
              💳 Amex (3782)
            </button>
          </div>
        </div>

        {/* Payment Form */}
        <form onSubmit={handleSubmitPayment} className="glass-panel p-6 rounded-3xl border border-white/10 space-y-5">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-cinema-rose" />
            Payment Information
          </h3>

          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-1">
              Cardholder Name
            </label>
            <input
              type="text"
              required
              value={cardHolder}
              onChange={(e) => setCardHolder(e.target.value)}
              className="w-full p-2.5 bg-slate-900 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-cinema-rose"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-1">
              Card Number
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value)}
                className="w-full p-2.5 bg-slate-900 border border-white/10 rounded-xl text-sm font-mono text-white focus:outline-none focus:border-cinema-rose"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                {cardBrand}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">
                Expiry Date
              </label>
              <input
                type="text"
                required
                placeholder="MM/YY"
                value={expiry}
                onChange={(e) => setExpiry(e.target.value)}
                className="w-full p-2.5 bg-slate-900 border border-white/10 rounded-xl text-sm font-mono text-white focus:outline-none focus:border-cinema-rose"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">
                Security Code (CVV)
              </label>
              <input
                type="text"
                required
                placeholder="123"
                value={cvv}
                onChange={(e) => setCvv(e.target.value)}
                className="w-full p-2.5 bg-slate-900 border border-white/10 rounded-xl text-sm font-mono text-white focus:outline-none focus:border-cinema-rose"
              />
            </div>
          </div>

          <div className="pt-3">
            <button
              type="submit"
              disabled={isProcessing}
              className="w-full py-4 rounded-2xl bg-cinema-rose hover:bg-rose-600 disabled:opacity-50 text-white font-bold text-base shadow-xl shadow-cinema-rose/30 flex items-center justify-center gap-2 transition-all hover:scale-[1.01]"
            >
              {isProcessing ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Processing Secure Payment...</span>
                </div>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Pay {formatCurrency(booking.total_cents)} & Confirm Booking</span>
                </>
              )}
            </button>
            <div className="flex items-center justify-center gap-2 text-[11px] text-slate-500 mt-3">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>256-bit SSL encrypted • Idempotent transaction protected</span>
            </div>
          </div>
        </form>
      </div>

      {/* Right 5 Cols: Order Summary */}
      <div className="lg:col-span-5 space-y-6">
        <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-5">
          <div className="border-b border-white/10 pb-4">
            <span className="text-[10px] font-bold text-cinema-rose uppercase tracking-wider">
              Booking Reference
            </span>
            <div className="text-lg font-mono font-extrabold text-white mt-0.5">
              {booking.reference_code}
            </div>
          </div>

          {/* Movie Details */}
          <div className="flex gap-4">
            <div className="w-16 h-24 rounded-xl overflow-hidden bg-slate-900 flex-shrink-0 relative">
              <img
                src={booking.moviePoster}
                alt={booking.movieTitle}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-white line-clamp-1">
                {booking.movieTitle}
              </h4>
              <div className="text-xs text-slate-400">
                {booking.cinemaName}
              </div>
              <div className="text-xs text-slate-400">
                {booking.auditoriumName} • {booking.format}
              </div>
              <div className="text-xs text-cinema-gold font-medium">
                {formatDateTime(booking.startTime)}
              </div>
            </div>
          </div>

          {/* Reserved Seats List */}
          <div>
            <div className="text-xs font-semibold text-slate-400 mb-2">
              Reserved Seats ({booking.items?.length || 0})
            </div>
            <div className="space-y-1.5">
              {booking.items?.map((item: any) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-2 rounded-xl bg-slate-900/60 border border-white/5 text-xs"
                >
                  <span className="font-semibold text-white">
                    Seat {item.seatLabel} <span className="text-slate-400 text-[10px]">({item.seatType})</span>
                  </span>
                  <span className="font-mono text-slate-300">
                    {formatCurrency(item.priceCents)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Breakdown */}
          <div className="border-t border-white/10 pt-4 space-y-2 text-xs">
            <div className="flex items-center justify-between text-slate-300">
              <span>Subtotal</span>
              <span className="font-mono">{formatCurrency(booking.subtotal_cents)}</span>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span>Booking Fee</span>
              <span className="font-mono">{formatCurrency(booking.service_fee_cents)}</span>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span>Taxes & Levies</span>
              <span className="font-mono">{formatCurrency(booking.tax_cents)}</span>
            </div>
            <div className="border-t border-white/10 pt-3 flex items-center justify-between text-base font-bold text-white">
              <span>Final Total</span>
              <span className="text-cinema-rose font-mono text-lg">
                {formatCurrency(booking.total_cents)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
