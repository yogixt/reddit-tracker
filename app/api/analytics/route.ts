import { getDb, todayIST, daysAgoIST } from "@/lib/db";
import { PLATFORMS, type Platform } from "@/lib/platforms";
import type {
  Analytics,
  DailyPoint,
  Employee,
  EmployeePerformance,
  LeaderboardEntry,
  PlatformBreakdown,
  Submission,
  WarningType,
  WeeklyPoint,
} from "@/lib/types";

function computeStreak(dates: Set<string>): number {
  const today = todayIST();
  let start = 0;
  if (!dates.has(today)) start = 1;
  let streak = 0;
  for (let i = start; ; i++) {
    if (dates.has(daysAgoIST(i))) streak++;
    else break;
  }
  return streak;
}

function computeBestStreak(dates: string[]): number {
  if (dates.length === 0) return 0;
  const sorted = [...new Set(dates)].sort();
  let best = 1;
  let current = 1;
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1]);
    const curr = new Date(sorted[i]);
    const diff = (curr.getTime() - prev.getTime()) / 86400000;
    if (diff === 1) {
      current++;
      best = Math.max(best, current);
    } else {
      current = 1;
    }
  }
  return best;
}

function buildPerformance(
  emp: Employee,
  allSubs: Submission[],
  today: string
): EmployeePerformance {
  const empSubs = allSubs.filter(
    (s) => String(s.name).toLowerCase() === emp.name.toLowerCase()
  );
  const dates = empSubs.map((s) => String(s.date));
  const dateSet = new Set(dates);
  const todaySub = empSubs.find((s) => s.date === today) ?? null;

  const currentStreak = computeStreak(dateSet);
  const bestStreak = computeBestStreak(dates);

  const last7Days: boolean[] = [];
  for (let i = 0; i < 7; i++) {
    last7Days.push(dateSet.has(daysAgoIST(i)));
  }

  let last30DaysCount = 0;
  for (let i = 0; i < 30; i++) {
    if (dateSet.has(daysAgoIST(i))) last30DaysCount++;
  }
  const attendanceRate = last30DaysCount / 30;

  // Reports = distinct active days (participation), not platform-row count
  const totalReports = dateSet.size;
  const totalLikes = empSubs.reduce((s, r) => s + Number(r.likes), 0);
  const totalComments = empSubs.reduce((s, r) => s + Number(r.comments), 0);
  const avgLikes = totalReports ? Math.round(totalLikes / totalReports) : 0;
  const avgComments = totalReports
    ? Math.round(totalComments / totalReports)
    : 0;
  const timeRows = empSubs.filter((r) => Number(r.time_spent) > 0);
  const avgTime = timeRows.length
    ? Math.round(
        timeRows.reduce((s, r) => s + Number(r.time_spent), 0) / timeRows.length
      )
    : 0;

  const score = Math.round(
    attendanceRate * 40 +
      Math.min(avgLikes / 20, 1) * 25 +
      Math.min(avgComments / 10, 1) * 20 +
      Math.min(currentStreak / 7, 1) * 15
  );

  const warnings: WarningType[] = [];
  const submittedToday = todaySub !== null;
  const yesterday = daysAgoIST(1);
  const submittedYesterday = dateSet.has(yesterday);

  if (!submittedToday) warnings.push("missed_today");
  if (!submittedToday && !submittedYesterday) warnings.push("missed_yesterday");
  if (last7Days.every((v) => !v)) warnings.push("no_activity_7d");
  if (attendanceRate < 0.5 && totalReports > 0) warnings.push("low_attendance");
  if (currentStreak === 0 && totalReports > 0 && dateSet.has(daysAgoIST(2))) {
    warnings.push("streak_broken");
  }

  return {
    name: emp.name,
    reddit_username: emp.reddit_username,
    currentStreak,
    bestStreak,
    last7Days,
    last30DaysCount,
    attendanceRate,
    totalReports,
    totalLikes,
    totalComments,
    avgLikes,
    avgComments,
    avgTime,
    score,
    warnings,
    submittedToday,
    todaySubmission: todaySub,
  };
}

