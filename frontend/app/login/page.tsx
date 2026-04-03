"use client";

import { FormEvent, ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Github } from "lucide-react";

import { consumeFirebaseSocialRedirect, firebaseLogin, firebaseSocialLogin } from "@/lib/firebase-auth";
import { saveSession } from "@/lib/storage";
import { api } from "@/services/api";

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path
        d="M21.81 12.23c0-.72-.06-1.25-.19-1.79H12.2v3.37h5.53c-.11.84-.72 2.11-2.08 2.96l-.02.11 3.02 2.29.21.02c1.91-1.72 2.95-4.25 2.95-7.26Z"
        fill="#4285F4"
      />
      <path
        d="M12.2 21.9c2.71 0 4.99-.87 6.65-2.36l-3.21-2.43c-.86.58-2.01.98-3.44.98-2.65 0-4.9-1.72-5.7-4.1l-.1.01-3.14 2.38-.04.09c1.66 3.21 5.07 5.43 8.98 5.43Z"
        fill="#34A853"
      />
      <path
        d="M6.5 13.99a5.8 5.8 0 0 1-.33-1.92c0-.67.12-1.32.32-1.92l-.01-.13-3.18-2.42-.1.05A9.71 9.71 0 0 0 2.16 12c0 1.56.38 3.03 1.04 4.35l3.3-2.36Z"
        fill="#FBBC05"
      />
      <path
        d="M12.2 5.9c1.8 0 3.02.76 3.72 1.4l2.72-2.6C17.18 3.36 14.9 2.1 12.2 2.1c-3.91 0-7.32 2.22-8.98 5.43l3.29 2.49c.81-2.38 3.07-4.12 5.69-4.12Z"
        fill="#EA4335"
      />
    </svg>
  );
}

function SocialButton({
  label,
  icon,
  onClick,
  disabled,
}: {
  label: string;
  icon: ReactNode;
  onClick: () => Promise<void>;
  disabled: boolean;
}) {
  return (
    <button
      type="button"
      onClick={() => void onClick()}
      disabled={disabled}
      className="flex w-full items-center justify-center gap-3 rounded-full border border-white/10 bg-white px-5 py-4 text-lg font-bold text-slate-900 transition hover:bg-slate-100 disabled:opacity-50"
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;

    async function hydrateRedirectLogin() {
      try {
        const socialProfile = await consumeFirebaseSocialRedirect();
        if (!socialProfile || !active) {
          return;
        }
        setLoading(true);
        const response = await api.socialAuth(socialProfile);
        saveSession(response);
        router.push("/dashboard");
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : "Social login failed");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void hydrateRedirectLogin();
    return () => {
      active = false;
    };
  }, [router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      await firebaseLogin(email, password);
      const response = await api.login({ email, password });
      saveSession(response);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleSocialLogin(provider: "google" | "github") {
    setError("");
    setLoading(true);
    try {
      const socialProfile = await firebaseSocialLogin(provider);
      if (!socialProfile) {
        return;
      }
      const response = await api.socialAuth(socialProfile);
      saveSession(response);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : `${provider} login failed`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-[calc(100vh-88px)] max-w-xl items-center px-6 py-12">
      <form onSubmit={handleSubmit} className="w-full rounded-[32px] border border-white/10 bg-white/5 p-8 shadow-card">
        <p className="text-sm uppercase tracking-[0.35em] text-rose-200">Welcome back</p>
        <h1 className="mt-4 text-4xl font-black text-white">Sign in to TasteFlix</h1>
        <p className="mt-3 text-sm leading-6 text-slate-400">
          Your login is now verified through Firebase before your TasteFlix session starts.
        </p>
        <div className="mt-8 space-y-3">
          <SocialButton
            label="Continue with Google"
            icon={<GoogleMark />}
            onClick={() => handleSocialLogin("google")}
            disabled={loading}
          />
          <SocialButton
            label="Continue with GitHub"
            icon={<Github className="h-5 w-5" />}
            onClick={() => handleSocialLogin("github")}
            disabled={loading}
          />
        </div>
        <div className="my-6 flex items-center gap-4">
          <div className="h-px flex-1 bg-white/10" />
          <span className="text-xs uppercase tracking-[0.3em] text-slate-500">or</span>
          <div className="h-px flex-1 bg-white/10" />
        </div>
        <div className="mt-8 space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-black/30 px-5 py-4 text-white"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-black/30 px-5 py-4 text-white"
          />
        </div>
        {error ? <p className="mt-4 text-sm text-rose-300">{error}</p> : null}
        <button
          disabled={loading}
          className="mt-6 w-full rounded-full bg-glow px-5 py-4 font-bold uppercase tracking-[0.25em] text-white disabled:opacity-50"
        >
          {loading ? "Signing in..." : "Login"}
        </button>
        <p className="mt-4 text-sm text-slate-400">
          New here?{" "}
          <Link href="/signup" className="text-sky-300">
            Create an account
          </Link>
        </p>
      </form>
    </main>
  );
}
