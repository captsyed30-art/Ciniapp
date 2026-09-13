import React from "react";
import Link from "next/link";
import { Film, ShieldCheck, Sparkles, Heart } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-slate-950/80 text-slate-400 text-sm mt-20 no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Col */}
          <div className="space-y-4 md:col-span-1">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cinema-rose to-cinema-gold flex items-center justify-center shadow-md">
                <Film className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold text-white tracking-wider">
                CINE<span className="text-cinema-rose">BOOK</span>
              </span>
            </Link>
            <p className="text-xs text-slate-400 leading-relaxed">
              The premier next-generation cinema ticketing experience. Instant seat reservation with zero latency, live hold locking, and digital boarding passes.
            </p>
            <div className="flex items-center gap-2 text-xs text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Vercel + Neon Serverless Production Ready</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">
              Explore
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/movies" className="hover:text-white transition-colors">
                  Now Showing
                </Link>
              </li>
              <li>
                <Link href="/cinemas" className="hover:text-white transition-colors">
                  Cinemas & IMAX Screens
                </Link>
              </li>
              <li>
                <Link href="/bookings" className="hover:text-white transition-colors">
                  My Digital Tickets
                </Link>
              </li>
              <li>
                <Link href="/admin" className="hover:text-cinema-gold text-slate-400 transition-colors flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-cinema-gold" />
                  Admin Dashboard
                </Link>
              </li>
            </ul>
          </div>

          {/* Experience Amenities */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">
              Experience Formats
            </h4>
            <ul className="space-y-2 text-xs">
              <li className="flex items-center gap-2">
                <span className="px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 font-mono text-[10px]">IMAX</span>
                <span>Laser 4K Dual Projection</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono text-[10px]">DOLBY</span>
                <span>Atmos Immersive Audio</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 font-mono text-[10px]">4DX</span>
                <span>Environmental Motion Effects</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono text-[10px]">VIP</span>
                <span>Luxury Heated Recliners</span>
              </li>
            </ul>
          </div>

          {/* Demo Credentials */}
          <div className="glass-card p-4 rounded-xl border border-white/5 space-y-2">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cinema-gold" />
              Demo Credentials
            </h4>
            <div className="text-[11px] space-y-1 text-slate-300">
              <div>
                <span className="text-slate-400">Admin:</span>{" "}
                <code className="text-cinema-gold">admin@cinebook.com</code> / <code className="text-slate-200">admin123</code>
              </div>
              <div>
                <span className="text-slate-400">User:</span>{" "}
                <code className="text-cinema-rose">alex@cinebook.com</code> / <code className="text-slate-200">alex123</code>
              </div>
            </div>
            <p className="text-[10px] text-slate-500 pt-1">
              Use test cards (4242...) for instantaneous sandbox checkout.
            </p>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} CineBook Inc. All rights reserved.</p>
          <div className="flex items-center gap-1 text-slate-400">
            Built with Next.js, Tailwind CSS, Neon PostgreSQL & Drizzle ORM
          </div>
        </div>
      </div>
    </footer>
  );
}
