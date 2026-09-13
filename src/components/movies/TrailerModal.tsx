"use client";

import React, { useEffect } from "react";
import { X } from "lucide-react";

interface TrailerModalProps {
  isOpen: boolean;
  onClose: () => void;
  trailerUrl: string;
  movieTitle: string;
}

export default function TrailerModal({
  isOpen,
  onClose,
  trailerUrl,
  movieTitle,
}: TrailerModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "auto";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Convert youtube watch URL to embed URL
  let embedUrl = trailerUrl;
  if (trailerUrl.includes("youtube.com/watch?v=")) {
    const videoId = trailerUrl.split("v=")[1]?.split("&")[0];
    embedUrl = `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1`;
  } else if (trailerUrl.includes("youtu.be/")) {
    const videoId = trailerUrl.split("youtu.be/")[1]?.split("?")[0];
    embedUrl = `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1`;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-pop">
      <div className="relative w-full max-w-4xl bg-slate-950 rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h3 className="text-sm sm:text-base font-bold text-white line-clamp-1">
            Official Trailer: <span className="text-cinema-rose">{movieTitle}</span>
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Video Player */}
        <div className="relative aspect-video w-full bg-black">
          <iframe
            src={embedUrl}
            title={`${movieTitle} Official Trailer`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full border-0"
          />
        </div>
      </div>
    </div>
  );
}
