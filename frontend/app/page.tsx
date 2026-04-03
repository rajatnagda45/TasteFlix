"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Sparkles, WandSparkles, Waypoints } from "lucide-react";

import { getUser } from "@/lib/storage";


const features = [
  {
    title: "Hybrid intelligence",
    description: "Combines metadata similarity, live ratings, and SVD-based collaborative signals.",
    icon: Sparkles,
  },
  {
    title: "Transparent explanations",
    description: "Every recommendation tells users why it matches their taste profile.",
    icon: WandSparkles,
  },
  {
    title: "Built for growth",
    description: "Modular FastAPI + Next.js architecture ready for PostgreSQL and deployment.",
    icon: Waypoints,
  },
];


export default function HomePage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    setIsLoggedIn(Boolean(getUser()));
  }, []);

  return (
    <main className="min-h-screen">
      <section className="mx-auto max-w-7xl px-6 pb-20 pt-20">
        <div className="grid gap-12 lg:grid-cols-[1.15fr,0.85fr] lg:items-center">
          <div>
            <p className="inline-flex rounded-full border border-rose-400/20 bg-rose-500/10 px-4 py-2 text-sm uppercase tracking-[0.35em] text-rose-200">
              AI Movie Discovery
            </p>
            <h1 className="mt-8 max-w-4xl text-5xl font-black leading-tight text-white md:text-7xl">
              Your next favorite movie, predicted from your taste.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
              TasteFlix learns from the movies you already love, mixes collaborative filtering with
              content intelligence, and returns recommendations with human-readable reasoning.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                href={isLoggedIn ? "/taste" : "/signup"}
                className="rounded-full bg-glow px-6 py-4 text-sm font-bold uppercase tracking-[0.25em] text-white"
              >
                Get Recommendations
              </Link>
              <Link
                href="/dashboard"
                className="rounded-full border border-white/15 px-6 py-4 text-sm font-bold uppercase tracking-[0.25em] text-white"
              >
                Explore Dashboard
              </Link>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-[36px] border border-white/10 bg-white/5 p-6 shadow-card">
            <div className="absolute inset-0 bg-hero-grid" />
            <div className="relative grid gap-4">
              {["Based on your love for Toy Story", "Users like you also enjoyed Heat", "High confidence sci-fi pick"].map(
                (copy, index) => (
                  <div
                    key={copy}
                    className={`rounded-[28px] border border-white/10 bg-black/30 p-5 ${
                      index === 1 ? "translate-x-8" : ""
                    }`}
                  >
                    <p className="text-xs uppercase tracking-[0.3em] text-sky-200">Signal {index + 1}</p>
                    <p className="mt-3 text-xl font-semibold text-white">{copy}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-400">
                      Explanations make the model feel trustworthy, not mysterious.
                    </p>
                  </div>
                ),
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-24">
        <div className="grid gap-6 md:grid-cols-3">
          {features.map((feature) => (
            <article key={feature.title} className="rounded-[30px] border border-white/10 bg-white/5 p-6 shadow-card">
              <feature.icon className="h-8 w-8 text-rose-300" />
              <h2 className="mt-5 text-2xl font-semibold text-white">{feature.title}</h2>
              <p className="mt-3 leading-7 text-slate-400">{feature.description}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
