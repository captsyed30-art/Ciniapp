"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Compass,
  MapPin,
  Sparkles,
  Phone,
  Film,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";

export default function CinemasPage() {
  const [cinemas, setCinemas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCinemas() {
      try {
        const res = await fetch("/api/cinemas");
        const data = await res.json();
        setCinemas(data.cinemas || []);
      } catch (err) {
        console.error("Failed to load cinemas:", err);
      } finally {
        setLoading(false);
      }
    }
    loadCinemas();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-bold text-cinema-rose uppercase tracking-widest">
          <Compass className="w-4 h-4" />
          Theaters & Destinations
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white mt-1">
          Our Cinema Locations
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Explore our premiere flagship theaters equipped with IMAX Laser, Dolby Atmos, and luxury dining.
        </p>
      </div>

      {/* Cinemas Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-64 rounded-3xl bg-slate-900 animate-pulse border border-white/5"
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {cinemas.map((cinema) => (
            <div
              key={cinema.id}
              className="glass-panel glass-card-hover rounded-3xl p-6 border border-white/10 flex flex-col justify-between space-y-6"
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cinema-rose to-cinema-gold flex items-center justify-center text-white shadow-md">
                    <Compass className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-white/10">
                    {cinema.city}, {cinema.state}
                  </span>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-white">
                    {cinema.name}
                  </h3>
                  <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                    <MapPin className="w-3.5 h-3.5 text-cinema-rose flex-shrink-0" />
                    <span>{cinema.address}</span>
                  </p>
                </div>

                {/* Amenities */}
                {cinema.amenities && cinema.amenities.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Amenities
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {cinema.amenities.map((a: string) => (
                        <span
                          key={a}
                          className="text-[10px] px-2 py-0.5 rounded-md bg-slate-900 border border-white/5 text-slate-300"
                        >
                          {a}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-white/10">
                <Link
                  href={`/cinemas/${cinema.slug}`}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-cinema-rose text-white text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md"
                >
                  <Film className="w-3.5 h-3.5" />
                  View Showtimes
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
