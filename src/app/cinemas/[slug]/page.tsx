"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Compass,
  MapPin,
  Calendar,
  Clock,
  Film,
  Ticket,
  ChevronLeft,
} from "lucide-react";
import { formatTime, formatCurrency } from "@/lib/utils";

export default function CinemaDetailPage() {
  const params = useParams();
  const slug = params?.slug as string;

  const [cinema, setCinema] = useState<any>(null);
  const [schedule, setSchedule] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCinema() {
      if (!slug) return;
      try {
        const res = await fetch(`/api/cinemas/${slug}`);
        const data = await res.json();
        setCinema(data.cinema);
        setSchedule(data.schedule || []);
      } catch (err) {
        console.error("Failed to load cinema:", err);
      } finally {
        setLoading(false);
      }
    }
    loadCinema();
  }, [slug]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <div className="w-12 h-12 border-4 border-cinema-rose border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  if (!cinema) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-white">Cinema Not Found</h2>
        <Link href="/cinemas" className="text-xs text-cinema-rose underline">
          Back to Cinemas
        </Link>
      </div>
    );
  }

  // Group schedule by movie
  const movieGroups = new Map<string, any>();
  schedule.forEach((st) => {
    if (!movieGroups.has(st.movieId)) {
      movieGroups.set(st.movieId, {
        movieId: st.movieId,
        movieTitle: st.movieTitle,
        movieSlug: st.movieSlug,
        moviePoster: st.moviePoster,
        durationMins: st.durationMins,
        movieRating: st.movieRating,
        showtimes: [],
      });
    }
    movieGroups.get(st.movieId)!.showtimes.push(st);
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      <Link
        href="/cinemas"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        All Cinemas
      </Link>

      {/* Cinema Header */}
      <div className="glass-panel p-8 rounded-3xl border border-white/10 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-cinema-rose uppercase tracking-widest">
              Premiere Flagship Location
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white mt-1">
              {cinema.name}
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 flex items-center gap-1 mt-1">
              <MapPin className="w-4 h-4 text-cinema-rose flex-shrink-0" />
              <span>
                {cinema.address}, {cinema.city}, {cinema.state} {cinema.postalCode}
              </span>
            </p>
          </div>
        </div>

        {/* Amenities */}
        {cinema.amenities && cinema.amenities.length > 0 && (
          <div className="pt-2 border-t border-white/10 flex flex-wrap gap-2">
            {cinema.amenities.map((a: string) => (
              <span
                key={a}
                className="text-xs px-3 py-1 rounded-full bg-slate-900 border border-white/5 text-slate-300 font-medium"
              >
                ✓ {a}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Movies Playing */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Film className="w-5 h-5 text-cinema-rose" />
          Currently Showing at this Theater
        </h2>

        {movieGroups.size > 0 ? (
          <div className="space-y-6">
            {Array.from(movieGroups.values()).map((m) => (
              <div
                key={m.movieId}
                className="glass-panel p-6 rounded-3xl border border-white/10 flex flex-col sm:flex-row gap-6 items-start sm:items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="w-16 h-24 rounded-xl overflow-hidden bg-slate-900 flex-shrink-0 relative">
                    <img
                      src={m.moviePoster}
                      alt={m.movieTitle}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-white">
                      {m.movieTitle}
                    </h3>
                    <div className="text-xs text-slate-400 flex items-center gap-2 mt-1">
                      <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-bold">
                        {m.movieRating?.replace("_", "-")}
                      </span>
                      <span>{m.durationMins} mins</span>
                    </div>
                  </div>
                </div>

                {/* Showtimes for this movie */}
                <div className="flex flex-wrap gap-3 w-full sm:w-auto">
                  {m.showtimes.map((st: any) => (
                    <Link
                      key={st.id}
                      href={`/showtimes/${st.id}/seats`}
                      className="p-3 rounded-2xl bg-slate-900/90 hover:bg-cinema-rose border border-white/10 hover:border-cinema-rose transition-all text-center min-w-[90px] shadow-sm hover:shadow-md hover:shadow-cinema-rose/30"
                    >
                      <span className="text-sm font-black text-white block">
                        {formatTime(st.startTime)}
                      </span>
                      <span className="text-[10px] font-bold text-sky-400 block mt-0.5">
                        {st.format}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400 block mt-0.5">
                        {formatCurrency(st.priceCents)}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="glass-panel p-8 rounded-3xl border border-white/10 text-center text-xs text-slate-400">
            No upcoming showtimes currently scheduled for this location.
          </div>
        )}
      </div>
    </div>
  );
}
