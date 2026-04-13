"use client";

import { motion } from "framer-motion";

import { Movie } from "@/types";
import { MovieCard } from "@/components/movie-card";

interface SectionRowProps {
  title: string;
  movies: Movie[];
  caption?: string;
  loading?: boolean;
  emptyMessage?: string;
  actionLabel?: string;
  onMovieAction?: (movie: Movie) => void;
}

export function SectionRow({
  title,
  movies,
  caption,
  loading = false,
  emptyMessage = "No titles available yet.",
  actionLabel,
  onMovieAction,
}: SectionRowProps) {
  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-white">{title}</h2>
          {caption ? <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">{caption}</p> : null}
        </div>
        <span className="glass-chip w-fit px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-slate-300">
          {movies.length} Titles
        </span>
      </div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
        {loading
          ? Array.from({ length: 6 }).map((_, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0.35 }}
                animate={{ opacity: 1 }}
                transition={{ repeat: Infinity, repeatType: "reverse", duration: 1.05, delay: index * 0.06 }}
                className="skeleton-shimmer aspect-[2/3] rounded-[28px]"
              />
            ))
          : movies.map((movie) => (
              <MovieCard
                key={movie.id}
                movie={movie}
                actionLabel={actionLabel}
                onAction={onMovieAction ? () => onMovieAction(movie) : undefined}
              />
            ))}
      </div>
      {!loading && movies.length === 0 ? (
        <div className="cinema-panel p-6 text-sm leading-7 text-slate-400">
          {emptyMessage}
        </div>
      ) : null}
    </section>
  );
}
