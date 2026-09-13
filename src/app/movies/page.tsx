"use client";

import React, { useState, useEffect } from "react";
import MovieCard from "@/components/movies/MovieCard";
import FilterBar from "@/components/movies/FilterBar";
import TrailerModal from "@/components/movies/TrailerModal";
import { Film, Sparkles } from "lucide-react";
import type { MovieWithGenres } from "@/types";

export default function MoviesPage() {
  const [movies, setMovies] = useState<MovieWithGenres[]>([]);
  const [genres, setGenres] = useState<Array<{ id: string; name: string; slug: string }>>([]);
  const [cinemas, setCinemas] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("all");
  const [selectedLanguage, setSelectedLanguage] = useState("all");
  const [selectedCinema, setSelectedCinema] = useState("all");
  const [selectedDate, setSelectedDate] = useState("");
  const [tabFilter, setTabFilter] = useState<"all" | "now_showing" | "coming_soon">("all");

  const [trailerModal, setTrailerModal] = useState<{
    isOpen: boolean;
    url: string;
    title: string;
  }>({
    isOpen: false,
    url: "",
    title: "",
  });

  // Fetch initial metadata
  useEffect(() => {
    async function loadMeta() {
      try {
        const [cRes] = await Promise.all([fetch("/api/cinemas")]);
        const cData = await cRes.json();
        setCinemas(cData.cinemas?.map((c: any) => ({ id: c.id, name: c.name })) || []);
      } catch (err) {
        console.error("Meta load error:", err);
      }
    }
    loadMeta();
  }, []);

  // Fetch filtered movies
  useEffect(() => {
    async function fetchFilteredMovies() {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (searchQuery) params.set("q", searchQuery);
        if (selectedGenre !== "all") params.set("genre", selectedGenre);
        if (selectedLanguage !== "all") params.set("language", selectedLanguage);
        if (selectedCinema !== "all") params.set("cinemaId", selectedCinema);
        if (selectedDate) params.set("date", selectedDate);
        if (tabFilter !== "all") params.set("filter", tabFilter);

        const res = await fetch(`/api/movies?${params.toString()}`);
        const data = await res.json();
        setMovies(data.movies || []);

        // Extract unique genres if not yet populated
        if (genres.length === 0 && data.movies) {
          const gMap = new Map<string, { id: string; name: string; slug: string }>();
          data.movies.forEach((m: MovieWithGenres) => {
            m.genres?.forEach((g) => {
              gMap.set(g.slug, g);
            });
          });
          setGenres(Array.from(gMap.values()));
        }
      } catch (err) {
        console.error("Fetch movies error:", err);
      } finally {
        setLoading(false);
      }
    }

    const timer = setTimeout(() => {
      fetchFilteredMovies();
    }, 150);

    return () => clearTimeout(timer);
  }, [
    searchQuery,
    selectedGenre,
    selectedLanguage,
    selectedCinema,
    selectedDate,
    tabFilter,
  ]);

  const handleClearFilters = () => {
    setSearchQuery("");
    setSelectedGenre("all");
    setSelectedLanguage("all");
    setSelectedCinema("all");
    setSelectedDate("");
    setTabFilter("all");
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-bold text-cinema-rose uppercase tracking-widest">
          <Film className="w-4 h-4" />
          Cinema Catalog
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white mt-1">
          Explore Movies & Showtimes
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Discover current releases, upcoming blockbusters, and filter by your favorite format.
        </p>
      </div>

      {/* Filter Component */}
      <FilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedGenre={selectedGenre}
        onGenreChange={setSelectedGenre}
        selectedLanguage={selectedLanguage}
        onLanguageChange={setSelectedLanguage}
        selectedCinema={selectedCinema}
        onCinemaChange={setSelectedCinema}
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
        tabFilter={tabFilter}
        onTabFilterChange={setTabFilter}
        genres={genres}
        cinemas={cinemas}
        onClearFilters={handleClearFilters}
      />

      {/* Movies Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="h-96 rounded-2xl bg-slate-900 animate-pulse border border-white/5"
            />
          ))}
        </div>
      ) : movies.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {movies.map((movie) => (
            <MovieCard
              key={movie.id}
              movie={movie}
              onWatchTrailer={(url, title) =>
                setTrailerModal({ isOpen: true, url, title })
              }
            />
          ))}
        </div>
      ) : (
        <div className="glass-panel p-12 rounded-3xl border border-white/10 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
            <Film className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white">No Movies Found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            We could not find any movies matching your current filters. Try changing or resetting your search parameters.
          </p>
          <button
            onClick={handleClearFilters}
            className="px-4 py-2 text-xs font-bold bg-cinema-rose text-white rounded-xl shadow-md"
          >
            Reset Filters
          </button>
        </div>
      )}

      {/* Trailer Modal */}
      <TrailerModal
        isOpen={trailerModal.isOpen}
        onClose={() => setTrailerModal({ isOpen: false, url: "", title: "" })}
        trailerUrl={trailerModal.url}
        movieTitle={trailerModal.title}
      />
    </div>
  );
}
