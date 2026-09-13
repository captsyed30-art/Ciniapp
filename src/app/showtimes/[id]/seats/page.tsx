"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import SeatMap from "@/components/seats/SeatMap";
import { ChevronLeft, AlertCircle } from "lucide-react";
import type { SeatWithState } from "@/types";

export default function SeatSelectionPage() {
  const params = useParams();
  const router = useRouter();
  const showtimeId = params?.id as string;

  const [showtime, setShowtime] = useState<any>(null);
  const [seats, setSeats] = useState<SeatWithState[]>([]);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchSeatMap = async () => {
    if (!showtimeId) return;
    try {
      const res = await fetch(`/api/showtimes/${showtimeId}`);
      const data = await res.json();
      if (res.ok) {
        setShowtime(data.showtime);
        setSeats(data.seats || []);
      } else {
        setErrorMessage(data.error || "Failed to load seat map");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Network error loading seats");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSeatMap();
  }, [showtimeId]);

  const handleProceedToCheckout = async (selectedSeatIds: string[]) => {
    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/bookings/hold", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          showtimeId,
          seatIds: selectedSeatIds,
        }),
      });

      const data = await res.json();

      if (res.status === 401) {
        // Redirect to login with return URL
        router.push(`/login?returnUrl=/showtimes/${showtimeId}/seats`);
        return;
      }

      if (!res.ok) {
        throw new Error(
          data.error || "Selected seats are no longer available. Refreshing map..."
        );
      }

      // Navigate to checkout
      router.push(`/checkout/${data.bookingId}`);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to hold seats.");
      // Refresh seat map to reflect newest availability
      await fetchSeatMap();
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="w-12 h-12 border-4 border-cinema-rose border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-slate-400 mt-4">
          Loading live auditorium seat availability...
        </p>
      </div>
    );
  }

  if (!showtime) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-white">Showtime Not Found</h2>
        <Link href="/movies" className="text-xs text-cinema-rose underline">
          Return to Movies
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Back Link & Title */}
      <div className="flex items-center justify-between">
        <Link
          href={`/movies/${showtime.movieSlug}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Showtime Selection
        </Link>
      </div>

      {/* Error alert if seat conflict occurs */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-3 text-xs text-rose-300 animate-pop">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Interactive Seat Map */}
      <SeatMap
        showtime={{
          id: showtime.id,
          priceCents: showtime.priceCents,
          format: showtime.format,
          movieTitle: showtime.movieTitle,
          movieRating: showtime.movieRating,
          auditoriumName: showtime.auditoriumName,
          cinemaName: showtime.cinemaName,
          startTime: showtime.startTime,
        }}
        seats={seats}
        onProceedToCheckout={handleProceedToCheckout}
        isProcessing={isProcessing}
      />
    </div>
  );
}
