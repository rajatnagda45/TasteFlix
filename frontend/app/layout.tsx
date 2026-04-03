import "./globals.css";

import type { Metadata } from "next";

import { Navbar } from "@/components/navbar";


export const metadata: Metadata = {
  title: "TasteFlix",
  description: "AI-powered movie recommendations that learn your taste.",
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/apple-icon.svg",
  },
};


export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Navbar />
        {children}
      </body>
    </html>
  );
}
