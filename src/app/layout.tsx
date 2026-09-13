import type { Metadata } from "next";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import "./globals.css";

export const metadata: Metadata = {
  title: "CineBook - Premiere Cinema Ticket Booking",
  description:
    "Experience state-of-the-art cinema ticketing with zero latency seat holds, live interactive maps, and digital boarding passes.",
  openGraph: {
    title: "CineBook - Premiere Cinema Ticket Booking",
    description:
      "Instant seat reservation with live concurrency locking and digital tickets.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-background text-foreground antialiased min-h-screen flex flex-col selection:bg-cinema-rose selection:text-white">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
