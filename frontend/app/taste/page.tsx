"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { MovieSelector } from "@/components/movie-selector";
import { getUser, saveRecommendationRequest, saveResults } from "@/lib/storage";
import { api } from "@/services/api";


export default function TastePage() {
  const router = useRouter();
  const [selectedMovies, setSelectedMovies] = useState<{ movie_id: number; rating: number }[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function generateRecommendations() {
    if (selectedMovies.length < 3) {
      setError("Pick at least 3 favorite movies to generate meaningful recommendations.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const user = getUser();
      const response = await api.recommend({
        user_id: user?.id,
        selected_movies: selectedMovies,
        top_n: 12,
      });
      saveRecommendationRequest({
        user_id: user?.id,
        selected_movies: selectedMovies,
        top_n: 12,
      });
      saveResults(response);
      router.push("/results");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not generate recommendations");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      <section className="rounded-[36px] border border-white/10 bg-white/5 p-8 shadow-card">
        <p className="text-sm uppercase tracking-[0.35em] text-sky-200">Input-first flow</p>
        <h1 className="mt-4 text-4xl font-black text-white">Teach TasteFlix what you love</h1>
        <p className="mt-4 max-w-2xl text-slate-300">
          Search the catalog, select favorites, and optionally score them more precisely. The model
          blends your selections with similarity and collaborative signals.
        </p>
      </section>

      <div className="mt-10">
        <MovieSelector onChange={setSelectedMovies} />
      </div>

      {error ? <p className="mt-6 text-sm text-rose-300">{error}</p> : null}

      <div className="mt-8 flex justify-end">
        <button
          onClick={generateRecommendations}
          disabled={loading}
          className="rounded-full bg-glow px-6 py-4 text-sm font-bold uppercase tracking-[0.25em] text-white disabled:opacity-60"
        >
          {loading ? "Generating..." : "Get Recommendations"}
        </button>
      </div>
    </main>
  );
}
