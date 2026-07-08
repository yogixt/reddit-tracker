"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, ArrowLeft } from "lucide-react";
import { setEmployeeSession } from "@/lib/session";

export default function EmployeeLogin() {
  const router = useRouter();
  const [name, setName] = useState("");
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
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Login failed");
        return;
      }
      setEmployeeSession({ name: data.name, redditUsername: data.redditUsername });
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
        <span className="tab-chip mb-6 inline-flex">Employee · Sign in</span>

        <h1 className="display text-5xl">
          Log your <span className="accent-word">day</span>.
        </h1>
        <p className="mt-3 text-[13px] leading-relaxed text-ink-soft">
          New here? Just enter your name — your profile is created on first
          sign-in. Your admin links your Reddit, Quora and LinkedIn handles.
        </p>

        <div className="terminal mt-7">
          <div className="terminal-bar">
            <span className="terminal-dots">
              <i style={{ background: "#ff5f57" }} />
              <i style={{ background: "#febc2e" }} />
              <i style={{ background: "#28c840" }} />
            </span>
            <span className="text-[11px] text-terminal-muted">sign-in</span>
          </div>
          <form onSubmit={handleSubmit} className="terminal-body space-y-4">
            <div>
              <label className="mb-1.5 block text-[10px] uppercase tracking-widest text-terminal-muted">
                <span className="caret">&gt;</span> Your name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full name"
                required
                autoFocus
                className="w-full border border-[#322c20] bg-[#0d0b07] px-3 py-2.5 font-mono text-sm text-terminal-text outline-none focus:border-[#e0794b]"
              />
            </div>

            {error ? (
              <p className="border border-[#b23b2e] bg-[#2a1512] px-3 py-2 font-mono text-xs text-[#f0a99b]">
                {error}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full"
            >
              {loading ? <Loader2 size={15} className="animate-spin" /> : null}
              {loading ? "Signing in" : "Continue"}
            </button>
          </form>
        </div>

        <Link
          href="/"
          className="mt-6 inline-flex items-center gap-1.5 text-xs text-ink-faint transition-colors hover:text-ink"
        >
          <ArrowLeft size={12} /> Back to home
        </Link>
      </div>
    </main>
  );
}
