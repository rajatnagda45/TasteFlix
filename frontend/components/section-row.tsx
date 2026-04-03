"use client";

import { Movie } from "@/types";
import { MovieCard } from "@/components/movie-card";

interface SectionRowProps {
  title: string;
  movies: Movie[];
  caption?: string;
}

export function SectionRow({ title, movies, caption }: SectionRowProps) {
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
        {movies.map((movie) => (
          <MovieCard key={movie.id} movie={movie} />
        ))}
      </div>
    </section>
  );
}
