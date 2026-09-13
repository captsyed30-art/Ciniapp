"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import DigitalTicketCard from "@/components/tickets/DigitalTicketCard";

export default function TicketConfirmationPage() {
  const params = useParams();
  const reference = params?.reference as string;

  const [ticketData, setTicketData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadTicket() {
      if (!reference) return;
      try {
        const res = await fetch(`/api/tickets/${reference}`);
        const data = await res.json();
        if (res.ok) {
          setTicketData(data);
        } else {
          setError(data.error || "Ticket not found");
        }
      } catch (err: any) {
        setError(err.message || "Failed to load ticket");
      } finally {
        setLoading(false);
      }
    }
    loadTicket();
  }, [reference]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="w-12 h-12 border-4 border-cinema-rose border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-slate-400 mt-4">Generating secure QR boarding passes...</p>
      </div>
    );
  }

  if (error || !ticketData) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="glass-panel p-8 rounded-3xl border border-white/10 space-y-3">
          <h2 className="text-lg font-bold text-white">Ticket Not Found</h2>
          <p className="text-xs text-slate-400">
            {error || "Could not retrieve ticket information for this reference."}
          </p>
          <Link
            href="/bookings"
            className="inline-block px-4 py-2 text-xs font-bold bg-cinema-rose text-white rounded-xl shadow-md"
          >
            Go to My Bookings
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <DigitalTicketCard
        booking={ticketData.booking}
        tickets={ticketData.tickets || []}
      />
    </div>
  );
}
