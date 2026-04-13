"use client";

import { motion } from "framer-motion";
import { ThumbsDown, ThumbsUp, X } from "lucide-react";
import { useState } from "react";

import { SafePoster } from "@/components/safe-poster";
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
  onFeedback: (movie: Movie, sentiment: "like" | "dislike") => Promise<void>;
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

  async function handleFeedback(movie: Movie, sentiment: "like" | "dislike") {
    setFeedbackLoading(movie.id);
    try {
      await onFeedback(movie, sentiment);
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
                  <SafePoster
                    src={item.movie.poster_url || ""}
                    title={item.movie.title}
                    year={item.movie.year}
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
                      onClick={() => handleFeedback(item.movie, "like")}
                      className="inline-flex items-center gap-2 rounded-full bg-emerald-500/15 px-4 py-2 text-sm font-semibold text-emerald-200 transition hover:bg-emerald-500/25 disabled:opacity-60"
                    >
                      <ThumbsUp className="h-4 w-4" />
                      Want to Watch
                    </button>
                    <button
                      type="button"
                      disabled={refreshing || feedbackLoading === item.movie.id}
                      onClick={() => handleFeedback(item.movie, "dislike")}
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
        <div className="fixed inset-0 z-50 flex items-end justify-center overflow-hidden bg-[#020617]/95 p-4 md:items-center">
          <div className="pointer-events-none absolute -left-24 top-10 h-80 w-80 rounded-full bg-rose-600/20 blur-3xl" />
          <div className="pointer-events-none absolute bottom-0 right-0 h-96 w-96 rounded-full bg-sky-500/20 blur-3xl" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_15%,rgba(255,255,255,0.08),transparent_28%),linear-gradient(135deg,rgba(15,23,42,0.7),rgba(2,6,23,0.98))]" />
          <div className="relative max-h-[88vh] w-full max-w-4xl overflow-hidden rounded-[36px] border border-white/15 bg-slate-950/85 shadow-[0_30px_120px_rgba(0,0,0,0.75)] backdrop-blur-xl">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-rose-500 via-amber-300 to-sky-400" />
            <div className="flex items-start justify-between gap-4 border-b border-white/10 bg-white/[0.03]">
              <div className="grid gap-5 p-6 sm:grid-cols-[86px,1fr] sm:items-center">
                <div className="hidden overflow-hidden rounded-2xl border border-white/10 bg-black/40 sm:block">
                  <SafePoster
                    src={similarForMovie.poster_url}
                    title={similarForMovie.title}
                    year={similarForMovie.year}
                    className="aspect-[2/3] h-full w-full object-cover"
                  />
                </div>
                <div>
                  <p className="text-sm uppercase tracking-[0.3em] text-sky-200">Similar Movies</p>
                  <h3 className="mt-2 text-2xl font-black text-white md:text-4xl">{similarForMovie.title}</h3>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
                    A curated similarity set from TasteFlix based on genre, tags, story signals, and recommendation distance.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSimilarForMovie(null)}
                className="m-6 rounded-full border border-white/10 bg-white/10 p-2 text-slate-300 transition hover:bg-white/15 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto p-5">
              {similarLoading ? (
                <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center text-slate-300">
                  Finding the closest matches...
                </div>
              ) : similarMovies.length === 0 ? (
                <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center text-slate-300">
                  No close matches found yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {similarMovies.map((movie) => (
                    <article
                      key={movie.id}
                      className="grid grid-cols-[82px,1fr] gap-4 rounded-3xl border border-white/10 bg-white/[0.055] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] transition hover:border-sky-300/40 hover:bg-white/[0.09]"
                    >
                      <div className="overflow-hidden rounded-2xl bg-black/30">
                        <SafePoster
                          src={movie.poster_url}
                          title={movie.title}
                          year={movie.year}
                          className="aspect-[2/3] h-full w-full object-cover"
                        />
                      </div>
                      <div className="min-w-0 py-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-rose-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-rose-200">
                            {movie.year || "Pick"}
                          </span>
                          <span className="rounded-full bg-sky-500/10 px-3 py-1 text-xs font-semibold text-sky-200">
                            {movie.genres || "Genre unavailable"}
                          </span>
                        </div>
                        <h4 className="mt-3 line-clamp-2 text-xl font-bold text-white">{movie.title}</h4>
                        <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-400">
                          {movie.overview || movie.tags || "A close content neighbor from the TasteFlix catalog."}
                        </p>
                      </div>
                    </article>
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
