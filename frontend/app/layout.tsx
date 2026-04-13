import "./globals.css";

import type { Metadata } from "next";

import { Navbar } from "@/components/navbar";
import { PageTransition } from "@/components/page-transition";


export const metadata: Metadata = {
  title: "TasteFlix",
  description: "AI-powered movie recommendations that learn your taste.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/apple-touch-icon.svg",
  },
};


export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="hero-orb left-[-8rem] top-12 h-72 w-72 bg-rose-500/20" />
        <div className="hero-orb right-[-7rem] top-40 h-80 w-80 bg-sky-500/20" />
        <div className="hero-orb bottom-[-8rem] left-1/3 h-72 w-72 bg-violet-500/15" />
        <Navbar />
        <PageTransition>
          {children}
        </PageTransition>
      </body>
    </html>
  );
}
