import { getDb, todayIST, daysAgoIST } from "@/lib/db";
import { PLATFORMS, PLATFORM_META, isPlatform, type Platform } from "@/lib/platforms";
import type { Submission } from "@/lib/types";

function computeStreak(dates: string[]): number {
  const set = new Set(dates);
  const today = todayIST();
  let start = 0;
  if (!set.has(today)) start = 1;
  let streak = 0;
  for (let i = start; ; i++) {
    if (set.has(daysAgoIST(i))) streak++;
    else break;
  }
  return streak;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get("name");
  const all = searchParams.get("all") === "true";

  const db = await getDb();

  if (name) {
    const result = await db.execute({
      sql: "SELECT * FROM submissions WHERE name = ? ORDER BY date DESC, platform",
      args: [name],
    });
    const rows = result.rows as unknown as Submission[];
    const today = todayIST();

    // Distinct dates with any activity → streak of participation
    const dates = [...new Set(rows.map((r) => String(r.date)))];

    const byPlatform: Record<
      string,
      { likes: number; comments: number; posts: number; reports: number; today: Submission | null }
    > = {};
    for (const p of PLATFORMS) {
      byPlatform[p] = { likes: 0, comments: 0, posts: 0, reports: 0, today: null };
    }
    for (const r of rows) {
      const p = String(r.platform);
      if (!byPlatform[p]) continue;
      byPlatform[p].likes += Number(r.likes);
      byPlatform[p].comments += Number(r.comments);
      byPlatform[p].posts += Number(r.posts);
      byPlatform[p].reports += 1;
      if (r.date === today) byPlatform[p].today = r;
    }

    return Response.json({
      submissions: rows,
      stats: {
        streak: computeStreak(dates),
        totalLikes: rows.reduce((s, r) => s + Number(r.likes), 0),
        totalComments: rows.reduce((s, r) => s + Number(r.comments), 0),
        reportsDone: rows.length,
        submittedToday: rows.some((r) => r.date === today),
        byPlatform,
      },
    });
  }

  if (all) {
    const result = await db.execute(
      "SELECT * FROM submissions ORDER BY date DESC, name, platform"
    );
    return Response.json({ submissions: result.rows });
  }

  const result = await db.execute({
    sql: "SELECT * FROM submissions WHERE date = ? ORDER BY name, platform",
    args: [todayIST()],
  });
  return Response.json({ submissions: result.rows });
}

export async function POST(request: Request) {
  const body = await request.json();
  const name = String(body.name ?? "").trim();
  const platform = String(body.platform ?? "").trim() as Platform;
  const likes = Number(body.likes);
  const comments = Number(body.comments);
  const posts = Number(body.posts ?? 0);
  const timeSpent = Number(body.timeSpent ?? 0);
  const communities = String(body.communities ?? "").trim();
  const screenshotUrl = String(body.screenshotUrl ?? "").trim();

  if (!name) {
    return Response.json({ error: "Name is required" }, { status: 400 });
  }
  if (!isPlatform(platform)) {
    return Response.json({ error: "Valid platform is required" }, { status: 400 });
  }
  if (
    !Number.isFinite(likes) ||
    !Number.isFinite(comments) ||
    likes < 0 ||
    comments < 0
  ) {
    return Response.json(
      { error: "Likes and comments must be non-negative numbers" },
      { status: 400 }
    );
  }

  const db = await getDb();

  // Verify employee exists and resolve their handle for this platform
  const emp = await db.execute({
    sql: "SELECT name, reddit_username, quora_username, linkedin_url FROM employees WHERE name = ?",
    args: [name],
  });
  if (emp.rows.length === 0) {
    return Response.json({ error: "Employee not found" }, { status: 401 });
  }
  const handleField = PLATFORM_META[platform].handleField;
  const handle =
    String(body.handle ?? "").trim() ||
    String(emp.rows[0][handleField] ?? "").trim();

  const date = todayIST();
  const submittedAt = new Date().toISOString();
  try {
    await db.execute({
      sql: `INSERT INTO submissions
        (name, platform, handle, date, time_spent, likes, comments, posts, communities, source, screenshot_url, submitted_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'manual', ?, ?)`,
      args: [
        name,
        platform,
        handle,
        date,
        Number.isFinite(timeSpent) && timeSpent > 0 ? Math.round(timeSpent) : 0,
        Math.round(likes),
        Math.round(comments),
        Number.isFinite(posts) && posts > 0 ? Math.round(posts) : 0,
        communities,
        screenshotUrl,
        submittedAt,
      ],
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    if (message.includes("UNIQUE")) {
      return Response.json(
        { error: `Already logged ${PLATFORM_META[platform].label} today` },
        { status: 409 }
      );
    }
    throw err;
  }

  return Response.json({ ok: true }, { status: 201 });
}
