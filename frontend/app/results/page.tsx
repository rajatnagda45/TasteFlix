"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { RecommendationGrid } from "@/components/recommendation-grid";
import {
  getRecommendationRequest,
  getResults,
  getUser,
  removeFromWatchlist,
  saveResults,
  saveToWatchlist,
} from "@/lib/storage";
import { Movie, Recommendation } from "@/types";
import { api } from "@/services/api";


export default function ResultsPage() {
  const [results, setResults] = useState<Recommendation[]>([]);
  const [tasteProfile, setTasteProfile] = useState<{ genre: string; percent: number }[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const stored = getResults();
    setResults(stored.recommendations);
    setTasteProfile(stored.taste_profile || []);
  }, []);

  async function handleFeedback(movie: Movie, sentiment: "like" | "dislike") {
    const user = getUser();
    if (!user) {
      return;
    }

    const request = getRecommendationRequest();
    if (!request) {
      return;
    }

    setRefreshing(true);
    try {
      await api.feedback({ movie_id: movie.id, sentiment });
      if (sentiment === "like") {
        saveToWatchlist(movie);
      } else {
        removeFromWatchlist(movie.id);
      }
      const refreshed = await api.recommend({
        ...request,
        user_id: user.id,
      });
      saveResults(refreshed);
      setResults(refreshed.recommendations);
      setTasteProfile(refreshed.taste_profile || []);
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      <section className="rounded-[36px] border border-white/10 bg-white/5 p-8 shadow-card">
        <p className="text-sm uppercase tracking-[0.35em] text-rose-200">Your Recommendation Feed</p>
        <h1 className="mt-4 text-4xl font-black text-white">Based on your taste, start here.</h1>
        <p className="mt-4 text-slate-300">
          Every card includes a predicted score and a short explanation of why it made the cut.
        </p>
      </section>

      {tasteProfile.length ? (
        <section className="mt-8 rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-card">
          <p className="text-sm uppercase tracking-[0.3em] text-sky-200">Your Taste</p>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {tasteProfile.map((item) => (
              <div key={item.genre} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="flex items-center justify-between text-sm text-slate-300">
                  <span>{item.genre}</span>
                  <span>{item.percent}%</span>
                </div>
                <div className="mt-3 h-2 rounded-full bg-white/10">
                  <div className="h-2 rounded-full bg-glow" style={{ width: `${item.percent}%` }} />
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <div className="mt-10">
        {results.length ? (
          <RecommendationGrid items={results} onFeedback={handleFeedback} refreshing={refreshing} />
        ) : (
          <div className="rounded-[32px] border border-white/10 bg-white/5 p-8 text-center shadow-card">
            <p className="text-lg text-slate-300">No recommendations yet. Build your taste profile first.</p>
            <Link href="/taste" className="mt-6 inline-flex rounded-full bg-glow px-6 py-4 font-bold text-white">
              Pick Favorite Movies
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