function breakdown(subs: Submission[]): PlatformBreakdown[] {
  const map = new Map<Platform, PlatformBreakdown>();
  for (const p of PLATFORMS) {
    map.set(p, { platform: p, reports: 0, likes: 0, comments: 0, posts: 0 });
  }
  for (const s of subs) {
    const b = map.get(s.platform as Platform);
    if (!b) continue;
    b.reports += 1;
    b.likes += Number(s.likes);
    b.comments += Number(s.comments);
    b.posts += Number(s.posts);
  }
  return [...map.values()];
}

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

  // Distinct people who logged anything today
  const submittedNames = new Set(
    todaySubmissions.map((s) => String(s.name).toLowerCase())
  );

  // Per-employee platforms logged today
  const platformsByName = new Map<string, Set<Platform>>();
  for (const s of todaySubmissions) {
    const key = String(s.name).toLowerCase();
    if (!platformsByName.has(key)) platformsByName.set(key, new Set());
    platformsByName.get(key)!.add(s.platform as Platform);
  }

  const communitiesToday = new Set<string>();
  for (const s of todaySubmissions) {
    for (const c of String(s.communities).split(/[,;]+/)) {
      const t = c.trim().toLowerCase();
      if (t) communitiesToday.add(t);
    }
  }

  const totalEmployees = employees.length;
  const submittedToday = submittedNames.size;

  const heatmap = employees.map((e) => ({
    name: e.name,
    reddit_username: e.reddit_username,
    submittedToday: submittedNames.has(String(e.name).toLowerCase()),
    platformsToday: [
      ...(platformsByName.get(String(e.name).toLowerCase()) ?? new Set<Platform>()),
    ],
  }));

  const performance = employees.map((e) =>
    buildPerformance(e, allSubmissions, today)
  );

  const onFire = performance
    .filter((p) => p.currentStreak >= 3)
    .sort((a, b) => b.currentStreak - a.currentStreak);

  const needsAttention = performance
    .filter((p) => p.warnings.length > 0)
    .sort((a, b) => b.warnings.length - a.warnings.length || a.score - b.score);

  const topPerformers = [...performance]
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  // Leaderboard (all-time, summed across platforms)
  const redditByName = new Map(
    employees.map((e) => [e.name.toLowerCase(), e.reddit_username])
  );
  const byName = new Map<
    string,
    { name: string; reddit_username: string; likes: number; comments: number; days: Set<string> }
  >();
  for (const s of allSubmissions) {
    const key = String(s.name).toLowerCase();
    const entry = byName.get(key) ?? {
      name: String(s.name),
      reddit_username: redditByName.get(key) ?? "",
      likes: 0,
      comments: 0,
      days: new Set<string>(),
    };
    entry.likes += Number(s.likes);
    entry.comments += Number(s.comments);
    entry.days.add(String(s.date));
    byName.set(key, entry);
  }
  const entries = [...byName.values()];
  const top = (field: "likes" | "comments" | "days"): LeaderboardEntry[] =>
    entries
      .map((e) => ({
        name: e.name,
        reddit_username: e.reddit_username,
        value: field === "days" ? e.days.size : e[field],
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);

  // Daily chart: last 30 days (reports = distinct people active that day)
  const daily: DailyPoint[] = [];
  for (let i = 29; i >= 0; i--) {
    daily.push({ date: daysAgoIST(i), reports: 0, likes: 0, comments: 0 });
  }
  const dailyMap = new Map(daily.map((d) => [d.date, d]));
  const dailyPeople = new Map<string, Set<string>>();
  for (const s of allSubmissions) {
    const point = dailyMap.get(String(s.date));
    if (point) {
      point.likes += Number(s.likes);
      point.comments += Number(s.comments);
      const key = String(s.date);
      if (!dailyPeople.has(key)) dailyPeople.set(key, new Set());
      dailyPeople.get(key)!.add(String(s.name).toLowerCase());
    }
  }
  for (const d of daily) d.reports = dailyPeople.get(d.date)?.size ?? 0;

  // Weekly aggregates: rolling 7-day buckets
  const weekly: WeeklyPoint[] = [];
  for (let w = 3; w >= 0; w--) {
    const start = daysAgoIST(w * 7 + 6);
    const end = daysAgoIST(w * 7);
    const inWeek = allSubmissions.filter(
      (s) => String(s.date) >= start && String(s.date) <= end
    );
    const activeDayPeople = new Set(
      inWeek.map((s) => `${s.date}|${String(s.name).toLowerCase()}`)
    );
    const n = inWeek.length;
    const timeRows = inWeek.filter((r) => Number(r.time_spent) > 0);
    weekly.push({
      week: `${start.slice(5)} to ${end.slice(5)}`,
      participation: totalEmployees
        ? Math.round((activeDayPeople.size / (totalEmployees * 7)) * 100)
        : 0,
      avgLikes: n ? Math.round(inWeek.reduce((s, r) => s + Number(r.likes), 0) / n) : 0,
      avgComments: n
        ? Math.round(inWeek.reduce((s, r) => s + Number(r.comments), 0) / n)
        : 0,
      avgTime: timeRows.length
        ? Math.round(
            timeRows.reduce((s, r) => s + Number(r.time_spent), 0) / timeRows.length
          )
        : 0,
    });
  }

  const last7DayLabels: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(Date.now() - i * 86400000);
    const label =
      i === 0
        ? "Today"
        : i === 1
        ? "Yesterday"
        : d.toLocaleDateString("en-US", {
            timeZone: "Asia/Kolkata",
            weekday: "short",
          });
    last7DayLabels.push(label);
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
    platformsToday: breakdown(todaySubmissions),
    platformsAllTime: breakdown(allSubmissions),
    heatmap,
    todaySubmissions,
    leaderboard: {
      topLikes: top("likes"),
      topComments: top("comments"),
      topParticipants: top("days"),
    },
    daily,
    weekly,
    performance,
    onFire,
    needsAttention,
    topPerformers,
    last7DayLabels,
  };

  return Response.json(analytics);
}
