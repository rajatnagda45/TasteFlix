"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { SectionRow } from "@/components/section-row";
import { api } from "@/services/api";
import { Movie } from "@/types";


export default function DashboardPage() {
  const [hollywood, setHollywood] = useState<Movie[]>([]);
  const [bollywood, setBollywood] = useState<Movie[]>([]);
  const [catalog, setCatalog] = useState<Movie[]>([]);

  useEffect(() => {
    async function load() {
      const [hollywoodItems, bollywoodItems, catalogItems] = await Promise.all([
        api.trending(),
        api.bollywood(),
        api.movies(),
      ]);
      setHollywood(hollywoodItems);
      setBollywood(bollywoodItems);
      setCatalog(catalogItems);
    }
    load();
  }, []);

  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      <section className="rounded-[36px] border border-white/10 bg-white/5 p-8 shadow-card">
        <p className="text-sm uppercase tracking-[0.35em] text-rose-200">Your AI cinema companion</p>
        <div className="mt-4 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-4xl font-black text-white">Find a movie that actually fits tonight.</h1>
            <p className="mt-4 max-w-2xl text-slate-300">
              Start with a few movies you love, then let TasteFlix generate recommendations with
              confidence scores and explainable reasoning.
            </p>
          </div>
          <Link
            href="/taste"
            className="rounded-full bg-glow px-6 py-4 text-sm font-bold uppercase tracking-[0.25em] text-white"
          >
            Build My Taste Profile
          </Link>
        </div>
      </section>

      <div className="mt-10 space-y-12">
        <SectionRow
          title="Hollywood Hits"
          caption="Popular English-language favorites from the MovieLens-powered catalog."
          movies={hollywood}
        />
        <SectionRow
          title="Bollywood Picks"
          caption="Indian and Hindi-language standouts surfaced directly from TMDB."
          movies={bollywood}
        />
        <SectionRow
          title="Browse the Catalog"
          caption="A broader mix from the recommendation catalog."
          movies={catalog}
        />
      </div>
    </main>
  );
}
