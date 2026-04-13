"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, ChevronDown, Play, Sparkles, WandSparkles, Waypoints } from "lucide-react";

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

const heroSignals = [
  {
    label: "Signal 1",
    title: "Based on your love for Fight Club",
  },
  {
    label: "Signal 2",
    title: "Users like you also enjoyed Shutter Island",
  },
  {
    label: "Signal 3",
    title: "High confidence thriller pick",
  },
];

const aboutHighlights = [
  {
    title: "Taste-first recommendations",
    description:
      "The experience starts from the movies you already love, then builds a recommendation feed around your actual taste profile instead of relying on generic popularity alone.",
  },
  {
    title: "Explainable AI results",
    description:
      "Each recommendation includes confidence, similarity, and reason tags so users understand why it appeared and feel more sure about every suggestion.",
  },
  {
    title: "Feedback that improves results",
    description:
      "Want to Watch and Not Interested actions feed the system so the next recommendation set feels more refined, more personal, and more aligned with your mood.",
  },
];

const faqs = [
  {
    question: "How does TasteFlix generate recommendations?",
    answer:
      "TasteFlix combines content similarity, collaborative filtering, and your selected favorite movies to build a personalized recommendation feed.",
  },
  {
    question: "Can I save movies for later?",
    answer:
      "Yes. Any movie you add to Want to Watch is saved into your dedicated watchlist so you can revisit it later.",
  },
  {
    question: "Why does each recommendation show an explanation?",
    answer:
      "The app is designed to be transparent. It shows similarity signals, genre match, and because-you-liked reasoning so the AI feels trustworthy.",
  },
  {
    question: "Do I need to rate every selected movie manually?",
    answer:
      "No. TasteFlix now pre-fills each selected movie with its real catalog rating, and you can fine-tune that slider only when you want sharper results.",
  },
  {
    question: "Is TasteFlix only useful for mainstream movies?",
    answer:
      "No. The system is built to surface both familiar favorites and less obvious picks, so your feed can include hidden gems alongside popular titles that match your taste.",
  },
  {
    question: "What happens when my taste changes over time?",
    answer:
      "TasteFlix adapts as you keep interacting with movies. New favorites, watchlist choices, and skips all help the recommendation flow shift with your current preferences.",
  },
];


