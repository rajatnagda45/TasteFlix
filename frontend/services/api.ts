import { AuthResponse, FeedbackResponse, HistoryItem, Movie, MovieDetail, RecommendationRequest, RecommendationResponse, TmdbVideo } from "@/types";
import { clearSession, getUser } from "@/lib/storage";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("tasteflix_token") : null;
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options?.headers || {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Something went wrong" }));
    if (response.status === 401) {
      clearSession();
    }
    throw new Error(error.detail || "Request failed");
  }

  return response.json();
}

export const api = {
  signup: (payload: { full_name: string; email: string; password: string }) =>
    request<AuthResponse>("/auth/signup", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  login: (payload: { email: string; password: string }) =>
    request<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  socialAuth: (payload: { email: string; full_name: string; provider: "google" | "github" }) =>
    request<AuthResponse>("/auth/social", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  movies: (search?: string) =>
    request<Movie[]>(`/movies${search ? `?search=${encodeURIComponent(search)}&limit=40` : "?limit=24"}`),
  searchMovies: (query: string, limit = 8) =>
    request<Movie[]>(`/movies?search=${encodeURIComponent(query)}&limit=${limit}`),
  movieDetail: (movieId: number) => request<MovieDetail>(`/movies/${movieId}/detail`),
  movieTrailer: (movieId: number) => request<TmdbVideo | null>(`/movies/${movieId}/trailer`),
  trending: () => request<Movie[]>("/movies/trending?limit=12"),
  homeTrending: () => request<Movie[]>("/movies/home-trending?limit=12"),
  bollywood: () => request<Movie[]>("/movies/bollywood?limit=12"),
  async recommend(payload: RecommendationRequest) {
    try {
      return await request<RecommendationResponse>("/recommend", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Request failed";
      const hasSavedUser = Boolean(getUser());
      if (hasSavedUser && (message === "User not found" || message === "Invalid or expired token")) {
        clearSession();
        return request<RecommendationResponse>("/recommend", {
          method: "POST",
          body: JSON.stringify({
            selected_movies: payload.selected_movies,
            top_n: payload.top_n,
          }),
        });
      }
      throw error;
    }
  },
  feedback: (payload: { movie_id: number; sentiment: "like" | "dislike" }) =>
    request<FeedbackResponse>("/recommend/feedback", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  similarMovies: (movieId: number, limit = 6) =>
    request<Movie[]>(`/recommend/similar/${movieId}?limit=${limit}`),
  history: () => request<HistoryItem[]>("/history?limit=24"),
};
