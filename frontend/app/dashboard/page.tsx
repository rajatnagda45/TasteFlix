"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

import { DashboardSearch } from "@/components/dashboard-search";
import { MovieDetailOverlay } from "@/components/movie-detail-overlay";
import { SectionRow } from "@/components/section-row";
import { api } from "@/services/api";
import { Movie } from "@/types";


export default function DashboardPage() {
  const [hollywood, setHollywood] = useState<Movie[]>([]);
  const [bollywood, setBollywood] = useState<Movie[]>([]);
  const [catalog, setCatalog] = useState<Movie[]>([]);
  const [loading, setLoading] = useState({ hollywood: true, bollywood: true, catalog: true });
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);

  useEffect(() => {
    let active = true;

    async function loadSection(
      key: keyof typeof loading,
      fetcher: () => Promise<Movie[]>,
      setter: (movies: Movie[]) => void,
    ) {
      try {
        const movies = await fetcher();
        if (active) {
          setter(movies);
        }
      } catch {
        if (active) {
          setter([]);
        }
      } finally {
        if (active) {
          setLoading((current) => ({ ...current, [key]: false }));
        }
      }
    }

    loadSection("hollywood", api.trending, setHollywood);
    loadSection("bollywood", api.bollywood, setBollywood);
    loadSection("catalog", () => api.movies(), setCatalog);

    return () => {
      active = false;
    };
  }, []);

  return (
    <main className="page-shell py-8">
      <motion.section
        initial={{ opacity: 0, y: 22 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeInOut" }}
        className="cinema-panel p-8 sm:p-10"
      >
        <p className="text-sm uppercase tracking-[0.35em] text-rose-200">Your AI cinema companion</p>
        <div className="mt-4 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl">Find a movie that actually fits tonight.</h1>
            <p className="mt-4 max-w-2xl text-slate-300">
              Start with a few movies you love, then let TasteFlix generate recommendations with
              confidence scores and explainable reasoning.
            </p>
          </div>
          <Link
            href="/taste"
            className="premium-button bg-[linear-gradient(135deg,rgba(244,63,94,0.96),rgba(168,85,247,0.86),rgba(56,189,248,0.88))] px-6 py-4 text-sm font-bold uppercase tracking-[0.25em]"
          >
            Build My Taste Profile
          </Link>
        </div>
      </motion.section>

      <div className="mt-12 space-y-14">
        <DashboardSearch
          onMovieSelect={setSelectedMovie}
          suggestionSeeds={[
            ...hollywood.slice(0, 3).map((movie) => movie.title),
            ...bollywood.slice(0, 2).map((movie) => movie.title),
          ]}
        />
        <SectionRow
          title="Hollywood Hits"
          caption="Popular English-language favorites from the MovieLens-powered catalog."
          movies={hollywood}
          loading={loading.hollywood}
          onMovieSelect={setSelectedMovie}
          posterOnly
        />
        <SectionRow
          title="Bollywood Picks"
          caption="Indian and Hindi-language standouts from the local catalog, enriched by TMDB when synced."
          movies={bollywood}
          loading={loading.bollywood}
          emptyMessage="No Bollywood picks found locally yet. Run the TMDB sync from the backend admin endpoint to enrich more."
          onMovieSelect={setSelectedMovie}
          posterOnly
        />
        <SectionRow
          title="Browse the Catalog"
          caption="A broader mix from the recommendation catalog."
          movies={catalog}
          loading={loading.catalog}
          onMovieSelect={setSelectedMovie}
          posterOnly
        />
      </div>

      <MovieDetailOverlay movie={selectedMovie} onClose={() => setSelectedMovie(null)} />
    </main>
  );
}
