"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Clock3, Loader2, Search, Sparkles, Star } from "lucide-react";
import { type KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";

import { MovieCard } from "@/components/movie-card";
import { SafePoster } from "@/components/safe-poster";
import { getRecentSearches, saveRecentSearch } from "@/lib/storage";
import { api } from "@/services/api";
import { Movie } from "@/types";

interface DashboardSearchProps {
  onMovieSelect: (movie: Movie) => void;
  suggestionSeeds?: string[];
}

interface SearchBarProps {
  query: string;
  onQueryChange: (value: string) => void;
  onSubmit: () => void;
  loading: boolean;
  onFocus: () => void;
  onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
}

interface SearchDropdownProps {
  open: boolean;
  results: Movie[];
  loading: boolean;
  activeIndex: number;
  recentSearches: string[];
  trendingSearches: string[];
  onMovieSelect: (movie: Movie) => void;
  onRecentSearchSelect: (query: string) => void;
}

interface SearchResultsGridProps {
  query: string;
  results: Movie[];
  loading: boolean;
  onMovieSelect: (movie: Movie) => void;
}

function formatRating(value: number | null | undefined) {
  return typeof value === "number" ? value.toFixed(1) : null;
}

export function SearchBar({ query, onQueryChange, onSubmit, loading, onFocus, onKeyDown }: SearchBarProps) {
  return (
    <div className="relative">
      <div className="relative overflow-hidden rounded-[28px] border border-white/12 bg-[linear-gradient(135deg,rgba(13,18,35,0.9),rgba(8,12,24,0.85))] shadow-[0_24px_70px_rgba(2,6,23,0.44)] backdrop-blur-2xl">
        <div className="pointer-events-none absolute inset-0 rounded-[28px] p-px [background:linear-gradient(135deg,rgba(244,114,182,0.34),rgba(168,85,247,0.22),rgba(56,189,248,0.28),rgba(255,255,255,0.08))] [mask:linear-gradient(#000_0_0)_content-box,linear-gradient(#000_0_0)] [mask-composite:xor]" />
        <div className="pointer-events-none absolute inset-y-0 left-0 w-28 bg-[radial-gradient(circle_at_left,rgba(244,63,94,0.18),transparent_70%)] blur-2xl" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-28 bg-[radial-gradient(circle_at_right,rgba(56,189,248,0.18),transparent_70%)] blur-2xl" />
        <div className="relative flex items-center gap-3 px-5 py-4">
          <Search className="h-5 w-5 shrink-0 text-slate-400" />
          <input
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            onFocus={onFocus}
            onKeyDown={onKeyDown}
            placeholder="Search movies, shows, actors..."
            className="w-full bg-transparent text-base text-white outline-none placeholder:text-slate-500"
          />
          {loading ? <Loader2 className="h-5 w-5 animate-spin text-sky-300" /> : null}
        </div>
      </div>
    </div>
  );
}

export function SearchDropdown({
  open,
  results,
  loading,
  activeIndex,
  recentSearches,
  trendingSearches,
  onMovieSelect,
  onRecentSearchSelect,
}: SearchDropdownProps) {
  const showSuggestions = !results.length && !loading;

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          className="absolute inset-x-0 top-[calc(100%+12px)] z-40 overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(10,14,27,0.96),rgba(5,8,18,0.98))] shadow-[0_28px_90px_rgba(2,6,23,0.58)] backdrop-blur-2xl"
        >
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/35 to-transparent" />
          <div className="max-h-[30rem] overflow-y-auto p-3">
            {loading ? (
              <div className="flex items-center gap-3 rounded-[22px] px-4 py-5 text-sm text-slate-300">
                <Loader2 className="h-4 w-4 animate-spin text-sky-300" />
                Searching the catalog...
              </div>
            ) : null}

            {!loading && results.length ? (
              <div className="space-y-2">
                {results.map((movie, index) => (
                  <button
                    key={movie.id}
                    type="button"
                    onClick={() => onMovieSelect(movie)}
                    className={`flex w-full items-center gap-4 rounded-[22px] border px-3 py-3 text-left transition ${
                      activeIndex === index
                        ? "border-sky-300/35 bg-white/[0.09] shadow-[0_0_0_1px_rgba(56,189,248,0.12)]"
                        : "border-transparent bg-white/[0.03] hover:border-white/10 hover:bg-white/[0.07]"
                    }`}
                  >
                    <div className="h-16 w-12 shrink-0 overflow-hidden rounded-2xl bg-black/35">
                      <SafePoster src={movie.poster_url} title={movie.title} year={movie.year} className="h-full w-full object-cover" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-white">{movie.title}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                        <span>{movie.year || "Unknown year"}</span>
                        {formatRating(movie.avg_rating) ? (
                          <span className="inline-flex items-center gap-1 text-amber-200">
                            <Star className="h-3 w-3 fill-amber-300 text-amber-300" />
                            {formatRating(movie.avg_rating)}
                          </span>
                        ) : null}
                        {movie.genres ? <span className="truncate">{movie.genres}</span> : null}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : null}

            {showSuggestions ? (
              <div className="space-y-4 p-2">
                {recentSearches.length ? (
                  <div>
                    <p className="mb-3 text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">Recent Searches</p>
                    <div className="flex flex-wrap gap-2">
                      {recentSearches.map((item) => (
                        <button
                          key={item}
                          type="button"
                          onClick={() => onRecentSearchSelect(item)}
                          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-sm text-slate-200 transition hover:border-sky-300/25 hover:bg-white/[0.09]"
                        >
                          <Clock3 className="h-3.5 w-3.5 text-slate-400" />
                          {item}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}

                {trendingSearches.length ? (
                  <div>
                    <p className="mb-3 text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">Trending In TasteFlix</p>
                    <div className="flex flex-wrap gap-2">
                      {trendingSearches.map((item) => (
                        <button
                          key={item}
                          type="button"
                          onClick={() => onRecentSearchSelect(item)}
                          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-[linear-gradient(135deg,rgba(244,63,94,0.1),rgba(56,189,248,0.08))] px-4 py-2 text-sm text-white transition hover:border-white/20 hover:bg-white/[0.08]"
                        >
                          <Sparkles className="h-3.5 w-3.5 text-rose-300" />
                          {item}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

export function SearchResultsGrid({ query, results, loading, onMovieSelect }: SearchResultsGridProps) {
  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-white">Search Results</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
            {query ? `Showing matches for "${query}" across the TasteFlix catalog and TMDB-enriched titles.` : "Search for any movie to explore the catalog."}
          </p>
        </div>
        <span className="glass-chip w-fit px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-slate-300">
          {loading ? "Searching" : `${results.length} Matches`}
        </span>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
        {loading
          ? Array.from({ length: 6 }).map((_, index) => <div key={index} className="skeleton-shimmer aspect-[2/3] rounded-[28px]" />)
          : results.map((movie) => (
              <MovieCard key={movie.id} movie={movie} onSelect={() => onMovieSelect(movie)} posterOnly />
            ))}
      </div>

      {!loading && query && results.length === 0 ? (
        <div className="cinema-panel p-6 text-sm leading-7 text-slate-400">
          No matches for "{query}" yet. Try a different title, actor, or a shorter search phrase.
        </div>
      ) : null}
    </section>
  );
}

export function DashboardSearch({ onMovieSelect, suggestionSeeds = [] }: DashboardSearchProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [liveResults, setLiveResults] = useState<Movie[]>([]);
  const [submittedResults, setSubmittedResults] = useState<Movie[]>([]);
  const [loadingLive, setLoadingLive] = useState(false);
  const [loadingSubmitted, setLoadingSubmitted] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  const trendingSearches = useMemo(
    () => Array.from(new Set(suggestionSeeds.filter(Boolean))).slice(0, 5),
    [suggestionSeeds],
  );

  useEffect(() => {
    setRecentSearches(getRecentSearches());
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 300);
    return () => window.clearTimeout(timeout);
  }, [query]);

  useEffect(() => {
    if (debouncedQuery.length < 2) {
      setLiveResults([]);
      setLoadingLive(false);
      setActiveIndex(-1);
      return;
    }

    let active = true;
    setLoadingLive(true);

    api.searchMovies(debouncedQuery, 8)
      .then((movies) => {
        if (!active) {
          return;
        }
        setLiveResults(movies);
        setActiveIndex(movies.length ? 0 : -1);
      })
      .catch(() => {
        if (active) {
          setLiveResults([]);
          setActiveIndex(-1);
        }
      })
      .finally(() => {
        if (active) {
          setLoadingLive(false);
        }
      });

    return () => {
      active = false;
    };
  }, [debouncedQuery]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }

    window.addEventListener("mousedown", handleClickOutside);
    return () => window.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function runSearch(searchText: string) {
    const normalized = searchText.trim();
    setSubmittedQuery(normalized);

    if (!normalized) {
      setSubmittedResults([]);
      return;
    }

    setLoadingSubmitted(true);
    try {
      const movies = await api.searchMovies(normalized, 24);
      setSubmittedResults(movies);
      saveRecentSearch(normalized);
      setRecentSearches(getRecentSearches());
    } catch {
      setSubmittedResults([]);
    } finally {
      setLoadingSubmitted(false);
      setDropdownOpen(false);
    }
  }

  function handleMoviePick(movie: Movie) {
    saveRecentSearch(movie.title);
    setRecentSearches(getRecentSearches());
    setDropdownOpen(false);
    onMovieSelect(movie);
  }

  function handleQueryApply(value: string) {
    setQuery(value);
    setDropdownOpen(false);
    void runSearch(value);
  }

  return (
    <section className="space-y-6">
      <div ref={containerRef} className="relative">
        <SearchBar
          query={query}
          onQueryChange={(value) => {
            setQuery(value);
            setDropdownOpen(true);
          }}
          onSubmit={() => void runSearch(query)}
          loading={loadingLive}
          onFocus={() => setDropdownOpen(true)}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              setDropdownOpen(false);
              return;
            }

            if (event.key === "ArrowDown" && liveResults.length) {
              event.preventDefault();
              setDropdownOpen(true);
              setActiveIndex((current) => (current + 1) % liveResults.length);
              return;
            }

            if (event.key === "ArrowUp" && liveResults.length) {
              event.preventDefault();
              setDropdownOpen(true);
              setActiveIndex((current) => (current <= 0 ? liveResults.length - 1 : current - 1));
              return;
            }

            if (event.key === "Enter") {
              if (dropdownOpen && activeIndex >= 0 && activeIndex < liveResults.length) {
                event.preventDefault();
                handleMoviePick(liveResults[activeIndex]);
                return;
              }
              event.preventDefault();
              void runSearch(query);
            }
          }}
        />

        <SearchDropdown
          open={dropdownOpen && (query.trim().length > 0 || recentSearches.length > 0 || trendingSearches.length > 0)}
          results={liveResults}
          loading={loadingLive}
          activeIndex={activeIndex}
          recentSearches={recentSearches}
          trendingSearches={trendingSearches}
          onMovieSelect={handleMoviePick}
          onRecentSearchSelect={handleQueryApply}
        />
      </div>

      {(submittedQuery || loadingSubmitted) ? (
        <SearchResultsGrid query={submittedQuery} results={submittedResults} loading={loadingSubmitted} onMovieSelect={onMovieSelect} />
      ) : null}
    </section>
  );
}
