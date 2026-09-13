import React from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  Film,
  Calendar,
  Armchair,
  FileText,
  ArrowLeft,
  ShieldCheck,
} from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Admin Top Banner */}
      <div className="bg-gradient-to-r from-amber-600 via-rose-600 to-amber-700 py-1.5 px-4 text-center text-xs font-bold text-slate-950 flex items-center justify-center gap-2">
        <ShieldCheck className="w-4 h-4" />
        <span>CineBook Control Center • Administrative Privileges Active</span>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {children}
      </div>
    </div>
  );
}
