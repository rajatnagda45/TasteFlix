"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { clearSession, getUser } from "@/lib/storage";
import { Logo } from "@/components/logo";

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<ReturnType<typeof getUser>>(null);

  useEffect(() => {
    setUser(getUser());
  }, [pathname]);

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-ink/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Logo />
        <nav className="flex items-center gap-5 text-sm text-slate-300">
          {["/dashboard", "/taste", "/history"].map((href) => (
            <Link
              key={href}
              href={href}
              className={pathname === href ? "text-white" : "transition hover:text-white"}
            >
              {href.replace("/", "").replace(/^./, (char) => char.toUpperCase()) || "Home"}
            </Link>
          ))}
          {user ? (
            <button
              onClick={() => {
                clearSession();
                setUser(null);
                router.push("/login");
              }}
              className="rounded-full border border-white/20 px-4 py-2 text-white transition hover:border-white/50"
            >
              Logout
            </button>
          ) : (
            <Link href="/login" className="rounded-full bg-glow px-4 py-2 font-semibold text-white">
              Login
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
