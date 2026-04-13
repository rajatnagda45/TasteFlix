"use client";

import { useEffect, useState } from "react";

import { SectionRow } from "@/components/section-row";
import { getWatchlist, removeFromWatchlist } from "@/lib/storage";
import { Movie } from "@/types";

export default function WatchlistPage() {
  const [movies, setMovies] = useState<Movie[]>([]);

  useEffect(() => {
    function loadWatchlist() {
      setMovies(getWatchlist());
    }
    loadWatchlist();
    window.addEventListener("focus", loadWatchlist);

    return () => {
      window.removeEventListener("focus", loadWatchlist);
    };
  }, []);

  function handleDelete(movie: Movie) {
    removeFromWatchlist(movie.id);
    setMovies(getWatchlist());
  }

  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      <section className="rounded-[36px] border border-white/10 bg-white/5 p-8 shadow-card">
        <p className="text-sm uppercase tracking-[0.35em] text-sky-200">Want to Watch</p>
        <h1 className="mt-4 text-4xl font-black text-white">All the movies you liked, saved in one place.</h1>
        <p className="mt-4 text-slate-300">
          Every time you press like on a recommendation, it appears here so you can revisit it later.
        </p>
      </section>

      <div className="mt-10">
        <SectionRow
          title="Your Watchlist"
          movies={movies}
          caption="A personal shelf built from the movies you liked across TasteFlix."
          emptyMessage="Like any movie from your recommendations and it will show up here."
          actionLabel="Remove"
          onMovieAction={handleDelete}
        />
      </div>
    </main>
  );
}
