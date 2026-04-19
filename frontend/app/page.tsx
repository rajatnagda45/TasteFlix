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
  const [heroLight, setHeroLight] = useState({ x: 50, y: 42 });

  useEffect(() => {
    setIsLoggedIn(Boolean(getUser()));
  }, []);

  return (
    <main className="min-h-screen">
      <section
        className="group/hero relative -mt-24 min-h-screen overflow-hidden pt-24 [font-family:Poppins,Inter,ui-sans-serif,system-ui,sans-serif]"
        onMouseMove={(event) => {
          const bounds = event.currentTarget.getBoundingClientRect();
          setHeroLight({
            x: ((event.clientX - bounds.left) / bounds.width) * 100,
            y: ((event.clientY - bounds.top) / bounds.height) * 100,
          });
        }}
        style={{
          "--hero-light-x": `${heroLight.x}%`,
          "--hero-light-y": `${heroLight.y}%`,
        } as React.CSSProperties}
      >
        <div className="hero-bg-float absolute -inset-6 bg-[url('/hero.png')] bg-cover bg-center bg-no-repeat" />
        <div className="hero-aurora absolute inset-0 opacity-70" />
        <div className="hero-particles absolute inset-0 opacity-35" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_var(--hero-light-x)_var(--hero-light-y),rgba(125,211,252,0.18),transparent_24rem)] opacity-0 transition-opacity duration-500 group-hover/hero:opacity-100" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/20 to-black/60" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-transparent to-black/45" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_38%,rgba(0,0,0,0.38)_78%,rgba(0,0,0,0.78)_100%)]" />

        <div className="page-shell relative pb-20 pt-20 sm:pt-24 lg:pb-24 lg:pt-24">
          <div className="grid min-h-[700px] gap-14 lg:grid-cols-[1.08fr,0.92fr] lg:items-center">
            <motion.div
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.75, ease: "easeOut" }}
              className="max-w-[720px]"
            >
              <h1 className="max-w-[720px] text-[3.35rem] font-black leading-[0.96] tracking-[-0.045em] text-white drop-shadow-[0_14px_42px_rgba(0,0,0,0.55)] sm:text-[4.55rem] lg:text-[4.9rem] xl:text-[5.2rem]">
                <motion.span
                  className="block"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.65, ease: "easeOut" }}
                >
                  Your next favorite
                </motion.span>
                <motion.span
                  className="block"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.65, delay: 0.12, ease: "easeOut" }}
                >
                  movie,{" "}
                  <span className="font-semibold tracking-[-0.02em] text-white/90">predicted</span>
                </motion.span>
                <motion.span
                  className="block"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.65, delay: 0.24, ease: "easeOut" }}
                >
                  from{" "}
                  <span className="premium-gradient-text bg-gradient-to-r from-fuchsia-300 via-violet-300 to-cyan-300 bg-[length:180%_180%] bg-clip-text text-transparent">
                    your taste.
                  </span>
                </motion.span>
              </h1>
              <motion.p
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.38, ease: "easeOut" }}
                className="mt-9 max-w-[620px] text-lg leading-9 text-white/70 drop-shadow-[0_8px_24px_rgba(0,0,0,0.45)] sm:text-xl"
              >
                TasteFlix learns your preferences and delivers cinematic recommendations with
                AI-powered insights.
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5, ease: "easeOut" }}
                className="mt-10 flex flex-wrap gap-5"
              >
                <motion.div whileTap={{ scale: 0.97 }}>
                  <Link
                    href={isLoggedIn ? "/taste" : "/signup"}
                    className="premium-button premium-gradient-button gap-3 border border-cyan-200/30 px-8 py-4 text-lg font-bold text-white shadow-[0_0_30px_rgba(236,72,153,0.42),0_0_44px_rgba(34,211,238,0.28)] transition-all duration-300 ease-out hover:scale-105 hover:shadow-[0_0_48px_rgba(236,72,153,0.62),0_0_78px_rgba(34,211,238,0.46)]"
                  >
                    Get Recommendations
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                </motion.div>
                <motion.div whileTap={{ scale: 0.97 }}>
                  <Link
                    href="/dashboard"
                    className="premium-button gap-3 border border-white/25 bg-white/[0.06] px-8 py-4 text-lg font-semibold text-white shadow-[0_0_28px_rgba(255,255,255,0.08),inset_0_1px_0_rgba(255,255,255,0.12)] backdrop-blur-xl transition-all duration-300 ease-out hover:scale-[1.03] hover:border-cyan-200/45 hover:bg-white/12 hover:shadow-[0_0_34px_rgba(125,211,252,0.22)]"
                  >
                    <Play className="h-4 w-4" />
                    Explore Dashboard
                  </Link>
                </motion.div>
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.75, delay: 0.62, ease: "easeOut" }}
              className="relative mx-auto w-full max-w-[520px] lg:ml-auto lg:mr-0 xl:max-w-[565px]"
            >
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
                className="premium-glass-panel relative rounded-2xl border border-white/10 bg-white/10 p-7 shadow-[0_0_60px_rgba(139,92,246,0.3)] backdrop-blur-xl sm:p-8"
              >
                <div className="absolute inset-0 rounded-2xl bg-[radial-gradient(circle_at_80%_8%,rgba(34,211,238,0.18),transparent_36%),radial-gradient(circle_at_12%_14%,rgba(236,72,153,0.12),transparent_34%)]" />
                <div className="relative space-y-7">
                  {heroSignals.map((signal, index) => (
                    <div key={signal.label}>
                      <p className="px-1 text-sm font-semibold uppercase tracking-[0.44em] text-white/80">{signal.label}</p>
                      <motion.div
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.98 }}
                        transition={{ duration: 0.25 }}
                        className="mt-4 rounded-full border border-white/15 bg-black/25 px-6 py-4 shadow-[0_0_22px_rgba(15,23,42,0.2),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl transition-all duration-300 ease-out hover:-translate-y-1 hover:border-cyan-200/35 hover:bg-white/10 hover:shadow-[0_0_42px_rgba(139,92,246,0.34)] sm:px-7 sm:py-5"
                      >
                        <div className="flex items-center justify-between gap-4">
                          <p className="text-xl font-semibold leading-8 tracking-[0.01em] text-white sm:text-[1.35rem]">
                            {signal.title}
                          </p>
                        </div>
                      </motion.div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      <div className="front-page-continuation relative overflow-hidden">
        <div className="hero-particles pointer-events-none absolute inset-0 opacity-20" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-black/10 via-[#070b18]/80 to-transparent" />

        <section className="page-shell pb-24 pt-10">
          <div className="grid gap-6 md:grid-cols-3">
            {features.map((feature) => (
              <motion.article
                key={feature.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.25 }}
                whileHover={{ y: -8, scale: 1.02 }}
                transition={{ duration: 0.4 }}
                className="glow-card premium-section-card p-6"
              >
                <feature.icon className="h-8 w-8 text-rose-300 drop-shadow-[0_0_16px_rgba(251,113,133,0.35)]" />
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
              className="cinema-panel premium-section-panel p-8 sm:p-10"
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
                    <div key={item.title} className="rounded-[24px] border border-white/10 bg-black/20 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-md transition duration-300 hover:border-cyan-200/25 hover:bg-white/[0.06]">
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
              className="cinema-panel premium-section-panel p-8 sm:p-10"
            >
              <p className="text-sm uppercase tracking-[0.35em] text-rose-200">FAQ</p>
              <h2 className="mt-4 text-4xl font-black tracking-tight text-white">Common questions, answered clearly.</h2>
              <div className="mt-8 space-y-4">
                {faqs.map((item) => (
                  <details
                    key={item.question}
                    className="group rounded-[24px] border border-white/10 bg-black/20 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-md transition hover:border-cyan-200/25 hover:bg-white/[0.06]"
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
      </div>
    </main>
  );
}
