import { api } from "@/services/api";
import { Movie, TmdbVideo } from "@/types";

export interface MovieTrailerResult {
  source: "tmdb" | "youtube";
  videoKey: string;
  name: string;
  site: string;
  type: string;
}

const TRAILER_CACHE_PREFIX = "tasteflix_trailer_";

export function normalizeTrailer(video: TmdbVideo | null): MovieTrailerResult | null {
  if (!video?.key) {
    return null;
  }

  return {
    source: video.source,
    videoKey: video.key,
    name: video.name,
    site: video.site,
    type: video.type,
  };
}

function getTrailerCacheKey(movieId: number) {
  return `${TRAILER_CACHE_PREFIX}${movieId}`;
}

export function readCachedTrailer(movieId: number): MovieTrailerResult | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = localStorage.getItem(getTrailerCacheKey(movieId));
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as MovieTrailerResult;
    return parsed?.videoKey ? parsed : null;
  } catch {
    return null;
  }
}

export function cacheTrailer(movieId: number, trailer: MovieTrailerResult | null) {
  if (typeof window === "undefined") {
    return;
  }

  if (!trailer) {
    localStorage.removeItem(getTrailerCacheKey(movieId));
    return;
  }

  localStorage.setItem(getTrailerCacheKey(movieId), JSON.stringify(trailer));
}

export async function getMovieTrailer(movie: Movie): Promise<MovieTrailerResult | null> {
  const cachedTrailer = readCachedTrailer(movie.id);
  if (cachedTrailer) {
    return cachedTrailer;
  }

  const trailer = await api.movieTrailer(movie.id);
  const normalizedTrailer = normalizeTrailer(trailer);
  cacheTrailer(movie.id, normalizedTrailer);
  return normalizedTrailer;
}
