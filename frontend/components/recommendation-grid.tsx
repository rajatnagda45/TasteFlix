"use client";

import { motion } from "framer-motion";
import { ThumbsDown, ThumbsUp, X } from "lucide-react";
import { useState } from "react";

import { api } from "@/services/api";
import { Movie, Recommendation } from "@/types";

const MOODS: Record<string, string[]> = {
  "Feel Good": ["Comedy", "Family", "Animation", "Romance"],
  Emotional: ["Drama", "Romance", "Family"],
  "Action Night": ["Action", "Thriller", "Crime", "War"],
  "Mind-Bending": ["Sci-Fi", "Mystery", "Thriller", "Fantasy"],
};

interface RecommendationGridProps {
  items: Recommendation[];
  onFeedback: (movieId: number, sentiment: "like" | "dislike") => Promise<void>;
  refreshing?: boolean;
}

export function RecommendationGrid({ items, onFeedback, refreshing = false }: RecommendationGridProps) {
  const [activeMood, setActiveMood] = useState<string>("All");
  const [expandedMovies, setExpandedMovies] = useState<Record<number, boolean>>({});
  const [similarForMovie, setSimilarForMovie] = useState<Movie | null>(null);
  const [similarMovies, setSimilarMovies] = useState<Movie[]>([]);
  const [similarLoading, setSimilarLoading] = useState(false);
  const [feedbackLoading, setFeedbackLoading] = useState<number | null>(null);

  const filteredItems =
    activeMood === "All"
      ? items
      : items.filter((item) =>
          (MOODS[activeMood] || []).some((genre) =>
            (item.movie.genres || "").toLowerCase().includes(genre.toLowerCase()),
          ),
        );

  async function openSimilarMovies(movie: Movie) {
    setSimilarForMovie(movie);
    setSimilarLoading(true);
    try {
      const matches = await api.similarMovies(movie.id, 6);
      setSimilarMovies(matches);
    } finally {
      setSimilarLoading(false);
    }
  }

  async function handleFeedback(movieId: number, sentiment: "like" | "dislike") {
    setFeedbackLoading(movieId);
    try {
      await onFeedback(movieId, sentiment);
    } finally {
      setFeedbackLoading(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3">
        {["All", ...Object.keys(MOODS)].map((mood) => (
          <button
            key={mood}
            onClick={() => setActiveMood(mood)}
            className={`rounded-full px-4 py-2 text-sm font-semibold ${
              activeMood === mood ? "bg-glow text-white" : "bg-white/10 text-slate-300"
            }`}
          >
            {mood}
          </button>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {filteredItems.map((item, index) => {
          const isExpanded = Boolean(expandedMovies[item.movie.id]);
          const summary = item.movie.overview || item.explanation;
          const confidencePercent = Math.round(item.confidence * 100);
          const becauseYouLiked = item.because_you_liked.slice(0, 2);

          return (
            <motion.article
              key={item.movie.id}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="overflow-hidden rounded-[28px] border border-white/10 bg-panel/80 shadow-card"
            >
              <div className="grid gap-4 p-4 sm:grid-cols-[120px,1fr]">
                <button type="button" onClick={() => openSimilarMovies(item.movie)} className="text-left">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.movie.poster_url || ""}
                    alt={item.movie.title}
                    className="aspect-[2/3] w-full rounded-2xl object-cover transition hover:scale-[1.02]"
                  />
                </button>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.25em] text-rose-300">Predicted Match</p>
                    <h3 className="mt-1 text-2xl font-bold text-white">{item.movie.title}</h3>
                    <p className="text-sm text-slate-400">
                      {item.movie.year || "Unknown year"} • {item.movie.genres || "Genre unavailable"}
                    </p>
                  </div>

                  {becauseYouLiked.length ? (
                    <div className="rounded-2xl border border-sky-400/15 bg-sky-500/10 p-3">
                      <p className="text-xs uppercase tracking-[0.2em] text-sky-200">Because you liked</p>
                      <p className="mt-2 text-sm font-medium text-white">{becauseYouLiked.join(" • ")}</p>
                    </div>
                  ) : null}

                  <div className="flex gap-3 text-sm">
                    <span className="rounded-full bg-white/10 px-3 py-1 text-white">
                      Rating {item.predicted_rating}/5
                    </span>
                    <span className="rounded-full bg-sky-500/15 px-3 py-1 text-sky-200">
                      Confidence {confidencePercent}%
                    </span>
                  </div>

                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                    Based on similarity score and predicted rating
                  </p>

                  <div>
                    <p
                      className="text-sm leading-6 text-slate-300"
                      style={
                        isExpanded
                          ? undefined
                          : {
                              display: "-webkit-box",
                              WebkitLineClamp: 3,
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden",
                            }
                      }
                    >
                      {summary}
                    </p>
                    {summary && summary.length > 160 ? (
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedMovies((current) => ({
                            ...current,
                            [item.movie.id]: !current[item.movie.id],
                          }))
                        }
                        className="mt-2 text-sm font-semibold text-rose-300 transition hover:text-rose-200"
                      >
                        {isExpanded ? "Show less" : "Read more"}
                      </button>
                    ) : null}
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <p className="text-xs uppercase tracking-[0.25em] text-rose-300">Why this movie?</p>
                    <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-300">
                      {item.why_recommended.map((reason) => (
                        <li key={reason}>{reason}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex flex-wrap gap-3 text-xs uppercase tracking-[0.2em] text-slate-400">
                    <span>Similarity {item.similarity_score.toFixed(2)}</span>
                    <span>Genre Match {item.genre_match_percent}%</span>
                    {item.similar_users_rating ? <span>Peer Rating {item.similar_users_rating}/5</span> : null}
                  </div>

                  <div className="flex flex-wrap gap-3 pt-1">
                    <button
                      type="button"
                      disabled={refreshing || feedbackLoading === item.movie.id}
                      onClick={() => handleFeedback(item.movie.id, "like")}
                      className="inline-flex items-center gap-2 rounded-full bg-emerald-500/15 px-4 py-2 text-sm font-semibold text-emerald-200 transition hover:bg-emerald-500/25 disabled:opacity-60"
                    >
                      <ThumbsUp className="h-4 w-4" />
                      Like
                    </button>
                    <button
                      type="button"
                      disabled={refreshing || feedbackLoading === item.movie.id}
                      onClick={() => handleFeedback(item.movie.id, "dislike")}
                      className="inline-flex items-center gap-2 rounded-full bg-rose-500/15 px-4 py-2 text-sm font-semibold text-rose-200 transition hover:bg-rose-500/25 disabled:opacity-60"
                    >
                      <ThumbsDown className="h-4 w-4" />
                      Not Interested
                    </button>
                    <button
                      type="button"
                      onClick={() => openSimilarMovies(item.movie)}
                      className="rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-sky-300/40 hover:text-white"
                    >
                      Similar Movies
                    </button>
                  </div>
                </div>
              </div>
            </motion.article>
          );
        })}
      </div>

      {similarForMovie ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 md:items-center">
          <div className="w-full max-w-5xl rounded-[32px] border border-white/10 bg-[#0f1324] p-6 shadow-card">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-sky-200">Similar Movies</p>
                <h3 className="mt-2 text-3xl font-black text-white">{similarForMovie.title}</h3>
                <p className="mt-2 text-slate-400">Content neighbors discovered through cosine similarity.</p>
              </div>
              <button
                type="button"
                onClick={() => setSimilarForMovie(null)}
                className="rounded-full border border-white/10 p-2 text-slate-300 transition hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-6">
              {similarLoading ? (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center text-slate-300">
                  Finding the closest matches...
                </div>
              ) : (
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {similarMovies.map((movie) => (
                    <div key={movie.id} className="overflow-hidden rounded-3xl border border-white/10 bg-white/5">
                      <div className="relative aspect-[2/3] overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={movie.poster_url || ""} alt={movie.title} className="h-full w-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                        <div className="absolute bottom-0 left-0 right-0 p-4">
                          <p className="text-xs uppercase tracking-[0.25em] text-rose-200">{movie.year || "Pick"}</p>
                          <h4 className="mt-2 text-xl font-bold text-white">{movie.title}</h4>
                          <p className="mt-2 text-sm text-slate-300">{movie.genres || "Genre unavailable"}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
