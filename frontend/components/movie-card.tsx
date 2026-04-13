"use client";

import { motion } from "framer-motion";
import { Trash2 } from "lucide-react";

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
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -10, scale: 1.035 }}
      transition={{ duration: 0.24, ease: "easeOut" }}
      className={`group relative overflow-hidden rounded-3xl border text-left shadow-card transition ${
        selected ? "border-sky-300/35 bg-white/[0.1]" : "border-white/10 bg-white/[0.05]"
      }`}
      style={{
        boxShadow: selected
          ? "0 24px 64px rgba(8,15,35,0.5), 0 0 0 1px rgba(125,211,252,0.12), 0 0 45px rgba(56,189,248,0.18)"
          : "0 20px 55px rgba(3,8,22,0.42)",
      }}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.09),transparent_35%),linear-gradient(180deg,rgba(255,255,255,0.05),transparent_30%)] opacity-0 transition duration-300 group-hover:opacity-100" />
      <div className="pointer-events-none absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent opacity-0 transition duration-300 group-hover:opacity-100" />
      <button type="button" onClick={onSelect} className="block w-full text-left">
        <div className="relative aspect-[2/3] w-full overflow-hidden">
          <SafePoster
            src={movie.poster_url}
            title={movie.title}
            year={movie.year}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(3,7,18,0.08),rgba(3,7,18,0.22)_32%,rgba(2,6,23,0.94)_100%)]" />
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black via-black/45 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <p className="text-xs uppercase tracking-[0.34em] text-rose-200">
              {movie.year || "Classic Pick"}
            </p>
            <h3 className="mt-2 text-xl font-black text-white">{movie.title}</h3>
            <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-300">
              {subtitle || movie.overview || movie.genres}
            </p>
            <div className="mt-4 inline-flex rounded-full border border-white/10 bg-white/[0.08] px-3 py-1 text-[0.7rem] uppercase tracking-[0.28em] text-slate-200">
              {selected ? "Selected" : movie.genres || "TasteFlix Pick"}
            </div>
          </div>
        </div>
      </button>
      {actionLabel && onAction ? (
        <div className="border-t border-white/10 bg-black/25 p-3">
          <button
            type="button"
            onClick={onAction}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-rose-400/25 bg-rose-500/10 px-4 py-2.5 text-sm font-semibold text-rose-200 transition hover:border-rose-300/45 hover:bg-rose-500/20"
          >
            <Trash2 className="h-4 w-4" />
            {actionLabel}
          </button>
        </div>
      ) : null}
    </motion.div>
  );
}
