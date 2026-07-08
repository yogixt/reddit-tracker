"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Flame,
  Heart,
  MessageCircle,
  CheckCircle2,
  Loader2,
  LogOut,
  Zap,
  Image as ImageIcon,
} from "lucide-react";
import StatCard from "@/components/StatCard";
import {
  clearEmployeeSession,
  getEmployeeSession,
  type EmployeeSession,
} from "@/lib/session";
import { PLATFORMS, PLATFORM_META, type Platform } from "@/lib/platforms";

interface PlatformStat {
  likes: number;
  comments: number;
  posts: number;
  reports: number;
  today: {
    likes: number;
    comments: number;
    posts: number;
    communities: string;
    source: string;
  } | null;
}
interface Stats {
  streak: number;
  totalLikes: number;
  totalComments: number;
  reportsDone: number;
  submittedToday: boolean;
  byPlatform: Record<Platform, PlatformStat>;
}

function greetingIST(): string {
  const h = Number(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Kolkata",
      hour: "2-digit",
      hour12: false,
    }).format(new Date())
  );
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default function EmployeeDashboard() {
  const router = useRouter();
  const [session, setSession] = useState<EmployeeSession | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  // Form state
  const [platform, setPlatform] = useState<Platform>("quora");
  const [likes, setLikes] = useState("");
  const [comments, setComments] = useState("");
  const [posts, setPosts] = useState("");
  const [communities, setCommunities] = useState("");
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [screenshotData, setScreenshotData] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Downscale + compress the image in the browser to a small data URL so it can
  // be stored inline (no external Blob store needed).
  async function compressImage(file: File): Promise<string> {
    const bitmap = await createImageBitmap(file);
    const max = 1280;
    const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
    const w = Math.round(bitmap.width * scale);
    const h = Math.round(bitmap.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("canvas unsupported");
    ctx.drawImage(bitmap, 0, 0, w, h);
    return canvas.toDataURL("image/jpeg", 0.7);
  }

  async function handleFile(file: File | null) {
    setScreenshot(file);
    setScreenshotData("");
    if (!file) return;
    try {
      const data = await compressImage(file);
      setScreenshotData(data);
    } catch {
      setError("Could not process that image");
      setScreenshot(null);
    }
  }

  const loadStats = useCallback(async (name: string) => {
    const res = await fetch(`/api/submissions?name=${encodeURIComponent(name)}`);
    const data = await res.json();
    setStats(data.stats);
    setLoading(false);
  }, []);

  useEffect(() => {
    const s = getEmployeeSession();
    if (!s) {
      router.replace("/employee/login");
      return;
    }
    setSession(s);
    loadStats(s.name);
  }, [router, loadStats]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!session) return;
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: session.name,
          platform,
          likes: Number(likes),
          comments: Number(comments),
          posts: Number(posts || 0),
          communities,
          screenshotUrl: screenshotData, // inline compressed data URL
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Submission failed");
        return;
      }
      sessionStorage.setItem(
        "ret_last_submission",
        JSON.stringify({
          platform,
          likes: Number(likes),
          comments: Number(comments),
          posts: Number(posts || 0),
          communities,
          submittedAt: new Date().toISOString(),
        })
      );
      router.push("/employee/success");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleLogout() {
    clearEmployeeSession();
    router.push("/");
  }

  if (loading || !session) {
    return (
      <main className="flex flex-1 items-center justify-center">
        <Loader2 size={24} className="animate-spin text-ink-faint" />
      </main>
    );
  }

  const today = new Date().toLocaleDateString("en-IN", {
    timeZone: "Asia/Kolkata",
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const meta = PLATFORM_META[platform];

  return (
    <main className="mx-auto w-full max-w-lg flex-1 px-5 py-8">
      <div className="mb-7">
        <span className="tab-chip">{today}</span>
        <h1 className="display mt-4 text-4xl">
          {greetingIST()},{" "}
          <span className="accent-word">{session.name.split(" ")[0]}</span>.
        </h1>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Day streak" value={stats?.streak ?? 0} icon={Flame} accent="#b4573c" />
        <StatCard label="Total likes" value={stats?.totalLikes ?? 0} icon={Heart} accent="#c2185b" />
        <StatCard label="Comments" value={stats?.totalComments ?? 0} icon={MessageCircle} accent="#0a66c2" />
        <StatCard label="Entries" value={stats?.reportsDone ?? 0} icon={CheckCircle2} accent="#3f7d3a" />
      </div>

      {/* Per-platform status today */}
      <div className="mt-5 space-y-2">
        <p className="kicker">Today across platforms</p>
        {PLATFORMS.map((p) => {
          const m = PLATFORM_META[p];
          const t = stats?.byPlatform?.[p]?.today ?? null;
          return (
            <div
              key={p}
              className="card-flat flex items-center gap-3 px-3.5 py-2.5"
            >
              <span
                className="dot"
                style={{
                  background: t ? m.color : "transparent",
                  border: t ? "none" : "1.5px solid var(--ink-faint)",
                }}
              />
              <span className="pill" style={{ color: m.color }}>
                {m.label}
              </span>
              {t ? (
                <span className="ml-auto font-mono text-xs text-ink-soft tabular-nums">
                  {t.likes} likes · {t.comments} comments
                  {t.source === "api" || t.source === "scraper" ? (
                    <span className="ml-2 inline-flex items-center gap-1 text-[10px] text-ink-faint">
                      <Zap size={10} /> auto
                    </span>
                  ) : null}
                </span>
              ) : (
                <span className="ml-auto font-mono text-[11px] text-ink-faint">
                  {m.source === "api" ? "awaiting sync" : "not logged"}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Manual log */}
      <section className="terminal mt-6">
        <div className="terminal-bar">
          <span className="terminal-dots">
            <i style={{ background: "#ff5f57" }} />
            <i style={{ background: "#febc2e" }} />
            <i style={{ background: "#28c840" }} />
          </span>
          <span className="text-[11px] text-terminal-muted">log activity</span>
        </div>
        <div className="terminal-body">
          {/* platform selector */}
          <div className="grid grid-cols-3 gap-1.5">
            {PLATFORMS.map((p) => {
              const m = PLATFORM_META[p];
              const active = p === platform;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPlatform(p)}
                  className="border-[1.5px] py-2 font-mono text-[11px] font-bold uppercase tracking-wider transition-colors"
                  style={{
                    borderColor: active ? m.color : "#322c20",
                    background: active ? m.color : "transparent",
                    color: active ? "#fff" : "#a99c82",
                  }}
                >
                  {m.label}
                </button>
              );
            })}
          </div>

          {meta.source !== "api" ? null : (
            <p className="mt-3 flex items-center gap-1.5 font-mono text-[11px] text-terminal-muted">
              <Zap size={11} /> Reddit syncs automatically each night — manual
              entry here is an optional override.
            </p>
          )}

          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="mb-1.5 block text-[10px] uppercase tracking-widest text-terminal-muted">
                  Likes
                </label>
                <input
                  type="number"
                  min={0}
                  value={likes}
                  onChange={(e) => setLikes(e.target.value)}
                  placeholder="0"
                  required
                  className="w-full border border-[#322c20] bg-[#0d0b07] px-3 py-2 font-mono text-sm tabular-nums text-terminal-text outline-none focus:border-[#e0794b]"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-[10px] uppercase tracking-widest text-terminal-muted">
                  Comments
                </label>
                <input
                  type="number"
                  min={0}
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder="0"
                  required
                  className="w-full border border-[#322c20] bg-[#0d0b07] px-3 py-2 font-mono text-sm tabular-nums text-terminal-text outline-none focus:border-[#e0794b]"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-[10px] uppercase tracking-widest text-terminal-muted">
                  Posts
                </label>
                <input
                  type="number"
                  min={0}
                  value={posts}
                  onChange={(e) => setPosts(e.target.value)}
                  placeholder="0"
                  className="w-full border border-[#322c20] bg-[#0d0b07] px-3 py-2 font-mono text-sm tabular-nums text-terminal-text outline-none focus:border-[#e0794b]"
                />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-[10px] uppercase tracking-widest text-terminal-muted">
                {meta.contextLabel}
              </label>
              <input
                type="text"
                value={communities}
                onChange={(e) => setCommunities(e.target.value)}
                placeholder={
                  platform === "reddit"
                    ? "r/webdev, r/india"
                    : platform === "quora"
                    ? "Web Development, Startups"
                    : "#hiring, #saas"
                }
                className="w-full border border-[#322c20] bg-[#0d0b07] px-3 py-2 font-mono text-sm text-terminal-text outline-none focus:border-[#e0794b]"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-[10px] uppercase tracking-widest text-terminal-muted">
                Screenshot <span className="normal-case text-[#7a6f5a]">(proof, optional)</span>
              </label>
              <label className="flex cursor-pointer items-center gap-2 rounded-[10px] border border-dashed border-edge-strong bg-bg px-3 py-2.5 font-mono text-xs text-terminal-muted transition-colors hover:border-accent">
                <ImageIcon size={14} />
                <span className="truncate">
                  {screenshot ? screenshot.name : "Attach a screenshot of your activity"}
                </span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
                  className="hidden"
                />
              </label>
              {screenshotData ? (
                <div className="mt-2 flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={screenshotData}
                    alt="preview"
                    className="h-14 w-24 rounded-[8px] border border-edge object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => handleFile(null)}
                    className="font-mono text-[10px] text-faint underline hover:text-text"
                  >
                    remove
                  </button>
                </div>
              ) : null}
            </div>

            {error ? (
              <p className="border border-[#b23b2e] bg-[#2a1512] px-3 py-2 font-mono text-xs text-[#f0a99b]">
                {error}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={submitting}
              className="btn btn-primary w-full"
            >
              {submitting ? <Loader2 size={15} className="animate-spin" /> : null}
              {submitting ? "Logging" : `Log ${meta.label}`}
            </button>
          </form>
        </div>
      </section>

      <button
        onClick={handleLogout}
        className="mx-auto mt-7 flex items-center gap-1.5 text-xs text-ink-faint transition-colors hover:text-ink"
      >
        <LogOut size={12} /> Logout
      </button>
    </main>
  );
}
