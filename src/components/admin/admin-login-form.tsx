"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { supabase } from "@/lib/supabase/browser";

type AdminLoginFormProps = {
  nextPath: string;
  reason?: string;
};

function getReasonMessage(reason?: string) {
  if (reason === "forbidden") {
    return "That account does not have admin access.";
  }

  if (reason === "auth") {
    return "Please sign in to continue.";
  }

  return null;
}

export function AdminLoginForm({ nextPath, reason }: AdminLoginFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const helperMessage = useMemo(() => getReasonMessage(reason), [reason]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setErrorMessage(error.message);
      setIsSubmitting(false);
      return;
    }

    router.replace(nextPath);
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5 rounded-2xl border border-warm-200 bg-white p-8 shadow-sm"
    >
      <div className="space-y-2 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brass-600">
          Admin Access
        </p>
        <h1 className="font-heading text-3xl font-bold text-warm-900">
          Sign in
        </h1>
        <p className="text-sm text-warm-600">
          Use your admin email and password to access the dashboard.
        </p>
      </div>

      {helperMessage ? (
        <div className="rounded-xl border border-brass-200 bg-brass-50 px-4 py-3 text-sm text-brass-700">
          {helperMessage}
        </div>
      ) : null}

      {errorMessage ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      ) : null}

      <label className="block space-y-2">
        <span className="text-sm font-medium text-warm-800">Email</span>
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="email"
          required
          className="w-full rounded-xl border border-warm-200 bg-white px-4 py-3 text-sm text-warm-900 outline-none transition focus:border-brass-500 focus:ring-2 focus:ring-brass-100"
        />
      </label>

      <label className="block space-y-2">
        <span className="text-sm font-medium text-warm-800">Password</span>
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="current-password"
          required
          className="w-full rounded-xl border border-warm-200 bg-white px-4 py-3 text-sm text-warm-900 outline-none transition focus:border-brass-500 focus:ring-2 focus:ring-brass-100"
        />
      </label>

      <button
        type="submit"
        disabled={isSubmitting}
        className="flex w-full items-center justify-center rounded-xl bg-warm-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-warm-800 disabled:cursor-not-allowed disabled:bg-warm-400"
      >
        {isSubmitting ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}
