"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Search, Sparkles, Star } from "lucide-react";

import { MovieCard } from "@/components/movie-card";
import { api } from "@/services/api";
import { Movie } from "@/types";

interface SelectedMovie {
  movie: Movie;
  rating: number;
}

function getInitialRating(movie: Movie) {
  if (typeof movie.avg_rating === "number" && Number.isFinite(movie.avg_rating)) {
    return Math.min(5, Math.max(1, movie.avg_rating));
  }
  return 5;
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
      return [...current, { movie, rating: getInitialRating(movie) }];
    });
  }

  function updateRating(movieId: number, rating: number) {
    setSelected((current) =>
      current.map((item) => (item.movie.id === movieId ? { ...item, rating } : item)),
    );
  }

  return (
    <div className="space-y-8">
      <div className="cinema-panel p-5 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by title, genre, or director"
              className="min-w-0 w-full rounded-[24px] border border-white/10 bg-black/30 px-14 py-4 text-white outline-none ring-0 transition placeholder:text-slate-500 focus:border-sky-300/35 focus:bg-black/40 focus:shadow-[0_0_0_1px_rgba(56,189,248,0.12),0_0_30px_rgba(56,189,248,0.12)]"
            />
          </div>
          <button
            type="button"
            onClick={onGenerate}
            disabled={generating || selected.length === 0}
            className="premium-button bg-[linear-gradient(135deg,rgba(244,63,94,0.96),rgba(168,85,247,0.88),rgba(56,189,248,0.9))] px-6 py-4 text-sm font-bold uppercase tracking-[0.24em] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Sparkles className="mr-2 h-4 w-4" />
            {generating ? "Generating..." : "Get Recommendations"}
          </button>
        </div>
        <div className="mt-4 flex flex-col gap-2 text-sm text-slate-400 sm:flex-row sm:items-center sm:justify-between">
          <p>Select atleast 1 movie to get recommendations. Add more if you want a sharper taste profile.</p>
          <p className={selected.length ? "text-emerald-300" : "text-slate-500"}>
            {selected.length} selected
          </p>
        </div>
        {error ? <p className="mt-3 text-sm text-rose-300">{error}</p> : null}
      </div>

      {selected.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          className="cinema-panel border-rose-400/15 bg-[linear-gradient(135deg,rgba(244,63,94,0.1),rgba(15,23,42,0.86),rgba(56,189,248,0.08))] p-5 sm:p-6"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/[0.08] text-rose-200">
              <Star className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-white">Your taste profile</h3>
              <p className="mt-1 text-sm text-slate-400">Fine-tune each title to sharpen the recommendation engine.</p>
            </div>
          </div>
          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            {selected.map((item) => (
              <div key={item.movie.id} className="rounded-[24px] border border-white/10 bg-black/20 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                <p className="font-semibold text-white">{item.movie.title}</p>
                <label className="mt-4 block text-sm text-slate-300">
                  Rating
                  <input
                    type="range"
                    min={1}
                    max={5}
                    step={0.1}
                    value={item.rating}
                    onChange={(event) => updateRating(item.movie.id, Number(event.target.value))}
                    className="mt-3 w-full accent-rose-400"
                  />
                </label>
                <div className="mt-3 inline-flex rounded-full border border-rose-400/20 bg-rose-500/10 px-3 py-1 text-sm font-semibold text-rose-200">
                  {item.rating.toFixed(1)} / 5
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {isPending
          ? Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="skeleton-shimmer aspect-[2/3] rounded-[28px]" />
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
