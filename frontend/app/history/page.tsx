"use client";

import { useEffect, useState } from "react";

import { getUser } from "@/lib/storage";
import { api } from "@/services/api";
import { HistoryItem } from "@/types";


export default function HistoryPage() {
  const [items, setItems] = useState<HistoryItem[]>([]);

  useEffect(() => {
    async function load() {
      const user = getUser();
      if (!user) {
        return;
      }
      const history = await api.history();
      setItems(history);
    }
    load();
  }, []);

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <section className="rounded-[36px] border border-white/10 bg-white/5 p-8 shadow-card">
        <p className="text-sm uppercase tracking-[0.35em] text-sky-200">Recommendation History</p>
        <h1 className="mt-4 text-4xl font-black text-white">Your previous AI-curated sessions</h1>
      </section>

      <div className="mt-10 space-y-4">
        {items.length ? (
          items.map((item) => (
            <article key={item.id} className="rounded-[28px] border border-white/10 bg-panel/80 p-5 shadow-card">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-2xl font-semibold text-white">{item.movie.title}</h2>
                  <p className="mt-2 text-sm text-slate-400">
                    {new Date(item.created_at).toLocaleString()} • Match score {item.score.toFixed(2)}
                  </p>
                </div>
                <p className="max-w-2xl text-sm leading-7 text-slate-300">{item.explanation}</p>
              </div>
            </article>
          ))
        ) : (
          <div className="rounded-[28px] border border-white/10 bg-white/5 p-8 text-center text-slate-400">
            Sign in and generate recommendations to see your history here.
          </div>
        )}
      </div>
    </main>
  );
}
