"use client";

import { AuthResponse, Recommendation, RecommendationRequest, RecommendationResponse } from "@/types";

const TOKEN_KEY = "tasteflix_token";
const USER_KEY = "tasteflix_user";
const RESULTS_KEY = "tasteflix_results";
const REQUEST_KEY = "tasteflix_last_request";
const RESULTS_VERSION = 2;

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
