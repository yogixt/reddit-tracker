import { getDb, todayIST, daysAgoIST } from "@/lib/db";
import type { Submission } from "@/lib/types";

function computeStreak(dates: string[]): number {
  const set = new Set(dates);
  const today = todayIST();
  // Streak counts back from today, or from yesterday if today not yet submitted
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
    // Personal stats for the employee dashboard
    const result = await db.execute({
      sql: "SELECT * FROM submissions WHERE name = ? ORDER BY date DESC",
      args: [name],
    });
    const rows = result.rows as unknown as Submission[];
    const today = todayIST();
    const todaySubmission = rows.find((r) => r.date === today) ?? null;

    return Response.json({
      submissions: rows,
      stats: {
        streak: computeStreak(rows.map((r) => String(r.date))),
        totalLikes: rows.reduce((s, r) => s + Number(r.likes), 0),
        totalComments: rows.reduce((s, r) => s + Number(r.comments), 0),
        reportsDone: rows.length,
        submittedToday: todaySubmission !== null,
        todaySubmission,
      },
    });
  }

  if (all) {
    const result = await db.execute(
      "SELECT * FROM submissions ORDER BY date DESC, name"
    );
    return Response.json({ submissions: result.rows });
  }

  const result = await db.execute({
    sql: "SELECT * FROM submissions WHERE date = ? ORDER BY name",
    args: [todayIST()],
  });
  return Response.json({ submissions: result.rows });
}

export async function POST(request: Request) {
  const body = await request.json();
  const name = String(body.name ?? "").trim();
  const redditUsername = String(body.redditUsername ?? "").trim();
  const timeSpent = Number(body.timeSpent);
  const likes = Number(body.likes);
  const comments = Number(body.comments);
  const communities = String(body.communities ?? "").trim();

  if (!name || !redditUsername || !communities) {
    return Response.json({ error: "All fields are required" }, { status: 400 });
  }
  if (![20, 30, 40].includes(timeSpent)) {
    return Response.json({ error: "Invalid time spent" }, { status: 400 });
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

  // Verify employee exists
  const emp = await db.execute({
    sql: "SELECT name FROM employees WHERE name = ?",
    args: [name],
  });
  if (emp.rows.length === 0) {
    return Response.json({ error: "Employee not found" }, { status: 401 });
  }

  const date = todayIST();
  const submittedAt = new Date().toISOString();
  try {
    await db.execute({
      sql: `INSERT INTO submissions
        (name, reddit_username, date, time_spent, likes, comments, communities, submitted_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [name, redditUsername, date, timeSpent, likes, comments, communities, submittedAt],
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    if (message.includes("UNIQUE")) {
      return Response.json(
        { error: "Already submitted today" },
        { status: 409 }
      );
    }
    throw err;
  }

  return Response.json(
    {
      ok: true,
      submission: { name, redditUsername, date, timeSpent, likes, comments, communities, submittedAt },
    },
    { status: 201 }
  );
}
