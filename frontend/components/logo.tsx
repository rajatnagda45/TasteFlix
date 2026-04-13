"use client";

import Link from "next/link";

interface LogoProps {
  compact?: boolean;
}

export function Logo({ compact = false }: LogoProps) {
  return (
    <Link href="/" className="group inline-flex items-center gap-3">
      <span className="relative inline-flex h-12 w-12 items-center justify-center overflow-hidden rounded-[20px] border border-white/10 bg-white/[0.06] shadow-[0_16px_45px_rgba(3,8,22,0.4)]">
        <span className="absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(244,63,94,0.45),transparent_40%),radial-gradient(circle_at_80%_80%,rgba(59,130,246,0.4),transparent_48%),linear-gradient(160deg,#0b1120_10%,#111827_100%)]" />
        <svg
          viewBox="0 0 64 64"
          className="relative h-7 w-7 text-white transition duration-300 group-hover:scale-110"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            d="M16 46V18h6.5l14.5 17.5V18H48v28h-6.4L27 28.6V46H16Z"
            fill="currentColor"
          />
          <path
            d="M42 18h8L34 46h-8l16-28Z"
            fill="url(#tasteflix-logo-gradient)"
            fillOpacity="0.95"
          />
          <defs>
            <linearGradient id="tasteflix-logo-gradient" x1="50" y1="17" x2="28" y2="47" gradientUnits="userSpaceOnUse">
              <stop stopColor="#FB7185" />
              <stop offset="1" stopColor="#38BDF8" />
            </linearGradient>
          </defs>
        </svg>
      </span>
      {!compact ? (
        <span className="flex flex-col">
          <span className="text-[0.68rem] font-semibold uppercase tracking-[0.42em] text-sky-200/80">
            Taste
          </span>
          <span className="text-xl font-black tracking-[0.22em] text-white transition duration-300 group-hover:text-sky-50">FLIX</span>
        </span>
      ) : null}
    </Link>
  );
}
