"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import CheckoutForm from "@/components/checkout/CheckoutForm";
import { ChevronLeft } from "lucide-react";

export default function CheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const bookingId = params?.bookingId as string;

  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadBooking() {
      if (!bookingId) return;
      try {
        const res = await fetch(`/api/bookings/${bookingId}`);
        const data = await res.json();

        if (res.status === 401) {
          router.push(`/login?returnUrl=/checkout/${bookingId}`);
          return;
        }

        if (!res.ok) {
          setError(data.error || "Failed to load booking details");
          return;
        }

        // If already confirmed, redirect straight to digital ticket
        if (data.booking.status === "CONFIRMED") {
          router.push(`/tickets/${data.booking.reference_code}`);
          return;
        }

        setBooking(data.booking);
      } catch (err: any) {
        setError(err.message || "Failed to fetch checkout details");
      } finally {
        setLoading(false);
      }
    }
    loadBooking();
  }, [bookingId, router]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="w-12 h-12 border-4 border-cinema-rose border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-slate-400 mt-4">
          Preparing secure checkout session...
        </p>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="glass-panel p-8 rounded-3xl border border-white/10 space-y-3">
          <h2 className="text-lg font-bold text-white">Booking Unavailable</h2>
          <p className="text-xs text-slate-400">
            {error || "This booking hold has either expired or is not accessible."}
          </p>
          <Link
            href="/movies"
            className="inline-block px-4 py-2 text-xs font-bold bg-cinema-rose text-white rounded-xl shadow-md"
          >
            Browse Movies
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <Link
        href={`/showtimes/${booking.showtime_id}/seats`}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        Modify Seat Selection
      </Link>

      <CheckoutForm booking={booking} />
    </div>
  );
}
