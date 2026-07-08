"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, ArrowLeft } from "lucide-react";
import { setAdminSession } from "@/lib/session";

export default function AdminLogin() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Login failed");
        return;
      }
      setAdminSession({ name: data.name });
      router.push("/admin/dashboard");
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
          <span className="h-2.5 w-2.5 rounded-full bg-accent" />
          <span className="text-[13px] font-semibold">Tracker</span>
        </div>

        <span className="tab-chip mb-5">Admin</span>
        <h1 className="display text-4xl">
          Sign <span className="accent-word">in</span>.
        </h1>
        <p className="mt-2 text-[13px] text-muted">
          Team dashboard, proof wall and reports.
        </p>

        <form onSubmit={handleSubmit} className="mt-7 space-y-4">
          <div>
            <label className="kicker mb-1.5 block">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Admin name"
              required
              className="input"
            />
          </div>
          <div>
            <label className="kicker mb-1.5 block">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
              className="input"
            />
          </div>

          {error ? <p className="alert-error">{error}</p> : null}

          <button type="submit" disabled={loading} className="btn btn-primary w-full">
            {loading ? <Loader2 size={15} className="animate-spin" /> : null}
            {loading ? "Signing in" : "Sign in"}
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
