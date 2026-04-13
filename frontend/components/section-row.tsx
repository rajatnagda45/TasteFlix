"use client";

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
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-white">{title}</h2>
          {caption ? <p className="mt-1 text-sm text-slate-400">{caption}</p> : null}
        </div>
        <span className="text-sm text-slate-400">{movies.length} titles</span>
      </div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
        {loading
          ? Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="aspect-[2/3] animate-pulse rounded-3xl bg-white/10" />
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
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-slate-400">
          {emptyMessage}
        </div>
      ) : null}
    </section>
  );
}
