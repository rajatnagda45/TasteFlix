"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

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
    <main className="page-shell py-8">
      <motion.section
        initial={{ opacity: 0, y: 22 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeInOut" }}
        className="cinema-panel p-8 sm:p-10"
      >
        <p className="text-sm uppercase tracking-[0.35em] text-rose-200">Your Recommendation Feed</p>
        <h1 className="mt-4 text-4xl font-black tracking-tight text-white sm:text-6xl">Based on your taste, start here.</h1>
        <p className="mt-4 text-slate-300">
          Every card includes a predicted score and a short explanation of why it made the cut.
        </p>
      </motion.section>

      {tasteProfile.length ? (
        <motion.section
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.06, ease: "easeInOut" }}
          className="cinema-panel mt-8 p-6 sm:p-8"
        >
          <p className="text-sm uppercase tracking-[0.3em] text-sky-200">Your Taste</p>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {tasteProfile.map((item) => (
              <div key={item.genre} className="glow-card p-4">
                <div className="flex items-center justify-between text-sm text-slate-300">
                  <span>{item.genre}</span>
                  <span>{item.percent}%</span>
                </div>
                <div className="mt-4 h-2.5 rounded-full bg-white/10">
                  <div
                    className="h-2.5 rounded-full bg-[linear-gradient(90deg,#f43f5e,#a855f7,#38bdf8)] shadow-[0_0_24px_rgba(56,189,248,0.25)]"
                    style={{ width: `${item.percent}%` }}
                  />
                </div>
              </div>
              ))}
          </div>
        </motion.section>
      ) : null}

      <div className="mt-10">
        {results.length ? (
          <RecommendationGrid items={results} onFeedback={handleFeedback} refreshing={refreshing} />
        ) : (
          <div className="cinema-panel p-8 text-center">
            <p className="text-lg text-slate-300">No recommendations yet. Build your taste profile first.</p>
            <Link
              href="/taste"
              className="premium-button mt-6 inline-flex bg-[linear-gradient(135deg,rgba(244,63,94,0.96),rgba(168,85,247,0.86),rgba(56,189,248,0.88))] px-6 py-4 font-bold text-white"
            >
              Pick Favorite Movies
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
