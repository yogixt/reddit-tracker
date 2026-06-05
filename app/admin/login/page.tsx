"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ShieldCheck, Loader2, ArrowLeft } from "lucide-react";
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
    <main className="flex flex-1 items-center justify-center px-4 py-10">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="glass gradient-border w-full max-w-sm rounded-2xl p-6 sm:p-8"
      >
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-secondary/20 text-secondary">
            <ShieldCheck size={24} />
          </div>
          <h1 className="text-xl font-semibold">Admin Login</h1>
          <p className="mt-1 text-xs text-muted">
            Sign in to the team dashboard
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs text-muted">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Admin name"
              required
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm outline-none transition focus:border-primary/60 focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs text-muted">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm outline-none transition focus:border-primary/60 focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {error ? (
            <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-400">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-medium transition hover:bg-primary/90 disabled:opacity-60 glow-primary"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : null}
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <Link
          href="/"
          className="mt-5 flex items-center justify-center gap-1.5 text-xs text-muted transition hover:text-white"
        >
          <ArrowLeft size={13} /> Back to home
        </Link>
      </motion.div>
    </main>
  );
}
