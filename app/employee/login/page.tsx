"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Loader2, ArrowLeft } from "lucide-react";
import { setEmployeeSession } from "@/lib/session";

export default function EmployeeLogin() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [redditUsername, setRedditUsername] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/employee", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, redditUsername }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Login failed");
        return;
      }
      setEmployeeSession({
        name: data.name,
        redditUsername: data.redditUsername,
      });
      router.push("/employee/dashboard");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex flex-1 items-center justify-center px-5 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center gap-2.5">
          <Image src="/logo.png" alt="" width={24} height={24} priority />
          <span className="text-[13px] font-semibold">Tracker</span>
        </div>

        <p className="kicker mb-2 text-accent">Employee</p>
        <h1 className="text-xl font-semibold tracking-tight">Sign in</h1>
        <p className="mt-1.5 text-[13px] leading-relaxed text-muted">
          New here? Just enter your details — your account is created on first
          sign-in.
        </p>

        <form onSubmit={handleSubmit} className="mt-7 space-y-4">
          <div>
            <label className="kicker mb-1.5 block">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your full name"
              required
              className="input"
            />
          </div>
          <div>
            <label className="kicker mb-1.5 block">Reddit username</label>
            <input
              type="text"
              value={redditUsername}
              onChange={(e) => setRedditUsername(e.target.value)}
              placeholder="u/username"
              required
              className="input"
            />
          </div>

          {error ? <p className="alert-error">{error}</p> : null}

          <button type="submit" disabled={loading} className="btn btn-primary w-full">
            {loading ? <Loader2 size={15} className="animate-spin" /> : null}
            {loading ? "Signing in" : "Continue"}
          </button>
        </form>

        <Link
          href="/"
          className="mt-6 inline-flex items-center gap-1.5 text-xs text-faint transition-colors hover:text-white"
        >
          <ArrowLeft size={12} /> Back to home
        </Link>
      </div>
    </main>
  );
}
