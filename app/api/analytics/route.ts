import { getDb, todayIST, daysAgoIST } from "@/lib/db";
import type {
  Analytics,
  DailyPoint,
  Employee,
  LeaderboardEntry,
  Submission,
  WeeklyPoint,
} from "@/lib/types";

export async function GET() {
  const db = await getDb();
  const today = todayIST();

  const [employeesRes, todayRes, allRes] = await Promise.all([
    db.execute("SELECT * FROM employees ORDER BY name"),
    db.execute({
      sql: "SELECT * FROM submissions WHERE date = ? ORDER BY name",
      args: [today],
    }),
    db.execute("SELECT * FROM submissions ORDER BY date"),
  ]);

  const employees = employeesRes.rows as unknown as Employee[];
  const todaySubmissions = todayRes.rows as unknown as Submission[];
  const allSubmissions = allRes.rows as unknown as Submission[];

  // KPIs
  const submittedNames = new Set(
    todaySubmissions.map((s) => String(s.name).toLowerCase())
  );
  const communitiesToday = new Set<string>();
  for (const s of todaySubmissions) {
    for (const c of String(s.communities).split(/[,;]+/)) {
      const t = c.trim().toLowerCase();
      if (t) communitiesToday.add(t);
    }
  }
  const totalEmployees = employees.length;
  const submittedToday = todaySubmissions.length;

  // Heatmap
  const heatmap = employees.map((e) => ({
    name: e.name,
    reddit_username: e.reddit_username,
    submittedToday: submittedNames.has(String(e.name).toLowerCase()),
  }));

  // Leaderboard (all-time)
  const byName = new Map<
    string,
    { name: string; reddit_username: string; likes: number; comments: number; days: number }
  >();
  for (const s of allSubmissions) {
    const key = String(s.name).toLowerCase();
    const entry = byName.get(key) ?? {
      name: String(s.name),
      reddit_username: String(s.reddit_username),
      likes: 0,
      comments: 0,
      days: 0,
    };
    entry.likes += Number(s.likes);
    entry.comments += Number(s.comments);
    entry.days += 1;
    byName.set(key, entry);
  }
  const entries = [...byName.values()];
  const top = (field: "likes" | "comments" | "days"): LeaderboardEntry[] =>
    entries
      .map((e) => ({ name: e.name, reddit_username: e.reddit_username, value: e[field] }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);

  // Daily chart: last 30 days
  const daily: DailyPoint[] = [];
  for (let i = 29; i >= 0; i--) {
    const date = daysAgoIST(i);
    daily.push({ date, reports: 0, likes: 0, comments: 0 });
  }
  const dailyMap = new Map(daily.map((d) => [d.date, d]));
  for (const s of allSubmissions) {
    const point = dailyMap.get(String(s.date));
    if (point) {
      point.reports += 1;
      point.likes += Number(s.likes);
      point.comments += Number(s.comments);
    }
  }

  // Weekly aggregates: last 4 ISO-ish weeks (rolling 7-day buckets ending today)
  const weekly: WeeklyPoint[] = [];
  for (let w = 3; w >= 0; w--) {
    const start = daysAgoIST(w * 7 + 6);
    const end = daysAgoIST(w * 7);
    const inWeek = allSubmissions.filter(
      (s) => String(s.date) >= start && String(s.date) <= end
    );
    const n = inWeek.length;
    weekly.push({
      week: `${start.slice(5)} to ${end.slice(5)}`,
      participation: totalEmployees
        ? Math.round((n / (totalEmployees * 7)) * 100)
        : 0,
      avgLikes: n ? Math.round(inWeek.reduce((s, r) => s + Number(r.likes), 0) / n) : 0,
      avgComments: n
        ? Math.round(inWeek.reduce((s, r) => s + Number(r.comments), 0) / n)
        : 0,
      avgTime: n
        ? Math.round(inWeek.reduce((s, r) => s + Number(r.time_spent), 0) / n)
        : 0,
    });
  }

  const analytics: Analytics = {
    kpis: {
      totalEmployees,
      submittedToday,
      pendingToday: Math.max(0, totalEmployees - submittedToday),
      participationRate: totalEmployees
        ? Math.round((submittedToday / totalEmployees) * 100)
        : 0,
      likesToday: todaySubmissions.reduce((s, r) => s + Number(r.likes), 0),
      commentsToday: todaySubmissions.reduce((s, r) => s + Number(r.comments), 0),
      activeCommunities: communitiesToday.size,
    },
    heatmap,
    todaySubmissions,
    leaderboard: {
      topLikes: top("likes"),
      topComments: top("comments"),
      topParticipants: top("days"),
    },
    daily,
    weekly,
  };

  return Response.json(analytics);
}
