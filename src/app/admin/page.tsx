"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Film,
  Calendar,
  Armchair,
  FileText,
  DollarSign,
  Ticket,
  Users,
  Plus,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Clock,
  ShieldCheck,
  ChevronRight,
} from "lucide-react";
import { formatCurrency, formatDateTime } from "@/lib/utils";

export default function AdminDashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<
    "metrics" | "movies" | "showtimes" | "seats" | "audit"
  >("metrics");

  const [metricsData, setMetricsData] = useState<any>(null);
  const [moviesList, setMoviesList] = useState<any[]>([]);
  const [showtimesList, setShowtimesList] = useState<any[]>([]);
  const [auditLogsList, setAuditLogsList] = useState<any[]>([]);
  const [cinemasList, setCinemasList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // New Movie Form State
  const [newMovie, setNewMovie] = useState({
    title: "",
    synopsis: "",
    posterUrl: "",
    backdropUrl: "",
    trailerUrl: "",
    durationMins: 120,
    rating: "PG_13",
    language: "English",
    director: "",
    cast: "",
  });

  // New Showtime Form State
  const [newShowtime, setNewShowtime] = useState({
    movieId: "",
    auditoriumId: "",
    startTime: "",
    priceCents: 1800,
    format: "2D",
  });

  // Seat Management State
  const [selectedShowtimeId, setSelectedShowtimeId] = useState<string>("");
  const [seatMatrix, setSeatMatrix] = useState<any[]>([]);

  const fetchMetrics = async () => {
    try {
      const res = await fetch("/api/admin/metrics");
      if (res.status === 403 || res.status === 401) {
        router.push("/login?returnUrl=/admin");
        return;
      }
      const data = await res.json();
      setMetricsData(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMovies = async () => {
    try {
      const res = await fetch("/api/admin/movies");
      const data = await res.json();
      setMoviesList(data.movies || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchShowtimes = async () => {
    try {
      const res = await fetch("/api/admin/showtimes");
      const data = await res.json();
      setShowtimesList(data.showtimes || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const res = await fetch("/api/admin/audit-logs");
      const data = await res.json();
      setAuditLogsList(data.logs || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCinemas = async () => {
    try {
      const res = await fetch("/api/cinemas");
      const data = await res.json();
      setCinemasList(data.cinemas || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    async function loadAll() {
      setLoading(true);
      await Promise.all([
        fetchMetrics(),
        fetchMovies(),
        fetchShowtimes(),
        fetchAuditLogs(),
        fetchCinemas(),
      ]);
      setLoading(false);
    }
    loadAll();
  }, []);

  // Fetch seats when inspector showtime changes
  useEffect(() => {
    async function loadSeats() {
      if (!selectedShowtimeId) {
        setSeatMatrix([]);
        return;
      }
      try {
        const res = await fetch(`/api/showtimes/${selectedShowtimeId}`);
        const data = await res.json();
        setSeatMatrix(data.seats || []);
      } catch (err) {
        console.error(err);
      }
    }
    loadSeats();
  }, [selectedShowtimeId]);

  const handleCreateMovie = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);
    try {
      const res = await fetch("/api/admin/movies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newMovie),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setStatusMessage(`Movie "${newMovie.title}" successfully created!`);
      setNewMovie({
        title: "",
        synopsis: "",
        posterUrl: "",
        backdropUrl: "",
        trailerUrl: "",
        durationMins: 120,
        rating: "PG_13",
        language: "English",
        director: "",
        cast: "",
      });
      await fetchMovies();
      await fetchMetrics();
    } catch (err: any) {
      alert(err.message || "Failed to create movie");
    }
  };

  const handleCreateShowtime = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);
    try {
      const res = await fetch("/api/admin/showtimes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newShowtime),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setStatusMessage("Showtime successfully scheduled!");
      await fetchShowtimes();
      await fetchMetrics();
    } catch (err: any) {
      alert(err.message || "Failed to schedule showtime");
    }
  };

  const handleToggleSeatBlock = async (
    showtimeSeatId: string,
    currentStatus: string
  ) => {
    const action = currentStatus === "BLOCKED" ? "UNBLOCK" : "BLOCK";
    try {
      const res = await fetch("/api/admin/seats/block", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ showtimeSeatId, action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // Update local state
      setSeatMatrix((prev) =>
        prev.map((s) =>
          s.showtimeSeatId === showtimeSeatId
            ? { ...s, status: data.seat.status }
            : s
        )
      );
    } catch (err: any) {
      alert(err.message || "Failed to toggle seat");
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center">
        <div className="w-12 h-12 border-4 border-cinema-gold border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-slate-400 mt-4">Loading Admin Dashboard...</p>
      </div>
    );
  }

  const metrics = metricsData?.metrics || {};

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-6 rounded-3xl border border-white/10">
        <div>
          <span className="text-xs font-bold text-cinema-gold uppercase tracking-wider flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4" />
            CineBook Operator Console
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-white mt-1">
            Cinema Management Suite
          </h1>
        </div>

        {/* Tab Nav */}
        <div className="flex flex-wrap gap-1.5 bg-slate-900 p-1.5 rounded-2xl border border-white/5">
          <button
            onClick={() => setActiveTab("metrics")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === "metrics"
                ? "bg-cinema-gold text-slate-950 font-black shadow-md shadow-cinema-gold/30"
                : "text-slate-300 hover:text-white"
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" /> Overview
          </button>
          <button
            onClick={() => setActiveTab("movies")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === "movies"
                ? "bg-cinema-gold text-slate-950 font-black shadow-md shadow-cinema-gold/30"
                : "text-slate-300 hover:text-white"
            }`}
          >
            <Film className="w-3.5 h-3.5" /> Movies ({moviesList.length})
          </button>
          <button
            onClick={() => setActiveTab("showtimes")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === "showtimes"
                ? "bg-cinema-gold text-slate-950 font-black shadow-md shadow-cinema-gold/30"
                : "text-slate-300 hover:text-white"
            }`}
          >
            <Calendar className="w-3.5 h-3.5" /> Showtimes ({showtimesList.length})
          </button>
          <button
            onClick={() => setActiveTab("seats")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === "seats"
                ? "bg-cinema-gold text-slate-950 font-black shadow-md shadow-cinema-gold/30"
                : "text-slate-300 hover:text-white"
            }`}
          >
            <Armchair className="w-3.5 h-3.5" /> Seat Inspector
          </button>
          <button
            onClick={() => setActiveTab("audit")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === "audit"
                ? "bg-cinema-gold text-slate-950 font-black shadow-md shadow-cinema-gold/30"
                : "text-slate-300 hover:text-white"
            }`}
          >
            <FileText className="w-3.5 h-3.5" /> Audit Logs
          </button>
        </div>
      </div>

      {statusMessage && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 flex items-center gap-2 animate-pop">
          <CheckCircle2 className="w-4 h-4" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* 1. Metrics Tab */}
      {activeTab === "metrics" && (
        <div className="space-y-8">
          {/* Key Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-400">
                <span>Total Gross Revenue</span>
                <DollarSign className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-white font-mono">
                {formatCurrency(Number(metrics.totalRevenueCents || 0))}
              </div>
              <div className="text-[11px] text-emerald-400 font-medium">
                {metrics.confirmedBookings || 0} Paid Orders
              </div>
            </div>

            <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-400">
                <span>Tickets Issued</span>
                <Ticket className="w-4 h-4 text-cinema-rose" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-white font-mono">
                {metrics.totalTickets || 0}
              </div>
              <div className="text-[11px] text-slate-400 font-medium">
                Active QR Passes
              </div>
            </div>

            <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-400">
                <span>Active Catalog</span>
                <Film className="w-4 h-4 text-sky-400" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-white font-mono">
                {metrics.activeMovies || 0} Movies
              </div>
              <div className="text-[11px] text-sky-400 font-medium">
                {metrics.upcomingShowtimes || 0} Scheduled Screenings
              </div>
            </div>

            <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-400">
                <span>Seat Occupancy</span>
                <Armchair className="w-4 h-4 text-cinema-gold" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-white font-mono">
                {metrics.bookedSeats || 0} Seats
              </div>
              <div className="text-[11px] text-cinema-gold font-medium">
                {metrics.heldSeats || 0} Currently Held In Cart
              </div>
            </div>
          </div>

          {/* Recent Live Orders */}
          <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-4">
            <h3 className="font-bold text-base text-white flex items-center gap-2">
              <Ticket className="w-4 h-4 text-cinema-rose" />
              Recent Booking Transactions
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/10 text-slate-400">
                    <th className="pb-3 font-semibold">Reference</th>
                    <th className="pb-3 font-semibold">Customer</th>
                    <th className="pb-3 font-semibold">Movie & Cinema</th>
                    <th className="pb-3 font-semibold">Amount</th>
                    <th className="pb-3 font-semibold">Status</th>
                    <th className="pb-3 font-semibold">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {metricsData?.recentBookings?.map((b: any) => (
                    <tr key={b.id} className="hover:bg-white/5">
                      <td className="py-3 font-mono font-bold text-white">
                        {b.referenceCode}
                      </td>
                      <td className="py-3">
                        <div className="font-semibold text-white">{b.userName}</div>
                        <div className="text-[10px] text-slate-400">{b.userEmail}</div>
                      </td>
                      <td className="py-3">
                        <div className="font-semibold text-white">{b.movieTitle}</div>
                        <div className="text-[10px] text-slate-400">{b.cinemaName}</div>
                      </td>
                      <td className="py-3 font-mono text-cinema-rose font-bold">
                        {formatCurrency(b.totalCents)}
                      </td>
                      <td className="py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            b.status === "CONFIRMED"
                              ? "bg-emerald-500/20 text-emerald-300"
                              : b.status === "CANCELLED"
                              ? "bg-rose-500/20 text-rose-300"
                              : "bg-slate-800 text-slate-400"
                          }`}
                        >
                          {b.status}
                        </span>
                      </td>
                      <td className="py-3 text-slate-400 font-mono text-[10px]">
                        {formatDateTime(b.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 2. Movies Management Tab */}
      {activeTab === "movies" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* New Movie Form (5 Cols) */}
          <div className="lg:col-span-5 glass-panel p-6 rounded-3xl border border-white/10 space-y-4">
            <h3 className="font-bold text-base text-white flex items-center gap-2">
              <Plus className="w-4 h-4 text-cinema-rose" /> Add New Movie
            </h3>
            <form onSubmit={handleCreateMovie} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Movie Title</label>
                <input
                  type="text"
                  required
                  value={newMovie.title}
                  onChange={(e) =>
                    setNewMovie({ ...newMovie, title: e.target.value })
                  }
                  className="w-full p-2 bg-slate-900 border border-white/10 rounded-xl text-white"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Synopsis</label>
                <textarea
                  required
                  rows={3}
                  value={newMovie.synopsis}
                  onChange={(e) =>
                    setNewMovie({ ...newMovie, synopsis: e.target.value })
                  }
                  className="w-full p-2 bg-slate-900 border border-white/10 rounded-xl text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-400 block mb-1">Poster URL</label>
                  <input
                    type="url"
                    required
                    value={newMovie.posterUrl}
                    onChange={(e) =>
                      setNewMovie({ ...newMovie, posterUrl: e.target.value })
                    }
                    placeholder="https://images.unsplash.com/..."
                    className="w-full p-2 bg-slate-900 border border-white/10 rounded-xl text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Trailer URL (YouTube)</label>
                  <input
                    type="url"
                    value={newMovie.trailerUrl}
                    onChange={(e) =>
                      setNewMovie({ ...newMovie, trailerUrl: e.target.value })
                    }
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="w-full p-2 bg-slate-900 border border-white/10 rounded-xl text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-slate-400 block mb-1">Duration (mins)</label>
                  <input
                    type="number"
                    required
                    value={newMovie.durationMins}
                    onChange={(e) =>
                      setNewMovie({
                        ...newMovie,
                        durationMins: Number(e.target.value),
                      })
                    }
                    className="w-full p-2 bg-slate-900 border border-white/10 rounded-xl text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Rating</label>
                  <select
                    value={newMovie.rating}
                    onChange={(e) =>
                      setNewMovie({ ...newMovie, rating: e.target.value })
                    }
                    className="w-full p-2 bg-slate-900 border border-white/10 rounded-xl text-white"
                  >
                    <option value="G">G</option>
                    <option value="PG">PG</option>
                    <option value="PG_13">PG-13</option>
                    <option value="R">R</option>
                    <option value="NC_17">NC-17</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Language</label>
                  <input
                    type="text"
                    value={newMovie.language}
                    onChange={(e) =>
                      setNewMovie({ ...newMovie, language: e.target.value })
                    }
                    className="w-full p-2 bg-slate-900 border border-white/10 rounded-xl text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Starring Cast</label>
                <input
                  type="text"
                  value={newMovie.cast}
                  onChange={(e) =>
                    setNewMovie({ ...newMovie, cast: e.target.value })
                  }
                  placeholder="Actor 1, Actor 2..."
                  className="w-full p-2 bg-slate-900 border border-white/10 rounded-xl text-white"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-cinema-rose hover:bg-rose-600 text-white font-bold text-xs shadow-md"
              >
                Publish Movie
              </button>
            </form>
          </div>

          {/* Existing Movies List (7 Cols) */}
          <div className="lg:col-span-7 glass-panel p-6 rounded-3xl border border-white/10 space-y-4">
            <h3 className="font-bold text-base text-white">
              Movie Library ({moviesList.length})
            </h3>
            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
              {moviesList.map((m) => (
                <div
                  key={m.id}
                  className="p-3.5 rounded-2xl bg-slate-900/80 border border-white/5 flex gap-4 items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={m.poster_url || m.posterUrl}
                      alt={m.title}
                      className="w-10 h-14 rounded-lg object-cover bg-slate-800"
                    />
                    <div>
                      <h4 className="font-bold text-white text-xs">{m.title}</h4>
                      <p className="text-[11px] text-slate-400">
                        {m.duration_mins || m.durationMins} mins • {m.rating} • {m.language}
                      </p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                    Active
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 3. Showtime Scheduler Tab */}
      {activeTab === "showtimes" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* New Showtime Form (5 Cols) */}
          <div className="lg:col-span-5 glass-panel p-6 rounded-3xl border border-white/10 space-y-4">
            <h3 className="font-bold text-base text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-cinema-rose" /> Schedule Showtime
            </h3>
            <form onSubmit={handleCreateShowtime} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Select Movie</label>
                <select
                  required
                  value={newShowtime.movieId}
                  onChange={(e) =>
                    setNewShowtime({ ...newShowtime, movieId: e.target.value })
                  }
                  className="w-full p-2 bg-slate-900 border border-white/10 rounded-xl text-white"
                >
                  <option value="">-- Choose Movie --</option>
                  {moviesList.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Select Auditorium / Screen</label>
                <select
                  required
                  value={newShowtime.auditoriumId}
                  onChange={(e) =>
                    setNewShowtime({
                      ...newShowtime,
                      auditoriumId: e.target.value,
                    })
                  }
                  className="w-full p-2 bg-slate-900 border border-white/10 rounded-xl text-white"
                >
                  <option value="">-- Choose Auditorium --</option>
                  {cinemasList.flatMap((c) =>
                    c.auditoriums?.map((a: any) => (
                      <option key={a.id} value={a.id}>
                        {c.name} - {a.name} ({a.screenType})
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Start Time (UTC/Local)</label>
                <input
                  type="datetime-local"
                  required
                  value={newShowtime.startTime}
                  onChange={(e) =>
                    setNewShowtime({
                      ...newShowtime,
                      startTime: e.target.value,
                    })
                  }
                  className="w-full p-2 bg-slate-900 border border-white/10 rounded-xl text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-400 block mb-1">Base Price (cents)</label>
                  <input
                    type="number"
                    required
                    value={newShowtime.priceCents}
                    onChange={(e) =>
                      setNewShowtime({
                        ...newShowtime,
                        priceCents: Number(e.target.value),
                      })
                    }
                    className="w-full p-2 bg-slate-900 border border-white/10 rounded-xl text-white font-mono"
                  />
                  <span className="text-[10px] text-slate-500">
                    {formatCurrency(newShowtime.priceCents)}
                  </span>
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Format</label>
                  <select
                    value={newShowtime.format}
                    onChange={(e) =>
                      setNewShowtime({ ...newShowtime, format: e.target.value })
                    }
                    className="w-full p-2 bg-slate-900 border border-white/10 rounded-xl text-white"
                  >
                    <option value="2D">2D</option>
                    <option value="3D">3D</option>
                    <option value="IMAX">IMAX</option>
                    <option value="4DX">4DX</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-cinema-rose hover:bg-rose-600 text-white font-bold text-xs shadow-md"
              >
                Schedule & Provision Seats
              </button>
            </form>
          </div>

          {/* Showtimes List (7 Cols) */}
          <div className="lg:col-span-7 glass-panel p-6 rounded-3xl border border-white/10 space-y-4">
            <h3 className="font-bold text-base text-white">
              Upcoming Showtimes Schedule
            </h3>
            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
              {showtimesList.map((st) => (
                <div
                  key={st.id}
                  className="p-3.5 rounded-2xl bg-slate-900/80 border border-white/5 flex items-center justify-between"
                >
                  <div>
                    <h4 className="font-bold text-white text-xs">
                      {st.movieTitle}
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      {st.cinemaName} • {st.auditoriumName}
                    </p>
                    <p className="text-[11px] text-cinema-gold font-medium">
                      {formatDateTime(st.startTime)} ({st.format})
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-xs text-cinema-rose font-bold block">
                      {formatCurrency(st.priceCents)}
                    </span>
                    <Link
                      href={`/showtimes/${st.id}/seats`}
                      className="text-[10px] text-sky-400 hover:underline inline-flex items-center gap-0.5 mt-1"
                    >
                      View Map <ChevronRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 4. Seat Inspector Tab */}
      {activeTab === "seats" && (
        <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <Armchair className="w-4 h-4 text-cinema-gold" />
                Live Showtime Seat Inspector & Maintenance Block
              </h3>
              <p className="text-xs text-slate-400">
                Click any available seat to manually BLOCK it for VIP reservation or maintenance.
              </p>
            </div>

            <select
              value={selectedShowtimeId}
              onChange={(e) => setSelectedShowtimeId(e.target.value)}
              className="p-2.5 bg-slate-900 border border-white/10 rounded-xl text-xs text-white max-w-xs"
            >
              <option value="">-- Choose Showtime to Inspect --</option>
              {showtimesList.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.movieTitle} ({st.auditoriumName} -{" "}
                  {new Date(st.startTime).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                  )
                </option>
              ))}
            </select>
          </div>

          {seatMatrix.length > 0 ? (
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-white/5 space-y-6 flex flex-col items-center">
              <div className="flex flex-wrap gap-2 justify-center max-w-2xl">
                {seatMatrix.map((s) => (
                  <button
                    key={s.showtimeSeatId}
                    disabled={s.status === "BOOKED"}
                    onClick={() =>
                      handleToggleSeatBlock(s.showtimeSeatId, s.status)
                    }
                    className={`w-9 h-9 rounded-lg border text-[11px] font-bold transition-all ${
                      s.status === "BLOCKED"
                        ? "bg-zinc-800 text-red-400 border-red-500/40"
                        : s.status === "BOOKED"
                        ? "bg-slate-800 text-slate-600 border-transparent opacity-40 cursor-not-allowed"
                        : s.status === "HELD"
                        ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                        : "bg-slate-900 text-slate-200 border-white/10 hover:border-cinema-gold"
                    }`}
                    title={`Seat ${s.row}${s.number} (${s.status}) - Click to toggle BLOCK`}
                  >
                    {s.row}{s.number}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-10 text-center text-xs text-slate-500 border border-dashed border-white/10 rounded-2xl">
              Select a showtime from the dropdown above to inspect its live seat map.
            </div>
          )}
        </div>
      )}

      {/* 5. Audit Logs Tab */}
      {activeTab === "audit" && (
        <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-4">
          <h3 className="font-bold text-base text-white flex items-center gap-2">
            <FileText className="w-4 h-4 text-cinema-rose" />
            Security & System Audit Trail
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/10 text-slate-400">
                  <th className="pb-3 font-semibold">Action</th>
                  <th className="pb-3 font-semibold">User</th>
                  <th className="pb-3 font-semibold">Entity</th>
                  <th className="pb-3 font-semibold">Payload</th>
                  <th className="pb-3 font-semibold">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {auditLogsList.map((log) => (
                  <tr key={log.id} className="hover:bg-white/5">
                    <td className="py-2.5 font-mono text-cinema-rose font-bold">
                      {log.action}
                    </td>
                    <td className="py-2.5">
                      <div className="text-white font-medium">{log.userName || "System"}</div>
                      <div className="text-[10px] text-slate-400">{log.userEmail}</div>
                    </td>
                    <td className="py-2.5 text-slate-300">
                      {log.entityType} ({log.entityId?.slice(0, 8)}...)
                    </td>
                    <td className="py-2.5 font-mono text-[10px] text-slate-400 max-w-xs truncate">
                      {JSON.stringify(log.payload)}
                    </td>
                    <td className="py-2.5 font-mono text-[10px] text-slate-400">
                      {formatDateTime(log.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
