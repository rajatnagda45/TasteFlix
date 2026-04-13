"use client";

import { motion } from "framer-motion";

import { SafePoster } from "@/components/safe-poster";
import { Movie } from "@/types";

interface MovieCardProps {
  movie: Movie;
  subtitle?: string;
  onSelect?: () => void;
  selected?: boolean;
  actionLabel?: string;
  onAction?: () => void;
}

export function MovieCard({ movie, subtitle, onSelect, selected, actionLabel, onAction }: MovieCardProps) {
  return (
    <motion.div
      whileHover={{ y: -8, scale: 1.02 }}
      className={`group relative overflow-hidden rounded-3xl border text-left shadow-card transition ${
        selected ? "border-glow bg-white/10" : "border-white/10 bg-white/5"
      }`}
    >
      <button type="button" onClick={onSelect} className="block w-full text-left">
        <div className="relative aspect-[2/3] w-full overflow-hidden">
          <SafePoster
            src={movie.poster_url}
            title={movie.title}
            year={movie.year}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-90" />
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-rose-200">
              {movie.year || "Classic Pick"}
            </p>
            <h3 className="mt-2 text-lg font-bold text-white">{movie.title}</h3>
            <p className="mt-2 line-clamp-2 text-sm text-slate-300">
              {subtitle || movie.overview || movie.genres}
            </p>
          </div>
        </div>
      </button>
      {actionLabel && onAction ? (
        <div className="border-t border-white/10 bg-black/20 p-3">
          <button
            type="button"
            onClick={onAction}
            className="w-full rounded-full border border-rose-400/25 bg-rose-500/10 px-4 py-2 text-sm font-semibold text-rose-200 transition hover:bg-rose-500/20"
          >
            {actionLabel}
          </button>
        </div>
      ) : null}
    </motion.div>
  );
}
