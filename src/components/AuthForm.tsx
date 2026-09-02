"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn, signUp, DEMO_CREDENTIALS } from "@/lib/db";

export default function AuthForm({ mode }: { mode: "signup" | "login" }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/dashboard";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === "signup") {
        if (password.length < 6) throw new Error("Password must be at least 6 characters.");
        signUp(name, email, password);
      } else {
        signIn(email, password);
      }
      router.push(next);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setLoading(false);
    }
  }

  function fillDemo() {
    setEmail(DEMO_CREDENTIALS.email);
    setPassword(DEMO_CREDENTIALS.password);
  }

  return (
    <div className="mx-auto max-w-sm px-4 sm:px-6 py-14 sm:py-20">
      <h1 className="font-display text-3xl font-semibold text-ink mb-2">
        {mode === "signup" ? "Create your account" : "Log in"}
      </h1>
      <p className="text-ink-soft mb-8">
        {mode === "signup"
          ? "Takes 10 seconds — no email verification needed for this demo."
          : "Welcome back."}
      </p>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {mode === "signup" && (
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-ink mb-1.5">
              Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="w-full rounded-md border border-line bg-paper-raised px-3 py-2.5 text-ink focus:border-gold"
            />
          </div>
        )}

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-ink mb-1.5">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@school.edu"
            className="w-full rounded-md border border-line bg-paper-raised px-3 py-2.5 text-ink focus:border-gold"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-ink mb-1.5">
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full rounded-md border border-line bg-paper-raised px-3 py-2.5 text-ink focus:border-gold"
          />
        </div>

        {error && (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full px-4 py-2.5 rounded-md bg-ink text-paper font-semibold hover:bg-ink-soft transition-colors disabled:opacity-60"
        >
          {loading ? "Please wait…" : mode === "signup" ? "Sign up" : "Log in"}
        </button>
      </form>

      <div className="mt-6 rounded-md bg-gold-soft/40 border border-gold/30 px-4 py-3 text-sm text-ink-soft">
        <p className="font-semibold text-ink mb-1">Demo login</p>
        <p>
          Email: <code>{DEMO_CREDENTIALS.email}</code>
          <br />
          Password: <code>{DEMO_CREDENTIALS.password}</code>
        </p>
        <button
          type="button"
          onClick={fillDemo}
          className="mt-2 text-sm font-semibold text-ink underline hover:text-gold"
        >
          Fill demo credentials
        </button>
      </div>

      <p className="mt-6 text-sm text-ink-soft">
        {mode === "signup" ? (
          <>
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-ink hover:text-gold">
              Log in
            </Link>
          </>
        ) : (
          <>
            New here?{" "}
            <Link href="/signup" className="font-semibold text-ink hover:text-gold">
              Sign up
            </Link>
          </>
        )}
      </p>
    </div>
  );
}
