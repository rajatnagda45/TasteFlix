"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, ExternalLink, Loader2, Play, Plus, Star, ThumbsDown, ThumbsUp, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { SafePoster } from "@/components/safe-poster";
import { useMovieTrailer } from "@/hooks/use-movie-trailer";
import { getWatchlist, saveToWatchlist } from "@/lib/storage";
import { api } from "@/services/api";
import { Movie, MovieDetail } from "@/types";

interface MovieDetailOverlayProps {
  movie: Movie | null;
  onClose: () => void;
}

function formatRuntime(minutes: number | null) {
  if (!minutes) {
    return null;
  }
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return hours ? `${hours}h ${remainder}m` : `${remainder}m`;
}

function formatRating(value: number | null | undefined) {
  return typeof value === "number" ? value.toFixed(1) : "N/A";
}

export function MovieDetailOverlay({ movie, onClose }: MovieDetailOverlayProps) {
  const [detail, setDetail] = useState<MovieDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trailerOpen, setTrailerOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [feedbackLoading, setFeedbackLoading] = useState<"like" | "dislike" | null>(null);

  const activeMovie = detail?.movie || movie;
  const backdrop = activeMovie?.backdrop_url || activeMovie?.poster_url || "";
  const runtime = formatRuntime(detail?.runtime ?? null);
  const year = activeMovie?.year || detail?.release_date?.slice(0, 4) || "Unknown";
  const genres = activeMovie?.genres?.replaceAll(" ", " / ") || "Genre unavailable";
  const directorText = detail?.directors.length ? detail.directors.join(", ") : activeMovie?.directors || "Director unavailable";
  const { trailer, loading: trailerLoading } = useMovieTrailer(movie, detail?.trailer);
  const playableTrailer = trailer ?? (detail?.trailer ? {
    source: detail.trailer.source,
    videoKey: detail.trailer.key,
    name: detail.trailer.name,
    site: detail.trailer.site,
    type: detail.trailer.type,
  } : null);
  const saved = useMemo(
    () => (movie ? getWatchlist().some((item) => item.id === movie.id) : false),
    [movie, toast],
  );

  useEffect(() => {
    if (!movie) {
      return;
    }

    let active = true;
    setLoading(true);
    setError(null);
    setDetail(null);
    setTrailerOpen(false);

    api.movieDetail(movie.id)
      .then((response) => {
        if (active) {
          setDetail(response);
        }
      })
      .catch((err) => {
        if (active) {
          setError(err instanceof Error ? err.message : "Could not load movie details");
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [movie]);

  useEffect(() => {
    if (!movie) {
      return;
    }

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        if (trailerOpen) {
          setTrailerOpen(false);
        } else {
          onClose();
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [movie, onClose, trailerOpen]);

  useEffect(() => {
    if (!toast) {
      return;
    }
    const timeout = window.setTimeout(() => setToast(null), 1800);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  function handleWantToWatch() {
    if (!activeMovie) {
      return;
    }
    saveToWatchlist(activeMovie);
    setToast(`${activeMovie.title} added to Want to Watch`);
  }

  async function handleFeedback(sentiment: "like" | "dislike") {
    if (!activeMovie) {
      return;
    }
    setFeedbackLoading(sentiment);
    try {
      if (sentiment === "like") {
        saveToWatchlist(activeMovie);
      }
      await api.feedback({ movie_id: activeMovie.id, sentiment });
      setToast(sentiment === "like" ? `${activeMovie.title} liked` : `${activeMovie.title} marked as not interested`);
    } catch (err) {
      const fallback =
        sentiment === "like"
          ? `${activeMovie.title} saved locally. Sign in to sync feedback.`
          : "Sign in to save this feedback.";
      setToast(err instanceof Error ? fallback : "Could not save feedback");
    } finally {
      setFeedbackLoading(null);
    }
  }

  if (!movie || !activeMovie) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[70] overflow-y-auto bg-black/70 p-3 backdrop-blur-md sm:p-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <button type="button" className="fixed inset-0 cursor-default" onClick={onClose} aria-label="Close movie details" />

        <motion.section
          role="dialog"
          aria-modal="true"
          aria-label={`${activeMovie.title} details`}
          initial={{ opacity: 0, y: 80, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 80, scale: 0.96 }}
          transition={{ type: "spring", stiffness: 170, damping: 24 }}
          className="relative mx-auto my-8 max-w-6xl overflow-hidden rounded-[34px] border border-white/15 bg-slate-950/92 shadow-[0_34px_140px_rgba(0,0,0,0.82)] backdrop-blur-2xl"
        >
          <div className="absolute inset-x-0 top-0 z-10 h-1 bg-gradient-to-r from-rose-500 via-violet-400 to-sky-400" />
          <button
            type="button"
            onClick={onClose}
            className="absolute right-5 top-5 z-30 rounded-full border border-white/15 bg-black/45 p-3 text-slate-200 shadow-[0_12px_40px_rgba(0,0,0,0.45)] backdrop-blur-xl transition hover:bg-white/15 hover:text-white"
            aria-label="Close movie details"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="relative min-h-[460px] overflow-hidden">
            {backdrop ? (
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${backdrop})` }}
              />
            ) : null}
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(2,6,23,0.98),rgba(2,6,23,0.78)_42%,rgba(2,6,23,0.32)_72%,rgba(2,6,23,0.92)),linear-gradient(180deg,rgba(2,6,23,0.25),rgba(2,6,23,0.98))]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_18%,rgba(56,189,248,0.24),transparent_28%),radial-gradient(circle_at_12%_20%,rgba(244,63,94,0.16),transparent_30%)]" />

            <div className="relative z-10 grid min-h-[460px] gap-8 p-6 pt-20 sm:p-10 sm:pt-24 lg:grid-cols-[1fr,240px] lg:items-end">
              <div className="max-w-3xl">
                <p className="text-xs font-bold uppercase tracking-[0.38em] text-sky-200">TasteFlix Spotlight</p>
                <h2 className="mt-4 text-4xl font-black tracking-tight text-white sm:text-6xl">{activeMovie.title}</h2>
                <div className="mt-5 flex flex-wrap items-center gap-3 text-sm font-semibold text-slate-200">
                  <span>{year}</span>
                  {runtime ? <span>{runtime}</span> : null}
                  <span className="max-w-full truncate">{genres}</span>
                  <span className="inline-flex items-center gap-1 rounded-full border border-amber-300/20 bg-amber-400/10 px-3 py-1 text-amber-100">
                    <Star className="h-4 w-4 fill-amber-300 text-amber-300" />
                    IMDb {formatRating(detail?.imdb_rating)}
                  </span>
                  <span className="rounded-full border border-sky-300/20 bg-sky-400/10 px-3 py-1 text-sky-100">
                    TMDB {formatRating(detail?.tmdb_rating)}
                  </span>
                </div>
                <p className="mt-6 max-w-2xl text-base leading-8 text-slate-300">
                  {activeMovie.overview || "A cinematic pick from the TasteFlix catalog."}
                </p>

                <div className="mt-8 flex flex-wrap gap-3">
                  <a
                    href={activeMovie.tmdb_id ? `https://www.themoviedb.org/movie/${activeMovie.tmdb_id}/watch` : "#"}
                    target="_blank"
                    rel="noreferrer"
                    className="premium-button gap-2 bg-[linear-gradient(135deg,rgba(244,63,94,0.96),rgba(168,85,247,0.86),rgba(56,189,248,0.9))] px-5 py-3 text-sm font-bold"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Watch Now
                  </a>
                  <button
                    type="button"
                    onClick={handleWantToWatch}
                    className="premium-button gap-2 border border-emerald-300/20 bg-emerald-500/12 px-5 py-3 text-sm font-bold text-emerald-100 hover:bg-emerald-500/20"
                  >
                    {saved ? <CheckCircle2 className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                    {saved ? "Saved" : "Want to Watch"}
                  </button>
                  <button
                    type="button"
                    disabled={feedbackLoading !== null}
                    onClick={() => handleFeedback("like")}
                    className="premium-button gap-2 border border-white/10 bg-white/[0.07] px-5 py-3 text-sm font-bold text-white hover:border-sky-300/30 hover:bg-white/[0.12] disabled:opacity-60"
                  >
                    {feedbackLoading === "like" ? <Loader2 className="h-4 w-4 animate-spin" /> : <ThumbsUp className="h-4 w-4" />}
                    Like
                  </button>
                  <button
                    type="button"
                    disabled={feedbackLoading !== null}
                    onClick={() => handleFeedback("dislike")}
                    className="premium-button gap-2 border border-rose-300/20 bg-rose-500/10 px-5 py-3 text-sm font-bold text-rose-100 hover:bg-rose-500/20 disabled:opacity-60"
                  >
                    {feedbackLoading === "dislike" ? <Loader2 className="h-4 w-4 animate-spin" /> : <ThumbsDown className="h-4 w-4" />}
                    Not Interested
                  </button>
                </div>
              </div>

              <div className="flex justify-start lg:justify-center">
                <div className="flex flex-col items-center gap-3">
                  <button
                    type="button"
                    disabled={!playableTrailer}
                    onClick={() => setTrailerOpen(true)}
                    className="group inline-flex h-24 w-24 items-center justify-center rounded-full border border-white/20 bg-white/15 text-white shadow-[0_0_70px_rgba(56,189,248,0.28)] backdrop-blur-xl transition hover:scale-105 hover:bg-white/22 disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label={playableTrailer ? "Play trailer" : "Trailer unavailable"}
                    title={playableTrailer ? playableTrailer.name : "Official trailer unavailable"}
                  >
                    <Play className="ml-1 h-10 w-10 fill-white transition group-hover:scale-110" />
                  </button>
                  {playableTrailer ? (
                    <span className="rounded-full border border-white/10 bg-black/35 px-4 py-2 text-xs font-bold uppercase tracking-[0.24em] text-slate-100 backdrop-blur-xl">
                      Play Trailer
                    </span>
                  ) : null}
                  {trailerLoading ? (
                    <div className="skeleton-shimmer h-8 w-28 rounded-full" />
                  ) : null}
                </div>
              </div>
            </div>
          </div>

          <div className="relative z-10 space-y-8 p-6 sm:p-8">
            {loading ? (
              <div className="skeleton-shimmer rounded-3xl border border-white/10 p-8 text-center text-slate-300">
                Loading cinematic details...
              </div>
            ) : error ? (
              <div className="rounded-3xl border border-rose-300/15 bg-rose-500/10 p-6 text-rose-100">{error}</div>
            ) : null}

            <div className="grid gap-5 lg:grid-cols-[1.1fr,0.9fr]">
              <div className="rounded-[28px] border border-white/10 bg-white/[0.045] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
                <h3 className="text-xl font-black text-white">Movie Details</h3>
                <p className="mt-4 leading-8 text-slate-300">{activeMovie.overview || "Overview unavailable."}</p>
                <p className="mt-5 text-sm leading-7 text-slate-400">
                  <span className="font-semibold text-slate-200">Director:</span> {directorText}
                </p>
              </div>

              <div className="rounded-[28px] border border-white/10 bg-white/[0.045] p-5">
                <h3 className="text-xl font-black text-white">Where to Watch</h3>
                {detail?.providers.length ? (
                  <div className="mt-4 flex flex-wrap gap-3">
                    {detail.providers.map((provider) => (
                      <span
                        key={provider.provider_id}
                        className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/24 px-3 py-2 text-sm font-semibold text-slate-100"
                      >
                        {provider.logo_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={provider.logo_url} alt="" className="h-5 w-5 rounded-md object-cover" />
                        ) : null}
                        {provider.provider_name}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="mt-4 text-sm leading-7 text-slate-400">Streaming providers are not available for this title yet.</p>
                )}
              </div>
            </div>

            {detail?.cast.length ? (
              <section>
                <h3 className="text-xl font-black text-white">Top Cast</h3>
                <div className="mt-4 flex gap-4 overflow-x-auto pb-3">
                  {detail.cast.map((person) => (
                    <article key={person.id} className="w-32 shrink-0 rounded-3xl border border-white/10 bg-white/[0.045] p-3">
                      <div className="overflow-hidden rounded-2xl bg-black/35">
                        {person.profile_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={person.profile_url} alt={person.name} className="aspect-[2/3] w-full object-cover" />
                        ) : (
                          <div className="aspect-[2/3] w-full bg-slate-800" />
                        )}
                      </div>
                      <h4 className="mt-3 line-clamp-2 text-sm font-bold text-white">{person.name}</h4>
                      <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-400">{person.character}</p>
                    </article>
                  ))}
                </div>
              </section>
            ) : null}

            {detail?.similar.length ? (
              <section>
                <h3 className="text-xl font-black text-white">Similar Movies</h3>
                <div className="mt-4 flex gap-4 overflow-x-auto pb-3">
                  {detail.similar.map((similar) => (
                    <article key={similar.tmdb_id} className="w-40 shrink-0 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.045] transition hover:-translate-y-1 hover:border-sky-300/25">
                      <div className="aspect-[2/3] bg-black/35">
                        <SafePoster
                          src={similar.poster_url}
                          title={similar.title}
                          year={similar.year}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="p-3">
                        <h4 className="line-clamp-2 text-sm font-bold text-white">{similar.title}</h4>
                        <p className="mt-1 text-xs text-slate-400">{similar.year || "Pick"} • TMDB {formatRating(similar.vote_average)}</p>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            ) : null}
          </div>
        </motion.section>

        {toast ? (
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed bottom-5 right-5 z-[90] inline-flex items-center gap-3 rounded-full border border-emerald-300/20 bg-slate-950/90 px-5 py-3 text-sm font-medium text-white shadow-[0_18px_50px_rgba(2,6,23,0.52)] backdrop-blur-xl"
          >
            <CheckCircle2 className="h-4 w-4 text-emerald-300" />
            {toast}
          </motion.div>
        ) : null}

        <AnimatePresence>
          {trailerOpen && playableTrailer ? (
            <motion.div
              className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-4 backdrop-blur-xl"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <button type="button" className="absolute inset-0 cursor-default" onClick={() => setTrailerOpen(false)} aria-label="Close trailer" />
              <motion.div
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.94 }}
                className="relative aspect-video w-full max-w-5xl overflow-hidden rounded-[28px] border border-white/15 bg-black shadow-[0_30px_100px_rgba(0,0,0,0.78)]"
              >
                <button
                  type="button"
                  onClick={() => setTrailerOpen(false)}
                  className="absolute right-4 top-4 z-10 rounded-full border border-white/15 bg-black/70 p-2 text-white backdrop-blur-xl transition hover:bg-white/15"
                  aria-label="Close trailer"
                >
                  <X className="h-5 w-5" />
                </button>
                <iframe
                  loading="lazy"
                  title={playableTrailer.name}
                  src={`https://www.youtube.com/embed/${playableTrailer.videoKey}?autoplay=1&rel=0`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="h-full w-full"
                />
              </motion.div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
}
