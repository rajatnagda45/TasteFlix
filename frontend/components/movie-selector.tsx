"use client";

import { useEffect, useState } from "react";

import { MovieCard } from "@/components/movie-card";
import { api } from "@/services/api";
import { Movie } from "@/types";

interface SelectedMovie {
  movie: Movie;
  rating: number;
}

export function MovieSelector({
  onChange,
  onGenerate,
  generating = false,
  error,
}: {
  onChange: (items: { movie_id: number; rating: number }[]) => void;
  onGenerate: () => void;
  generating?: boolean;
  error?: string;
}) {
  const [query, setQuery] = useState("");
  const [catalog, setCatalog] = useState<Movie[]>([]);
  const [selected, setSelected] = useState<SelectedMovie[]>([]);
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    let active = true;
    async function loadMovies() {
      setIsPending(true);
      const results = await api.movies(query);
      if (active) {
        setCatalog(results);
        setIsPending(false);
      }
    }
    loadMovies();
    return () => {
      active = false;
    };
  }, [query]);

  useEffect(() => {
    onChange(selected.map((item) => ({ movie_id: item.movie.id, rating: item.rating })));
  }, [onChange, selected]);

  function toggleMovie(movie: Movie) {
    setSelected((current) => {
      const exists = current.find((item) => item.movie.id === movie.id);
      if (exists) {
        return current.filter((item) => item.movie.id !== movie.id);
      }
      return [...current, { movie, rating: 5 }];
    });
  }

  function updateRating(movieId: number, rating: number) {
    setSelected((current) =>
      current.map((item) => (item.movie.id === movieId ? { ...item, rating } : item)),
    );
  }

  return (
    <div className="space-y-8">
      <div className="rounded-[28px] border border-white/10 bg-white/5 p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by title, genre, or director"
            className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-black/30 px-5 py-4 text-white outline-none ring-0 placeholder:text-slate-500"
          />
          <button
            type="button"
            onClick={onGenerate}
            disabled={generating || selected.length === 0}
            className="rounded-full bg-glow px-6 py-4 text-sm font-bold uppercase tracking-[0.25em] text-white transition hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {generating ? "Generating..." : "Get Recommendations"}
          </button>
        </div>
        <div className="mt-3 flex flex-col gap-2 text-sm text-slate-400 sm:flex-row sm:items-center sm:justify-between">
          <p>Select atleast 1 movie to get recommendations. Add more if you want a sharper taste profile.</p>
          <p className={selected.length ? "text-emerald-300" : "text-slate-500"}>
            {selected.length} selected
          </p>
        </div>
        {error ? <p className="mt-3 text-sm text-rose-300">{error}</p> : null}
      </div>

      {selected.length > 0 && (
        <div className="rounded-[28px] border border-glow/30 bg-glow/10 p-5">
          <h3 className="text-xl font-semibold text-white">Your taste profile</h3>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            {selected.map((item) => (
              <div key={item.movie.id} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="font-semibold text-white">{item.movie.title}</p>
                <label className="mt-3 block text-sm text-slate-300">
                  Rating
                  <input
                    type="range"
                    min={1}
                    max={5}
                    step={0.5}
                    value={item.rating}
                    onChange={(event) => updateRating(item.movie.id, Number(event.target.value))}
                    className="mt-2 w-full"
                  />
                </label>
                <p className="mt-2 text-sm text-rose-200">{item.rating.toFixed(1)} / 5</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {isPending
          ? Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="aspect-[2/3] animate-pulse rounded-3xl bg-white/10" />
          ))
          : catalog.map((movie) => (
            <MovieCard
              key={movie.id}
              movie={movie}
              selected={selected.some((item) => item.movie.id === movie.id)}
              onSelect={() => toggleMovie(movie)}
            />
          ))}
      </div>
    </div>
  );
}
