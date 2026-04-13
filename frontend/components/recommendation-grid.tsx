"use client";

import { motion } from "framer-motion";
import { CheckCircle2, Info, Sparkles, ThumbsDown, ThumbsUp, X } from "lucide-react";
import { useEffect, useState } from "react";

import { SafePoster } from "@/components/safe-poster";
import { getWatchlist, saveToWatchlist } from "@/lib/storage";
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
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);
  const [watchlistIds, setWatchlistIds] = useState<number[]>([]);

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
      setWatchlistIds(getWatchlist().map((item) => item.id));
      setFeedbackToast(sentiment === "like" ? `${movie.title} added to Want to Watch` : `${movie.title} marked as not interested`);
    } finally {
      setFeedbackLoading(null);
    }
  }

  function handleSaveSimilarMovie(movie: Movie) {
    saveToWatchlist(movie);
    setWatchlistIds(getWatchlist().map((item) => item.id));
    setFeedbackToast(`${movie.title} added to Want to Watch`);
  }

  useEffect(() => {
    setWatchlistIds(getWatchlist().map((item) => item.id));
  }, []);

  useEffect(() => {
    if (!feedbackToast) {
      return;
    }
    const timeout = window.setTimeout(() => setFeedbackToast(null), 1800);
    return () => window.clearTimeout(timeout);
  }, [feedbackToast]);

  return (
    <div className="space-y-6">
      <div className="overflow-x-auto pb-2">
      <div className="flex min-w-max gap-3">
        {["All", ...Object.keys(MOODS)].map((mood) => (
          <button
            key={mood}
            onClick={() => setActiveMood(mood)}
            className={`glass-chip relative overflow-hidden px-5 py-3 text-sm font-semibold transition duration-300 ${
              activeMood === mood
                ? "border-white/20 bg-[linear-gradient(135deg,rgba(244,63,94,0.72),rgba(168,85,247,0.5),rgba(56,189,248,0.45))] text-white shadow-[0_12px_40px_rgba(244,63,94,0.22)]"
                : "text-slate-300 hover:border-white/20 hover:bg-white/[0.1] hover:text-white"
            }`}
          >
            {mood}
          </button>
        ))}
      </div>
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
              initial={{ opacity: 0, y: 28, scale: 0.98 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -12, scale: 1.02 }}
              transition={{ delay: index * 0.05, duration: 0.3 }}
              className="group relative overflow-hidden rounded-[32px] border border-white/10 bg-[linear-gradient(180deg,rgba(18,26,46,0.96),rgba(13,18,35,0.96))] shadow-[0_25px_70px_rgba(2,6,23,0.48)]"
            >
              <div className="pointer-events-none absolute inset-0 opacity-0 transition duration-300 group-hover:opacity-100">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(244,63,94,0.12),transparent_30%),radial-gradient(circle_at_80%_0%,rgba(56,189,248,0.12),transparent_26%)]" />
                <div className="absolute inset-0 ring-1 ring-sky-300/15" />
              </div>
              <div className="grid gap-5 p-5 sm:grid-cols-[132px,1fr]">
                <button type="button" onClick={() => openSimilarMovies(item.movie)} className="group/poster text-left">
                  <SafePoster
                    src={item.movie.poster_url || ""}
                    title={item.movie.title}
                    year={item.movie.year}
                    className="aspect-[2/3] w-full rounded-[24px] object-cover transition duration-500 group-hover/poster:scale-105"
                  />
                </button>
                <div className="space-y-4">
                  <div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-rose-300/15 bg-rose-500/10 px-3 py-1 text-[0.68rem] uppercase tracking-[0.34em] text-rose-200">
                      <Sparkles className="h-3.5 w-3.5" />
                      Predicted Match
                    </div>
                    <h3 className="mt-3 text-3xl font-black tracking-tight text-white">{item.movie.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-400">
                      {item.movie.year || "Unknown year"} • {item.movie.genres || "Genre unavailable"}
                    </p>
                  </div>

                  {becauseYouLiked.length ? (
                    <div className="rounded-[24px] border border-sky-400/15 bg-sky-500/10 p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-sky-200">Because you liked</p>
                      <p className="mt-3 text-base font-medium text-white">{becauseYouLiked.join(" • ")}</p>
                    </div>
                  ) : null}

                  <div className="flex flex-wrap gap-3 text-sm">
                    <span className="glass-chip px-4 py-2 text-white">
                      Rating {item.predicted_rating}/5
                    </span>
                    <span className="rounded-full border border-sky-400/15 bg-sky-500/15 px-4 py-2 text-sky-200">
                      Confidence {confidencePercent}%
                    </span>
                  </div>

                  <p className="text-xs uppercase tracking-[0.28em] text-slate-500">
                    Based on similarity score and predicted rating
                  </p>

                  <div>
                    <p
                      className="text-sm leading-7 text-slate-300"
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
                        className="mt-3 text-sm font-semibold text-rose-300 transition hover:text-rose-200"
                      >
                        {isExpanded ? "Show less" : "Read more"}
                      </button>
                    ) : null}
                  </div>

                  <div className="rounded-[24px] border border-white/10 bg-black/20 p-4">
                    <p className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-rose-300">
                      <Info className="h-3.5 w-3.5" />
                      Why this movie?
                    </p>
                    <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-300">
                      {item.why_recommended.map((reason) => (
                        <li key={reason}>{reason}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex flex-wrap gap-4 text-xs uppercase tracking-[0.24em] text-slate-400">
                    <span>Similarity {item.similarity_score.toFixed(2)}</span>
                    <span>Genre Match {item.genre_match_percent}%</span>
                    {item.similar_users_rating ? <span>Peer Rating {item.similar_users_rating}/5</span> : null}
                  </div>

                  <div className="flex flex-wrap gap-3 pt-1">
                    <button
                      type="button"
                      disabled={refreshing || feedbackLoading === item.movie.id}
                      onClick={() => handleFeedback(item.movie, "like")}
                      className="premium-button inline-flex items-center gap-2 border border-emerald-400/15 bg-[linear-gradient(135deg,rgba(16,185,129,0.18),rgba(34,197,94,0.1))] px-5 py-3 text-sm font-semibold text-emerald-200 hover:border-emerald-300/30 hover:bg-emerald-500/20 disabled:opacity-60"
                    >
                      <ThumbsUp className="h-4 w-4" />
                      Want to Watch
                    </button>
                    <button
                      type="button"
                      disabled={refreshing || feedbackLoading === item.movie.id}
                      onClick={() => handleFeedback(item.movie, "dislike")}
                      className="premium-button inline-flex items-center gap-2 border border-rose-400/15 bg-[linear-gradient(135deg,rgba(244,63,94,0.16),rgba(190,24,93,0.1))] px-5 py-3 text-sm font-semibold text-rose-200 hover:border-rose-300/30 hover:bg-rose-500/20 disabled:opacity-60"
                    >
                      <ThumbsDown className="h-4 w-4" />
                      Not Interested
                    </button>
                    <button
                      type="button"
                      onClick={() => openSimilarMovies(item.movie)}
                      className="premium-button border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-slate-200 hover:border-sky-300/30 hover:bg-white/[0.08] hover:text-white"
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
        <div className="fixed inset-0 z-50 flex items-end justify-center overflow-hidden bg-[#020617]/95 p-4 backdrop-blur-md md:items-center">
          <div className="pointer-events-none absolute -left-24 top-10 h-80 w-80 rounded-full bg-rose-600/20 blur-3xl" />
          <div className="pointer-events-none absolute bottom-0 right-0 h-96 w-96 rounded-full bg-sky-500/20 blur-3xl" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_15%,rgba(255,255,255,0.08),transparent_28%),linear-gradient(135deg,rgba(15,23,42,0.7),rgba(2,6,23,0.98))]" />
          <div className="relative max-h-[88vh] w-full max-w-4xl overflow-hidden rounded-[36px] border border-white/15 bg-slate-950/85 shadow-[0_30px_120px_rgba(0,0,0,0.75)] backdrop-blur-xl">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-rose-500 via-amber-300 to-sky-400" />
            <div className="flex items-start justify-between gap-4 border-b border-white/10 bg-white/[0.03]">
              <div className="grid gap-5 p-6 sm:grid-cols-[86px,1fr] sm:items-center">
                <div className="hidden overflow-hidden rounded-[24px] border border-white/10 bg-black/40 sm:block">
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
                <div className="skeleton-shimmer rounded-3xl border border-white/10 bg-white/5 p-8 text-center text-slate-300">
                  Finding the closest matches...
                </div>
              ) : similarMovies.length === 0 ? (
                <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center text-slate-300">
                  No close matches found yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {similarMovies.map((movie) => {
                    const isSaved = watchlistIds.includes(movie.id);

                    return (
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
                          <div className="mt-4 flex flex-wrap gap-3">
                            <button
                              type="button"
                              disabled={isSaved}
                              onClick={() => handleSaveSimilarMovie(movie)}
                              className={`premium-button inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold ${
                                isSaved
                                  ? "cursor-default border border-emerald-300/20 bg-emerald-500/15 text-emerald-100"
                                  : "border border-emerald-400/15 bg-[linear-gradient(135deg,rgba(16,185,129,0.18),rgba(34,197,94,0.1))] text-emerald-200 hover:border-emerald-300/30 hover:bg-emerald-500/20"
                              }`}
                            >
                              <ThumbsUp className="h-4 w-4" />
                              {isSaved ? "Saved to Watchlist" : "Want to Watch"}
                            </button>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {feedbackToast ? (
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          className="fixed bottom-5 right-5 z-50 inline-flex items-center gap-3 rounded-full border border-emerald-300/20 bg-slate-950/90 px-5 py-3 text-sm font-medium text-white shadow-[0_18px_50px_rgba(2,6,23,0.52)] backdrop-blur-xl"
        >
          <CheckCircle2 className="h-4 w-4 text-emerald-300" />
          {feedbackToast}
        </motion.div>
      ) : null}
    </div>
  );
}
