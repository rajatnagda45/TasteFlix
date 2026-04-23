"use client";

import { useEffect, useState } from "react";

import { cacheTrailer, getMovieTrailer, normalizeTrailer, readCachedTrailer, MovieTrailerResult } from "@/lib/trailers";
import { Movie, TmdbVideo } from "@/types";

export function useMovieTrailer(movie: Movie | null, initialTrailer?: TmdbVideo | null) {
  const [trailer, setTrailer] = useState<MovieTrailerResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!movie) {
      setTrailer(null);
      setLoading(false);
      setError(null);
      return;
    }

    const normalizedInitialTrailer = normalizeTrailer(initialTrailer ?? null);
    if (normalizedInitialTrailer) {
      setTrailer(normalizedInitialTrailer);
      cacheTrailer(movie.id, normalizedInitialTrailer);
      setLoading(false);
      setError(null);
      return;
    }

    const cachedTrailer = readCachedTrailer(movie.id);
    if (cachedTrailer) {
      setTrailer(cachedTrailer);
      setLoading(false);
      setError(null);
      return;
    }

    let active = true;
    setLoading(true);
    setError(null);

    getMovieTrailer(movie)
      .then((result) => {
        if (active) {
          setTrailer(result);
        }
      })
      .catch((err) => {
        if (active) {
          setError(err instanceof Error ? err.message : "Could not load trailer");
          setTrailer(null);
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
  }, [initialTrailer, movie?.id]);

  return { trailer, loading, error };
}
