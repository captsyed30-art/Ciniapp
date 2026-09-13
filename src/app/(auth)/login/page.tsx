"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Film, Lock, Mail, Sparkles, ShieldCheck, User } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get("returnUrl") || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Login failed");
      }

      router.push(returnUrl);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to sign in");
      setLoading(false);
    }
  };

  const handleQuickFill = (e: string, p: string) => {
    setEmail(e);
    setPassword(p);
  };

  return (
    <div className="w-full max-w-md space-y-6">
      {/* Brand */}
      <div className="text-center space-y-2">
        <Link href="/" className="inline-flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cinema-rose to-cinema-gold flex items-center justify-center shadow-lg shadow-cinema-rose/25">
            <Film className="w-5 h-5 text-white" />
          </div>
          <span className="text-2xl font-extrabold text-white">
            CINE<span className="text-cinema-rose">BOOK</span>
          </span>
        </Link>
        <h2 className="text-xl font-bold text-white">Sign in to your account</h2>
        <p className="text-xs text-slate-400">
          Access your bookings, seat holds, and exclusive digital passes.
        </p>
      </div>

      {/* Demo 1-Click Credentials Banner */}
      <div className="glass-card p-4 rounded-2xl border border-cinema-gold/30 bg-amber-950/20 space-y-2.5">
        <div className="flex items-center justify-between text-xs font-bold text-cinema-gold">
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> Quick Demo Sign-In
          </span>
          <span className="text-[10px] text-amber-300/80">1-Click Fill</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => handleQuickFill("alex@cinebook.com", "alex123")}
            className="p-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-left border border-white/5 transition-colors"
          >
            <div className="text-xs font-bold text-white flex items-center gap-1">
              <User className="w-3 h-3 text-cinema-rose" /> Alex (User)
            </div>
            <div className="text-[10px] text-slate-400 truncate">alex@cinebook.com</div>
          </button>
          <button
            type="button"
            onClick={() => handleQuickFill("admin@cinebook.com", "admin123")}
            className="p-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-left border border-white/5 transition-colors"
          >
            <div className="text-xs font-bold text-amber-300 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-cinema-gold" /> Chief Admin
            </div>
            <div className="text-[10px] text-slate-400 truncate">admin@cinebook.com</div>
          </button>
        </div>
      </div>

      {/* Form Card */}
      <div className="glass-panel p-6 rounded-3xl border border-white/10 shadow-xl space-y-5">
        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="alex@example.com"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-cinema-rose"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-cinema-rose"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-cinema-rose hover:bg-rose-600 disabled:opacity-50 text-white font-bold text-sm shadow-lg shadow-cinema-rose/25 transition-all"
          >
            {loading ? "Authenticating..." : "Sign In"}
          </button>
        </form>

        <div className="text-center text-xs text-slate-400">
          Don't have an account yet?{" "}
          <Link
            href={`/register?returnUrl=${encodeURIComponent(returnUrl)}`}
            className="text-cinema-rose font-bold hover:underline"
          >
            Register now
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-12">
      <Suspense fallback={<div className="w-10 h-10 border-4 border-cinema-rose border-t-transparent rounded-full animate-spin" />}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
