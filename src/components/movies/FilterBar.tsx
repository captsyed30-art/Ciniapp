"use client";

import React, { useState } from "react";
import { Search, Filter, Calendar, MapPin, Globe, Sparkles, X } from "lucide-react";

interface FilterBarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedGenre: string;
  onGenreChange: (g: string) => void;
  selectedLanguage: string;
  onLanguageChange: (l: string) => void;
  selectedCinema: string;
  onCinemaChange: (c: string) => void;
  selectedDate: string;
  onDateChange: (d: string) => void;
  tabFilter: "all" | "now_showing" | "coming_soon";
  onTabFilterChange: (t: "all" | "now_showing" | "coming_soon") => void;
  genres: Array<{ id: string; name: string; slug: string }>;
  cinemas: Array<{ id: string; name: string }>;
  onClearFilters: () => void;
}

export default function FilterBar({
  searchQuery,
  onSearchChange,
  selectedGenre,
  onGenreChange,
  selectedLanguage,
  onLanguageChange,
  selectedCinema,
  onCinemaChange,
  selectedDate,
  onDateChange,
  tabFilter,
  onTabFilterChange,
  genres,
  cinemas,
  onClearFilters,
}: FilterBarProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const languages = ["English", "Spanish", "French", "Japanese", "Hindi"];

  // Quick 7-day date chips
  const quickDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().split("T")[0];
    const dayName = i === 0 ? "Today" : i === 1 ? "Tomorrow" : d.toLocaleDateString("en-US", { weekday: "short" });
    const formatted = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    return { dateStr, dayName, formatted };
  });

  const hasActiveFilters =
    searchQuery ||
    selectedGenre !== "all" ||
    selectedLanguage !== "all" ||
    selectedCinema !== "all" ||
    selectedDate;

  return (
    <div className="space-y-4">
      {/* Top Filter Bar: Tabs & Search */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 glass-card p-3 rounded-2xl border border-white/10">
        {/* Status Tabs */}
        <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-white/5 w-full md:w-auto">
          <button
            onClick={() => onTabFilterChange("all")}
            className={`flex-1 md:flex-initial px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              tabFilter === "all"
                ? "bg-cinema-rose text-white shadow-md shadow-cinema-rose/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            All Movies
          </button>
          <button
            onClick={() => onTabFilterChange("now_showing")}
            className={`flex-1 md:flex-initial px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              tabFilter === "now_showing"
                ? "bg-cinema-rose text-white shadow-md shadow-cinema-rose/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Now Showing
          </button>
          <button
            onClick={() => onTabFilterChange("coming_soon")}
            className={`flex-1 md:flex-initial px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              tabFilter === "coming_soon"
                ? "bg-cinema-rose text-white shadow-md shadow-cinema-rose/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Coming Soon
          </button>
        </div>

        {/* Search Input & Advanced Toggle */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search movies, actors, synopsis..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-900/90 border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cinema-rose transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`p-2.5 rounded-xl border transition-all flex items-center gap-1.5 text-xs font-semibold ${
              showAdvanced || hasActiveFilters
                ? "bg-cinema-rose/10 border-cinema-rose text-cinema-rose"
                : "bg-slate-900/90 border-white/10 text-slate-300 hover:text-white"
            }`}
          >
            <Filter className="w-4 h-4" />
            <span className="hidden sm:inline">Filters</span>
            {hasActiveFilters && (
              <span className="w-2 h-2 rounded-full bg-cinema-rose" />
            )}
          </button>
        </div>
      </div>

      {/* Date Quick Selector */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <button
          onClick={() => onDateChange("")}
          className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${
            !selectedDate
              ? "bg-slate-200 text-slate-950 border-white shadow-md"
              : "bg-slate-900/60 text-slate-300 border-white/5 hover:border-white/20"
          }`}
        >
          Any Date
        </button>
        {quickDates.map((q) => {
          const isSelected = selectedDate === q.dateStr;
          return (
            <button
              key={q.dateStr}
              onClick={() => onDateChange(isSelected ? "" : q.dateStr)}
              className={`flex-shrink-0 px-3.5 py-1.5 rounded-xl text-xs font-semibold border flex flex-col items-center min-w-[76px] transition-all ${
                isSelected
                  ? "bg-cinema-rose text-white border-cinema-rose shadow-lg shadow-cinema-rose/30 scale-105"
                  : "bg-slate-900/60 text-slate-300 border-white/5 hover:border-white/20"
              }`}
            >
              <span className="text-[10px] uppercase font-bold opacity-80">{q.dayName}</span>
              <span className="text-xs font-bold">{q.formatted}</span>
            </button>
          );
        })}
      </div>

      {/* Genre Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        <button
          onClick={() => onGenreChange("all")}
          className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
            selectedGenre === "all"
              ? "bg-white text-slate-950"
              : "bg-slate-900/60 text-slate-400 hover:text-white border border-white/5"
          }`}
        >
          All Genres
        </button>
        {genres.map((g) => (
          <button
            key={g.id}
            onClick={() => onGenreChange(selectedGenre === g.slug ? "all" : g.slug)}
            className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
              selectedGenre === g.slug
                ? "bg-cinema-rose text-white shadow-md shadow-cinema-rose/30"
                : "bg-slate-900/60 text-slate-300 hover:text-white border border-white/5"
            }`}
          >
            {g.name}
          </button>
        ))}
      </div>

      {/* Advanced Filter Collapsible */}
      {showAdvanced && (
        <div className="glass-card p-4 rounded-2xl border border-white/10 grid grid-cols-1 sm:grid-cols-3 gap-4 animate-pop">
          {/* Cinema Filter */}
          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-1.5 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-cinema-rose" />
              Cinema Location
            </label>
            <select
              value={selectedCinema}
              onChange={(e) => onCinemaChange(e.target.value)}
              className="w-full p-2 bg-slate-900 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-cinema-rose"
            >
              <option value="all">All Cinemas</option>
              {cinemas.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Language Filter */}
          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-1.5 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-cinema-gold" />
              Language
            </label>
            <select
              value={selectedLanguage}
              onChange={(e) => onLanguageChange(e.target.value)}
              className="w-full p-2 bg-slate-900 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-cinema-rose"
            >
              <option value="all">All Languages</option>
              {languages.map((lang) => (
                <option key={lang} value={lang}>
                  {lang}
                </option>
              ))}
            </select>
          </div>

          {/* Clear Filters Action */}
          <div className="flex items-end">
            <button
              onClick={onClearFilters}
              disabled={!hasActiveFilters}
              className="w-full py-2 px-3 text-xs font-bold rounded-xl border border-rose-500/30 text-rose-300 hover:bg-rose-500/10 disabled:opacity-40 disabled:pointer-events-none transition-colors"
            >
              Reset All Filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
