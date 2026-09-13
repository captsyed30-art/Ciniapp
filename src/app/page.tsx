"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Sparkles,
  Ticket,
  Play,
  Clock,
  Calendar,
  Compass,
  Film,
  Flame,
  ShieldCheck,
  ChevronRight,
} from "lucide-react";
import MovieCard from "@/components/movies/MovieCard";
import TrailerModal from "@/components/movies/TrailerModal";
import { formatDuration } from "@/lib/utils";
import type { MovieWithGenres } from "@/types";

export default function HomePage() {
  const [movies, setMovies] = useState<MovieWithGenres[]>([]);
  const [featuredIndex, setFeaturedIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [trailerModal, setTrailerModal] = useState<{
    isOpen: boolean;
    url: string;
    title: string;
  }>({
    isOpen: false,
    url: "",
    title: "",
  });

  useEffect(() => {
    async function loadMovies() {
      try {
        const res = await fetch("/api/movies");
        const data = await res.json();
        setMovies(data.movies || []);
      } catch (err) {
        console.error("Failed to load movies:", err);
      } finally {
        setLoading(false);
      }
    }
    loadMovies();
  }, []);

  const featuredMovie = movies[featuredIndex] || movies[0];

  const handleOpenTrailer = (url: string, title: string) => {
    setTrailerModal({ isOpen: true, url, title });
  };

  return (
    <div className="space-y-16 pb-12">
      {/* Hero Banner Section */}
      {featuredMovie ? (
        <section className="relative w-full min-h-[75vh] flex items-center overflow-hidden">
          {/* Background Backdrop Image */}
          <div className="absolute inset-0 z-0">
            <Image
              src={featuredMovie.backdropUrl || featuredMovie.posterUrl}
              alt={featuredMovie.title}
              fill
              priority
              className="object-cover object-center opacity-40 scale-105 transition-all duration-1000"
            />
            {/* Cinematic Gradient Overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-background via-background/60 to-transparent" />
            <div className="absolute inset-0 bg-cinema-glow pointer-events-none" />
          </div>

          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 w-full">
            <div className="max-w-2xl space-y-6">
              {/* Top Tag */}
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 rounded-full bg-cinema-rose/20 text-cinema-rose border border-cinema-rose/30 text-xs font-bold flex items-center gap-1.5 backdrop-blur-md">
                  <Flame className="w-3.5 h-3.5 fill-cinema-rose" />
                  Featured Blockbuster
                </span>
                <span className="px-2.5 py-0.5 rounded-md bg-slate-900/80 border border-white/10 text-xs font-semibold text-slate-300">
                  {featuredMovie.rating.replace("_", "-")}
                </span>
                <span className="flex items-center gap-1 text-xs text-slate-300">
                  <Clock className="w-3.5 h-3.5 text-cinema-gold" />
                  {formatDuration(featuredMovie.durationMins)}
                </span>
              </div>

              {/* Title */}
              <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white leading-none">
                {featuredMovie.title}
              </h1>

              {/* Synopsis */}
              <p className="text-sm sm:text-base text-slate-300 line-clamp-3 leading-relaxed">
                {featuredMovie.synopsis}
              </p>

              {/* Genres */}
              <div className="flex flex-wrap gap-2">
                {featuredMovie.genres?.map((g) => (
                  <span
                    key={g.id}
                    className="text-xs px-3 py-1 rounded-full bg-slate-800/80 text-slate-200 border border-white/10 backdrop-blur-md"
                  >
                    {g.name}
                  </span>
                ))}
              </div>

              {/* Actions */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Link
                  href={`/movies/${featuredMovie.slug}`}
                  className="px-6 py-3.5 rounded-2xl bg-cinema-rose hover:bg-rose-600 text-white font-bold text-sm shadow-xl shadow-cinema-rose/30 flex items-center gap-2 transition-all hover:scale-105"
                >
                  <Ticket className="w-4 h-4" />
                  Select Seats & Book
                </Link>

                {featuredMovie.trailerUrl && (
                  <button
                    onClick={() =>
                      handleOpenTrailer(
                        featuredMovie.trailerUrl!,
                        featuredMovie.title
                      )
                    }
                    className="px-5 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-semibold text-sm border border-white/10 backdrop-blur-md flex items-center gap-2 transition-all"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    Watch Trailer
                  </button>
                )}
              </div>

              {/* Quick Carousel Selector */}
              {movies.length > 1 && (
                <div className="pt-6 flex items-center gap-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-2">
                    Trending:
                  </span>
                  {movies.slice(0, 4).map((m, idx) => (
                    <button
                      key={m.id}
                      onClick={() => setFeaturedIndex(idx)}
                      className={`h-2 rounded-full transition-all duration-300 ${
                        featuredIndex === idx
                          ? "w-8 bg-cinema-rose"
                          : "w-2 bg-slate-700 hover:bg-slate-500"
                      }`}
                      title={m.title}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      ) : loading ? (
        <div className="w-full h-[60vh] bg-slate-900 animate-pulse" />
      ) : null}

      {/* Now Showing Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-cinema-rose uppercase tracking-widest">
              <Film className="w-4 h-4" />
              In Theaters Now
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
              Now Showing
            </h2>
          </div>

          <Link
            href="/movies"
            className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white transition-colors"
          >
            View All Movies
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Movie Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {movies.slice(0, 8).map((movie) => (
            <MovieCard
              key={movie.id}
              movie={movie}
              onWatchTrailer={handleOpenTrailer}
            />
          ))}
        </div>
      </section>

      {/* Experience Formats & Cinema Tech */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="glass-panel p-8 rounded-3xl border border-white/10 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-cinema-rose/10 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-2xl space-y-4 mb-8">
            <span className="text-xs font-bold text-cinema-gold uppercase tracking-widest flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" />
              Next-Gen Cinema Tech
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              Immerse Yourself in Pure Cinema
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Every auditorium features certified state-of-the-art projection and sound standards designed to place you inside the storytelling.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="glass-card p-5 rounded-2xl border border-white/5 space-y-2">
              <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold text-xs">
                IMAX
              </div>
              <h4 className="font-bold text-white text-sm">IMAX Laser 4K</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Crystal-clear laser projection with bespoke geometry and dual 4K engines.
              </p>
            </div>

            <div className="glass-card p-5 rounded-2xl border border-white/5 space-y-2">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-xs">
                DOLBY
              </div>
              <h4 className="font-bold text-white text-sm">Dolby Atmos</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Object-based 3D sound that moves dynamically around and above you.
              </p>
            </div>

            <div className="glass-card p-5 rounded-2xl border border-white/5 space-y-2">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold text-xs">
                4DX
              </div>
              <h4 className="font-bold text-white text-sm">4DX Motion & Effects</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Synchronized motion seats with wind, mist, and ambient environmental cues.
              </p>
            </div>

            <div className="glass-card p-5 rounded-2xl border border-white/5 space-y-2">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs">
                VIP
              </div>
              <h4 className="font-bold text-white text-sm">Luxe Recliners</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Plush leather recliners with motorized footrests and at-seat bistro service.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Trailer Modal */}
      <TrailerModal
        isOpen={trailerModal.isOpen}
        onClose={() =>
          setTrailerModal({ isOpen: false, url: "", title: "" })
        }
        trailerUrl={trailerModal.url}
        movieTitle={trailerModal.title}
      />
    </div>
  );
}
