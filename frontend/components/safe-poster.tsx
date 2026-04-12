"use client";

import { useEffect, useMemo, useState } from "react";

import { fallbackPoster } from "@/lib/poster";

interface SafePosterProps {
  src?: string | null;
  title: string;
  year?: number | null;
  className?: string;
}

export function SafePoster({ src, title, year, className }: SafePosterProps) {
  const fallbackSrc = useMemo(() => fallbackPoster(title, year), [title, year]);
  const initialSrc = src?.startsWith("data:image/svg+xml") ? fallbackSrc : src || fallbackSrc;
  const [currentSrc, setCurrentSrc] = useState(initialSrc);

  useEffect(() => {
    setCurrentSrc(initialSrc);
  }, [initialSrc]);

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={currentSrc || fallbackSrc}
      alt={title}
      className={className}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => setCurrentSrc(fallbackSrc)}
    />
  );
}