export default function HomePage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    setIsLoggedIn(Boolean(getUser()));
  }, []);

  return (
    <main className="min-h-screen">
      <section className="page-shell pb-20 pt-6 sm:pt-8">
        <div className="glass-stage">
          <div
            className="absolute inset-0 bg-cover bg-center opacity-35"
            style={{ backgroundImage: "url('/hero-section.png')" }}
          />
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_16%,rgba(244,63,94,0.12),transparent_18%),radial-gradient(circle_at_82%_18%,rgba(56,189,248,0.12),transparent_18%),radial-gradient(circle_at_50%_76%,rgba(168,85,247,0.12),transparent_20%)]" />
          <div className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute left-[-100px] top-[-100px] h-[500px] w-[500px] bg-purple-600 opacity-30 blur-[150px]" />
            <div className="absolute bottom-[-100px] right-[-100px] h-[400px] w-[400px] bg-pink-500 opacity-30 blur-[150px]" />
            <div className="absolute left-[50%] top-[50%] h-[300px] w-[300px] bg-blue-500 opacity-20 blur-[120px]" />
          </div>

          <div className="relative grid min-h-[860px] gap-12 px-6 py-14 sm:px-10 sm:py-16 lg:grid-cols-[1.02fr,0.98fr] lg:items-center lg:px-20 lg:py-24">
            <motion.div
              initial={false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="max-w-[760px] pt-4"
            >
              <p className="glass-chip inline-flex px-5 py-2.5 text-sm uppercase tracking-[0.35em] text-slate-200">
                AI Movie Discovery
              </p>
              <h1 className="mt-12 max-w-4xl text-6xl font-bold leading-[0.95] tracking-[-0.05em] text-white sm:text-7xl lg:text-[7rem]">
                Your next favorite movie,
                <br />
                predicted from{" "}
                <span className="bg-gradient-to-r from-pink-500 via-purple-400 to-blue-400 bg-clip-text text-transparent">
                  your taste
                </span>
              </h1>
              <p className="mt-12 max-w-2xl text-[1.05rem] leading-10 text-slate-300 sm:text-[1.15rem]">
                TasteFlix learns your preferences and delivers cinematic recommendations with
                AI-powered insights.
              </p>
              <div className="mt-10 flex flex-wrap gap-4">
                <motion.div whileTap={{ scale: 0.97 }}>
                  <Link
                    href={isLoggedIn ? "/taste" : "/signup"}
                    className="premium-button gap-2 border border-cyan-300/30 bg-[linear-gradient(135deg,rgba(236,72,153,0.96),rgba(217,70,239,0.88),rgba(34,211,238,0.92))] px-7 py-4 text-base font-semibold text-white shadow-[0_14px_40px_rgba(34,211,238,0.22)]"
                  >
                    Get Recommendations
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                </motion.div>
                <motion.div whileTap={{ scale: 0.97 }}>
                  <Link
                    href="/dashboard"
                    className="premium-button gap-2 border border-white/15 bg-[#151827]/85 px-7 py-4 text-base font-semibold text-white hover:bg-[#1a2032]"
                  >
                    <Play className="h-4 w-4" />
                    Explore Dashboard
                  </Link>
                </motion.div>
              </div>
            </motion.div>

            <motion.div
              initial={false}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="relative mx-auto w-full max-w-[640px] lg:ml-auto lg:mr-0"
            >
              <div className="relative rounded-[32px] border border-white/10 bg-white/5 p-8 shadow-[0_0_40px_rgba(139,92,246,0.3)] backdrop-blur-xl sm:p-10">
                <div className="absolute inset-0 rounded-[42px] bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.06),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(56,189,248,0.12),transparent_26%),radial-gradient(circle_at_left,rgba(244,114,182,0.1),transparent_26%)]" />
                <div className="relative space-y-8">
                  {heroSignals.map((signal, index) => (
                    <div key={signal.label}>
                      <p className="text-sm uppercase tracking-[0.34em] text-slate-200/90">{signal.label}</p>
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        transition={{ duration: 0.3 }}
                        className={`mt-5 rounded-[30px] border p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] transition duration-300 hover:shadow-[0_0_40px_rgba(255,0,150,0.4)] ${
                          index === 0
                            ? "border-white/20 bg-[linear-gradient(135deg,rgba(27,29,48,0.82),rgba(20,26,47,0.74))]"
                            : "border-white/16 bg-[linear-gradient(180deg,rgba(23,25,43,0.8),rgba(22,25,41,0.7))]"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-4">
                          <p className="text-[2rem] font-semibold leading-[1.28] text-white sm:text-[2.15rem]">
                            {signal.title}
                          </p>
                          {index === 0 ? <ArrowRight className="h-7 w-7 shrink-0 text-slate-300" /> : null}
                        </div>
                      </motion.div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="page-shell pb-24">
        <div className="grid gap-6 md:grid-cols-3">
          {features.map((feature) => (
            <motion.article
              key={feature.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              whileHover={{ y: -8, scale: 1.02 }}
              transition={{ duration: 0.4 }}
              className="glow-card p-6"
            >
              <feature.icon className="h-8 w-8 text-rose-300" />
              <h2 className="mt-5 text-2xl font-semibold text-white">{feature.title}</h2>
              <p className="mt-3 leading-7 text-slate-400">{feature.description}</p>
            </motion.article>
          ))}
        </div>
      </section>

      <section className="page-shell pb-10">
        <div className="space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.45 }}
            className="cinema-panel p-8 sm:p-10"
          >
            <p className="text-sm uppercase tracking-[0.35em] text-sky-200">About TasteFlix</p>
            <div className="mt-4 grid gap-8 lg:grid-cols-[1.1fr,0.9fr] lg:items-start">
              <div>
                <h2 className="text-4xl font-black tracking-tight text-white sm:text-5xl">
                  A smarter movie app built for real taste.
                </h2>
                <div className="mt-5 space-y-5 max-w-3xl text-base leading-8 text-slate-300">
                  <p>
                    TasteFlix is designed as an AI-powered movie recommendation experience that feels cinematic,
                    personal, and easy to trust. Instead of showing a flat list of random titles, it creates a guided
                    discovery flow shaped by the movies you already connect with.
                  </p>
                  <p>
                    The platform blends modern frontend design with explainable recommendation logic, giving every user
                    a smoother way to discover what to watch next. That means the interface feels premium, but the
                    product logic also stays understandable, transparent, and useful.
                  </p>
                  <p>
                    From first-time onboarding to saving titles for later, TasteFlix is built to make movie discovery
                    feel less noisy and more intentional. The goal is simple: help people find better movies faster,
                    while making each recommendation feel earned instead of guessed.
                  </p>
                </div>
              </div>
              <div className="grid gap-4">
                {aboutHighlights.map((item) => (
                  <div key={item.title} className="rounded-[24px] border border-white/10 bg-black/20 p-5">
                    <h3 className="text-lg font-semibold text-white">{item.title}</h3>
                    <p className="mt-2 text-sm leading-7 text-slate-400">{item.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.45, delay: 0.08 }}
            className="cinema-panel p-8 sm:p-10"
          >
            <p className="text-sm uppercase tracking-[0.35em] text-rose-200">FAQ</p>
            <h2 className="mt-4 text-4xl font-black tracking-tight text-white">Common questions, answered clearly.</h2>
            <div className="mt-8 space-y-4">
              {faqs.map((item) => (
                <details
                  key={item.question}
                  className="group rounded-[24px] border border-white/10 bg-black/20 p-5 transition hover:border-white/20"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-semibold text-white">
                    <span>{item.question}</span>
                    <ChevronDown className="h-5 w-5 text-slate-400 transition group-open:rotate-180" />
                  </summary>
                  <p className="mt-4 text-sm leading-7 text-slate-400">{item.answer}</p>
                </details>
              ))}
            </div>
          </motion.div>
        </div>
      </section>
    </main>
  );
}
