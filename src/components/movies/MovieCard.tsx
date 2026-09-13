"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Clock, Star, Play, Ticket, Calendar } from "lucide-react";
import { formatDuration, formatDate } from "@/lib/utils";
import type { MovieWithGenres } from "@/types";

interface MovieCardProps {
  movie: MovieWithGenres;
  onWatchTrailer?: (url: string, title: string) => void;
}

export default function MovieCard({ movie, onWatchTrailer }: MovieCardProps) {
  const [imageError, setImageError] = useState(false);

  const fallbackImage =
    "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=800&auto=format&fit=crop";

  const ratingColors: Record<string, string> = {
    G: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
    PG: "bg-blue-500/20 text-blue-300 border-blue-500/40",
    PG_13: "bg-amber-500/20 text-amber-300 border-amber-500/40",
    R: "bg-rose-500/20 text-rose-300 border-rose-500/40",
    NC_17: "bg-purple-500/20 text-purple-300 border-purple-500/40",
  };

  const isReleased = new Date(movie.releaseDate) <= new Date();

  return (
    <div className="group glass-card glass-card-hover rounded-2xl overflow-hidden flex flex-col relative border border-white/5 transition-all duration-300">
      {/* Poster Image Container */}
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-slate-900">
        <Image
          src={imageError ? fallbackImage : movie.posterUrl}
          alt={movie.title}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover group-hover:scale-105 transition-transform duration-500"
          onError={() => setImageError(true)}
          priority={false}
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent opacity-80 group-hover:opacity-95 transition-opacity" />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
          <span
            className={`text-[11px] font-bold px-2 py-0.5 rounded-md border backdrop-blur-md ${
              ratingColors[movie.rating] || "bg-slate-800 text-slate-200 border-white/10"
            }`}
          >
            {movie.rating.replace("_", "-")}
          </span>
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-black/60 text-slate-200 border border-white/10 backdrop-blur-md">
            {movie.language}
          </span>
        </div>

        {/* Hover Trailer Button */}
        {movie.trailerUrl && onWatchTrailer && (
          <button
            onClick={(e) => {
              e.preventDefault();
              onWatchTrailer(movie.trailerUrl!, movie.title);
            }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-cinema-rose/90 hover:bg-cinema-rose text-white flex items-center justify-center shadow-lg shadow-cinema-rose/50 opacity-0 group-hover:opacity-100 group-hover:scale-100 scale-75 transition-all duration-200 hover:scale-110 z-10"
            title="Watch Trailer"
          >
            <Play className="w-5 h-5 fill-white ml-0.5" />
          </button>
        )}

        {/* Bottom Poster Info */}
        <div className="absolute bottom-3 left-3 right-3">
          <div className="flex items-center gap-3 text-xs text-slate-300 font-medium">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-cinema-rose" />
              {formatDuration(movie.durationMins)}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-cinema-gold" />
              {formatDate(movie.releaseDate)}
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div>
          <Link href={`/movies/${movie.slug}`}>
            <h3 className="font-bold text-base text-white hover:text-cinema-rose transition-colors line-clamp-1">
              {movie.title}
            </h3>
          </Link>
          <p className="text-xs text-slate-400 line-clamp-2 mt-1 leading-relaxed">
            {movie.synopsis}
          </p>
        </div>

        {/* Genre Tags */}
        <div className="flex flex-wrap gap-1.5">
          {movie.genres?.slice(0, 3).map((g) => (
            <span
              key={g.id}
              className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800/80 text-slate-300 border border-white/5"
            >
              {g.name}
            </span>
          ))}
        </div>

        {/* Action Button */}
        <div className="pt-2 border-t border-white/5">
          <Link
            href={`/movies/${movie.slug}`}
            className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
              isReleased
                ? "bg-cinema-rose hover:bg-rose-600 text-white shadow-md shadow-cinema-rose/20 hover:shadow-cinema-rose/40"
                : "bg-slate-800 hover:bg-slate-700 text-slate-200"
            }`}
          >
            <Ticket className="w-3.5 h-3.5" />
            {isReleased ? "Book Tickets" : "Advance Showtimes"}
          </Link>
        </div>
      </div>
    </div>
  );
}
