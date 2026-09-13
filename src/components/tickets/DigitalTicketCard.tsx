"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import confetti from "canvas-confetti";
import {
  QrCode,
  Printer,
  Calendar,
  MapPin,
  Clock,
  Film,
  CheckCircle2,
  Share2,
  Ticket as TicketIcon,
  ChevronLeft,
} from "lucide-react";
import { formatCurrency, formatDateTime } from "@/lib/utils";

interface DigitalTicketCardProps {
  booking: any;
  tickets: any[];
}

export default function DigitalTicketCard({
  booking,
  tickets,
}: DigitalTicketCardProps) {
  useEffect(() => {
    // Fire celebratory confetti on page load
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#e11d48", "#f59e0b", "#38bdf8", "#ffffff"],
      });
    } catch {
      // Ignored if canvas unsupported
    }
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `CineBook Ticket: ${booking.movieTitle}`,
          text: `My movie tickets for ${booking.movieTitle} at ${booking.cinemaName}! Reference: ${booking.referenceCode}`,
          url: window.location.href,
        });
      } catch {
        // Ignored
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert("Ticket link copied to clipboard!");
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Top Action Bar (hidden in print) */}
      <div className="no-print flex items-center justify-between">
        <Link
          href="/bookings"
          className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          My Bookings
        </Link>
        <div className="flex items-center gap-2">
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 border border-white/10 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
          >
            <Share2 className="w-3.5 h-3.5" />
            Share
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cinema-rose hover:bg-rose-600 text-xs font-bold text-white shadow-lg shadow-cinema-rose/25 transition-all"
          >
            <Printer className="w-3.5 h-3.5" />
            Print Tickets
          </button>
        </div>
      </div>

      {/* Success Notification */}
      <div className="no-print p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-3">
        <CheckCircle2 className="w-6 h-6 text-emerald-400 flex-shrink-0" />
        <div>
          <h4 className="text-sm font-bold text-emerald-300">
            Booking Confirmed & Ready!
          </h4>
          <p className="text-xs text-slate-300">
            Show the digital QR codes below at the cinema usher gate for direct entry.
          </p>
        </div>
      </div>

      {/* Tickets List */}
      <div className="space-y-6">
        {tickets.map((ticket, idx) => (
          <div
            key={ticket.id || idx}
            className="glass-panel rounded-3xl overflow-hidden border border-white/15 shadow-2xl relative"
          >
            {/* Boarding Pass Header */}
            <div className="bg-gradient-to-r from-rose-950 via-slate-900 to-slate-950 p-6 border-b border-white/10 relative overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-cinema-rose flex items-center justify-center shadow-lg shadow-cinema-rose/40">
                    <Film className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase tracking-widest text-rose-300 font-bold">
                      CINEBOOK PREMIERE PASS #{idx + 1}
                    </span>
                    <h2 className="text-xl font-extrabold text-white">
                      {booking.movieTitle}
                    </h2>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-slate-400 uppercase tracking-widest">
                    REFERENCE
                  </span>
                  <div className="text-base font-mono font-bold text-cinema-gold">
                    {booking.referenceCode}
                  </div>
                </div>
              </div>
            </div>

            {/* Ticket Body: Details & QR Section */}
            <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              {/* Left Details (8 Cols) */}
              <div className="md:col-span-8 space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div>
                    <span className="text-[10px] font-semibold text-slate-400 uppercase">
                      Cinema
                    </span>
                    <div className="text-xs font-bold text-white mt-0.5">
                      {booking.cinemaName}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {booking.cinemaAddress}
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] font-semibold text-slate-400 uppercase">
                      Auditorium & Screen
                    </span>
                    <div className="text-xs font-bold text-white mt-0.5">
                      {booking.auditoriumName}
                    </div>
                    <div className="text-[10px] text-sky-400 font-semibold">
                      {booking.format} Format
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] font-semibold text-slate-400 uppercase">
                      Assigned Seat
                    </span>
                    <div className="text-base font-black text-cinema-rose mt-0.5">
                      Seat {ticket.seatLabel}
                    </div>
                    <div className="text-[10px] text-slate-300">
                      {ticket.seatType || "Standard"}
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] font-semibold text-slate-400 uppercase">
                      Date & Time
                    </span>
                    <div className="text-xs font-bold text-cinema-gold mt-0.5">
                      {formatDateTime(booking.startTime)}
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] font-semibold text-slate-400 uppercase">
                      Guest Name
                    </span>
                    <div className="text-xs font-semibold text-white mt-0.5">
                      {booking.userName}
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] font-semibold text-slate-400 uppercase">
                      Security Code
                    </span>
                    <div className="text-[11px] font-mono text-slate-300 mt-0.5">
                      {ticket.ticketCode}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right QR Code (4 Cols) */}
              <div className="md:col-span-4 flex flex-col items-center justify-center p-4 rounded-2xl bg-white text-slate-950 text-center shadow-lg">
                <img
                  src={ticket.qrCodeData}
                  alt={`QR Code for Seat ${ticket.seatLabel}`}
                  className="w-36 h-36 object-contain"
                />
                <span className="text-[10px] font-mono font-bold tracking-wider mt-1 text-slate-700">
                  {ticket.ticketCode}
                </span>
                <span className="text-[9px] uppercase font-bold text-slate-500 tracking-widest mt-0.5">
                  Scan at Entrance
                </span>
              </div>
            </div>

            {/* Perforated Divider Visual */}
            <div className="border-t border-dashed border-white/20 px-6 py-3 bg-slate-950/60 flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1.5">
                <TicketIcon className="w-3.5 h-3.5 text-cinema-rose" />
                Verified CineBook Digital Ticket
              </span>
              <span>Total Paid: {formatCurrency(booking.totalCents)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
