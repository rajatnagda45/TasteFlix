"use client";

import { AuthResponse, Movie, Recommendation, RecommendationRequest, RecommendationResponse } from "@/types";

const TOKEN_KEY = "tasteflix_token";
const USER_KEY = "tasteflix_user";
const RESULTS_KEY = "tasteflix_results";
const REQUEST_KEY = "tasteflix_last_request";
const WATCHLIST_KEY_PREFIX = "tasteflix_watchlist";
const RECENT_SEARCHES_KEY = "tasteflix_recent_searches";
const RESULTS_VERSION = 2;
const MAX_RECENT_SEARCHES = 6;

export function saveSession(session: AuthResponse) {
  localStorage.setItem(TOKEN_KEY, session.access_token);
  localStorage.setItem(USER_KEY, JSON.stringify(session.user));
}

export function getToken() {
  return typeof window === "undefined" ? null : localStorage.getItem(TOKEN_KEY);
}

export function getUser() {
  if (typeof window === "undefined") {
    return null;
  }
  const value = localStorage.getItem(USER_KEY);
  return value ? JSON.parse(value) : null;
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function saveResults(results: Recommendation[] | RecommendationResponse) {
  if (Array.isArray(results)) {
    localStorage.setItem(
      RESULTS_KEY,
      JSON.stringify({
        version: RESULTS_VERSION,
        data: { recommendations: results, taste_profile: [], generated_at: new Date().toISOString() },
      }),
    );
    return;
  }
  localStorage.setItem(RESULTS_KEY, JSON.stringify({ version: RESULTS_VERSION, data: results }));
}

export function getResults(): RecommendationResponse {
  if (typeof window === "undefined") {
    return { recommendations: [], taste_profile: [], generated_at: new Date().toISOString() };
  }
  const value = localStorage.getItem(RESULTS_KEY);
  if (!value) {
    return { recommendations: [], taste_profile: [], generated_at: new Date().toISOString() };
  }
  const parsed = JSON.parse(value);
  if (parsed?.version === RESULTS_VERSION && parsed?.data) {
    return parsed.data;
  }
  if (Array.isArray(parsed)) {
    localStorage.removeItem(RESULTS_KEY);
    return { recommendations: [], taste_profile: [], generated_at: new Date().toISOString() };
  }
  if (parsed?.recommendations) {
    localStorage.removeItem(RESULTS_KEY);
    return { recommendations: [], taste_profile: [], generated_at: new Date().toISOString() };
  }
  return { recommendations: [], taste_profile: [], generated_at: new Date().toISOString() };
}

export function saveRecommendationRequest(request: RecommendationRequest) {
  localStorage.setItem(REQUEST_KEY, JSON.stringify(request));
}

export function getRecommendationRequest(): RecommendationRequest | null {
  if (typeof window === "undefined") {
    return null;
  }
  const value = localStorage.getItem(REQUEST_KEY);
  return value ? JSON.parse(value) : null;
}

function getWatchlistKey() {
  const user = getUser();
  return `${WATCHLIST_KEY_PREFIX}_${user?.id ?? "guest"}`;
}

export function getWatchlist(): Movie[] {
  if (typeof window === "undefined") {
    return [];
  }
  const value = localStorage.getItem(getWatchlistKey());
  if (!value) {
    return [];
  }
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveToWatchlist(movie: Movie) {
  const existing = getWatchlist();
  const next = [movie, ...existing.filter((item) => item.id !== movie.id)];
  localStorage.setItem(getWatchlistKey(), JSON.stringify(next));
}

export function removeFromWatchlist(movieId: number) {
  const next = getWatchlist().filter((movie) => movie.id !== movieId);
  localStorage.setItem(getWatchlistKey(), JSON.stringify(next));
}

export function getRecentSearches(): string[] {
  if (typeof window === "undefined") {
    return [];
  }
  const value = localStorage.getItem(RECENT_SEARCHES_KEY);
  if (!value) {
    return [];
  }
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

export function saveRecentSearch(query: string) {
  if (typeof window === "undefined") {
    return;
  }
  const normalized = query.trim();
  if (!normalized) {
    return;
  }
  const next = [
    normalized,
    ...getRecentSearches().filter((item) => item.toLowerCase() !== normalized.toLowerCase()),
  ].slice(0, MAX_RECENT_SEARCHES);
  localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next));
}
