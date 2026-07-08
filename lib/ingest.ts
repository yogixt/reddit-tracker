import type { Client } from "@libsql/client";
import { todayIST } from "./db";
import { PLATFORM_META, isPlatform, type Platform } from "./platforms";

export interface IncomingMetric {
  platform: Platform;
  handle: string;
  likes?: number;
  comments?: number;
  posts?: number;
  communities?: string;
  date?: string;
}

export interface IngestResult {
  matched: number;
  unmatched: { platform: string; handle: string }[];
}

const num = (v: unknown): number => {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? Math.round(n) : 0;
};

/**
 * Resolve each metric's (platform, handle) to a roster employee and upsert a
 * submission for that (name, platform, date). Idempotent — re-running replaces
 * the day's value. `source` distinguishes reddit API pulls from scraper pushes.
 */
export async function ingestMetrics(
  db: Client,
  metrics: IncomingMetric[],
  source: "api" | "scraper",
  defaultDate?: string
): Promise<IngestResult> {
  const date = defaultDate ?? todayIST();
  const submittedAt = new Date().toISOString();
  const result: IngestResult = { matched: 0, unmatched: [] };

  for (const m of metrics) {
    if (!isPlatform(m.platform) || !m.handle) {
      result.unmatched.push({ platform: String(m.platform), handle: String(m.handle ?? "") });
      continue;
    }
    const field = PLATFORM_META[m.platform].handleField;
    const emp = await db.execute({
      sql: `SELECT name FROM employees WHERE ${field} = ? COLLATE NOCASE AND ${field} != ''`,
      args: [m.handle],
    });
    if (emp.rows.length === 0) {
      result.unmatched.push({ platform: m.platform, handle: m.handle });
      continue;
    }
    const name = String(emp.rows[0].name);
    const rowDate = m.date ?? date;

    await db.execute({
      sql: `INSERT INTO submissions
              (name, platform, handle, date, time_spent, likes, comments, posts, communities, source, submitted_at)
            VALUES (?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(name, platform, date) DO UPDATE SET
              handle = excluded.handle,
              likes = excluded.likes,
              comments = excluded.comments,
              posts = excluded.posts,
              communities = excluded.communities,
              source = excluded.source,
              submitted_at = excluded.submitted_at`,
      args: [
        name,
        m.platform,
        m.handle,
        rowDate,
        num(m.likes),
        num(m.comments),
        num(m.posts),
        String(m.communities ?? "").trim(),
        source,
        submittedAt,
      ],
    });
    result.matched += 1;
  }

  return result;
}
