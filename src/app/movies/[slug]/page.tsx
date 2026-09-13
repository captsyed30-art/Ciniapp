"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Clock,
  Calendar,
  Play,
  Film,
  Sparkles,
  MapPin,
  Ticket,
  ChevronLeft,
  User,
} from "lucide-react";
import TrailerModal from "@/components/movies/TrailerModal";
import { formatDuration, formatDate, formatTime, formatCurrency } from "@/lib/utils";

export default function MovieDetailPage() {
  const params = useParams();
  const slug = params?.slug as string;

  const [movie, setMovie] = useState<any>(null);
  const [showtimes, setShowtimes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [trailerOpen, setTrailerOpen] = useState(false);

  useEffect(() => {
    async function loadMovie() {
      if (!slug) return;
      try {
        const res = await fetch(`/api/movies/${slug}`);
        const data = await res.json();
        if (data.movie) {
          setMovie(data.movie);
          setShowtimes(data.showtimes || []);

          // Set default date to first available showtime date
          if (data.showtimes && data.showtimes.length > 0) {
            const firstDate = new Date(data.showtimes[0].startTime)
              .toISOString()
              .split("T")[0];
            setSelectedDate(firstDate);
          }
        }
      } catch (err) {
        console.error("Failed to load movie:", err);
      } finally {
        setLoading(false);
      }
    }
    loadMovie();
  }, [slug]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <div className="w-12 h-12 border-4 border-cinema-rose border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-white">Movie Not Found</h2>
        <Link href="/movies" className="text-xs text-cinema-rose underline">
          Return to Catalog
        </Link>
      </div>
    );
  }

  // Extract unique dates from showtimes
  const availableDatesMap = new Map<string, Date>();
  showtimes.forEach((st) => {
    const d = new Date(st.startTime);
    const dateStr = d.toISOString().split("T")[0];
    if (!availableDatesMap.has(dateStr)) {
      availableDatesMap.set(dateStr, d);
    }
  });
  const uniqueDates = Array.from(availableDatesMap.entries()).map(
    ([dateStr, dateObj]) => ({
      dateStr,
      formatted: formatDate(dateObj),
    })
  );

  // Filter showtimes by selected date
  const filteredShowtimes = selectedDate
    ? showtimes.filter((st) => st.startTime.startsWith(selectedDate))
    : showtimes;

  // Group showtimes by Cinema
  const cinemaGroups = new Map<string, any[]>();
  filteredShowtimes.forEach((st) => {
    if (!cinemaGroups.has(st.cinemaName)) {
      cinemaGroups.set(st.cinemaName, []);
    }
    cinemaGroups.get(st.cinemaName)!.push(st);
  });

  return (
    <div className="space-y-12 pb-16">
      {/* Hero Backdrop Banner */}
      <section className="relative w-full min-h-[50vh] sm:min-h-[60vh] flex items-end">
        <div className="absolute inset-0 z-0 overflow-hidden">
          <Image
            src={movie.backdropUrl || movie.posterUrl}
            alt={movie.title}
            fill
            priority
            className="object-cover object-center opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
          <Link
            href="/movies"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-white mb-6 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Movies
          </Link>

          <div className="flex flex-col md:flex-row gap-8 items-start md:items-end">
            {/* Poster Card */}
            <div className="w-44 sm:w-56 aspect-[2/3] rounded-2xl overflow-hidden shadow-2xl border border-white/10 flex-shrink-0 bg-slate-900 relative">
              <Image
                src={movie.posterUrl}
                alt={movie.title}
                fill
                className="object-cover"
              />
            </div>

            {/* Title & Key Meta */}
            <div className="space-y-3 max-w-3xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-md bg-cinema-rose text-white text-xs font-bold shadow-md shadow-cinema-rose/30">
                  {movie.rating.replace("_", "-")}
                </span>
                <span className="text-xs px-2.5 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-white/10 font-semibold">
                  {movie.language}
                </span>
                <span className="flex items-center gap-1 text-xs text-slate-300">
                  <Clock className="w-3.5 h-3.5 text-cinema-gold" />
                  {formatDuration(movie.durationMins)}
                </span>
                <span className="flex items-center gap-1 text-xs text-slate-300">
                  <Calendar className="w-3.5 h-3.5 text-sky-400" />
                  {formatDate(movie.releaseDate)}
                </span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-black text-white">
                {movie.title}
              </h1>

              <div className="flex flex-wrap gap-1.5 pt-1">
                {movie.genres?.map((g: any) => (
                  <span
                    key={g.id}
                    className="text-xs px-3 py-1 rounded-full bg-slate-800/80 text-slate-300 border border-white/5"
                  >
                    {g.name}
                  </span>
                ))}
              </div>

              {movie.trailerUrl && (
                <div className="pt-2">
                  <button
                    onClick={() => setTrailerOpen(true)}
                    className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs border border-white/10 flex items-center gap-2 transition-all"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    Watch Official Trailer
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Main Content & Showtimes Picker */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Left 2 Cols: Showtime Schedule */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Ticket className="w-5 h-5 text-cinema-rose" />
              Select Cinema & Showtime
            </h2>
          </div>

          {/* Date Selector Chips */}
          {uniqueDates.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              {uniqueDates.map((d) => (
                <button
                  key={d.dateStr}
                  onClick={() => setSelectedDate(d.dateStr)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold border flex flex-col items-center transition-all ${
                    selectedDate === d.dateStr
                      ? "bg-cinema-rose text-white border-cinema-rose shadow-lg shadow-cinema-rose/30"
                      : "bg-slate-900 text-slate-300 border-white/10 hover:border-white/20"
                  }`}
                >
                  <span>{d.formatted}</span>
                </button>
              ))}
            </div>
          )}

          {/* Cinemas & Showtime Cards */}
          {cinemaGroups.size > 0 ? (
            <div className="space-y-6">
              {Array.from(cinemaGroups.entries()).map(([cinemaName, times]) => (
                <div
                  key={cinemaName}
                  className="glass-panel p-6 rounded-3xl border border-white/10 space-y-4"
                >
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-cinema-rose" />
                      <h3 className="font-bold text-base text-white">
                        {cinemaName}
                      </h3>
                    </div>
                    <span className="text-[11px] text-slate-400">
                      {times[0]?.cinemaCity}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {times.map((st) => (
                      <Link
                        key={st.id}
                        href={`/showtimes/${st.id}/seats`}
                        className="group p-3 rounded-2xl bg-slate-900/90 hover:bg-cinema-rose border border-white/10 hover:border-cinema-rose transition-all flex flex-col items-center justify-center text-center shadow-sm hover:shadow-md hover:shadow-cinema-rose/30"
                      >
                        <span className="text-sm font-black text-white group-hover:text-white">
                          {formatTime(st.startTime)}
                        </span>
                        <span className="text-[10px] font-bold text-sky-400 group-hover:text-white mt-0.5">
                          {st.format} • {st.screenType}
                        </span>
                        <span className="text-[11px] font-mono text-slate-400 group-hover:text-white/90 mt-1">
                          {formatCurrency(st.priceCents)}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="glass-panel p-8 rounded-2xl border border-white/10 text-center text-xs text-slate-400">
              No showtimes currently scheduled for this date. Check back soon or select another date.
            </div>
          )}
        </div>

        {/* Right Col: Movie Synopsis & Cast */}
        <div className="space-y-6">
          <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider text-cinema-gold">
              About the Movie
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              {movie.synopsis}
            </p>

            {movie.director && (
              <div className="pt-2 border-t border-white/10">
                <span className="text-[10px] font-semibold text-slate-400 uppercase">
                  Director
                </span>
                <div className="text-xs font-bold text-white mt-0.5">
                  {movie.director}
                </div>
              </div>
            )}

            {movie.cast && (
              <div className="pt-2 border-t border-white/10">
                <span className="text-[10px] font-semibold text-slate-400 uppercase">
                  Starring Cast
                </span>
                <div className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                  {movie.cast}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Trailer Modal */}
      {movie.trailerUrl && (
        <TrailerModal
          isOpen={trailerOpen}
          onClose={() => setTrailerOpen(false)}
          trailerUrl={movie.trailerUrl}
          movieTitle={movie.title}
        />
      )}
    </div>
  );
}
