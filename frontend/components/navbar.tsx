"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Clapperboard, Sparkles } from "lucide-react";

import { clearSession, getUser } from "@/lib/storage";
import { Logo } from "@/components/logo";

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<ReturnType<typeof getUser>>(null);
  const navItems = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/taste", label: "Taste" },
    { href: "/watchlist", label: "Want to Watch" },
    { href: "/history", label: "History" },
  ];

  useEffect(() => {
    setUser(getUser());
  }, [pathname]);

  return (
    <header className="sticky top-0 z-50 px-4 pb-2 pt-4 sm:px-6">
      <motion.div
        initial={false}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeInOut" }}
        className="cinema-panel mx-auto max-w-7xl border-white/10 bg-[#08101f]/70"
      >
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Logo />
          <nav className="flex items-center gap-2 overflow-x-auto whitespace-nowrap text-sm text-slate-300">
            {navItems.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="relative rounded-full px-4 py-2.5 transition"
              >
                {pathname === href ? (
                  <motion.span
                    layoutId="active-nav-pill"
                    className="absolute inset-0 rounded-full border border-white/15 bg-white/[0.12] shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_10px_30px_rgba(56,189,248,0.12)]"
                    transition={{ type: "spring", stiffness: 280, damping: 28 }}
                  />
                ) : null}
                <span className={`relative z-10 ${pathname === href ? "text-white" : "text-slate-300 hover:text-white"}`}>
                  {label}
                </span>
              </Link>
            ))}
            {user ? (
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => {
                  clearSession();
                  setUser(null);
                  router.push("/login");
                }}
                className="premium-button border border-white/15 bg-white/[0.06] px-5 py-2.5 text-white hover:border-white/30 hover:bg-white/[0.11]"
              >
                Logout
              </motion.button>
            ) : (
              <motion.div whileTap={{ scale: 0.97 }}>
                <Link
                  href="/login"
                  className="premium-button bg-[linear-gradient(135deg,rgba(244,63,94,0.95),rgba(168,85,247,0.85),rgba(56,189,248,0.88))] px-5 py-2.5"
                >
                  Login
                </Link>
              </motion.div>
            )}
          </nav>
        </div>
        <div className="flex items-center justify-between border-t border-white/5 px-4 py-2 text-[0.68rem] uppercase tracking-[0.36em] text-slate-500 sm:px-6">
          <span className="inline-flex items-center gap-2">
            <Clapperboard className="h-3.5 w-3.5" />
            Premium Discovery Feed
          </span>
          <span className="inline-flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-sky-300/80" />
            AI-Powered Taste Engine
          </span>
        </div>
      </motion.div>
    </header>
  );
}
