export interface Movie {
  id: number;
  source_movie_id: number;
  title: string;
  year: number | null;
  tmdb_id: number | null;
  directors: string | null;
  actors: string | null;
  genres: string | null;
  tags: string | null;
  avg_rating: number | null;
  rating_count: number | null;
  overview: string | null;
  poster_url: string | null;
  backdrop_url: string | null;
}

export interface User {
  id: number;
  full_name: string;
  email: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface Recommendation {
  movie: Movie;
  predicted_rating: number;
  explanation: string;
  confidence: number;
  because_you_liked: string[];
  why_recommended: string[];
  similarity_score: number;
  genre_match_percent: number;
  similar_users_rating: number | null;
}

export interface RecommendationResponse {
  recommendations: Recommendation[];
  taste_profile: { genre: string; percent: number }[];
  generated_at: string;
}

export interface RecommendationRequest {
  user_id?: number;
  selected_movies: { movie_id: number; rating: number }[];
  top_n?: number;
}

export interface HistoryItem {
  id: number;
  movie: Movie;
  score: number;
  explanation: string;
  created_at: string;
}

export interface FeedbackResponse {
  success: boolean;
  movie_id: number;
  sentiment: "like" | "dislike";
}
