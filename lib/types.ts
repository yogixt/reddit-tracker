import type { Platform } from "./platforms";

export interface Employee {
  id: number;
  name: string;
  reddit_username: string;
  quora_username: string;
  linkedin_url: string;
  added_at: string;
}

export interface Submission {
  id: number;
  name: string;
  platform: Platform;
  handle: string;
  date: string;
  time_spent: number;
  likes: number;
  comments: number;
  posts: number;
  communities: string;
  /** "manual" (self-report) | "api" (reddit) | "scraper" (quora/linkedin) */
  source: string;
  /** optional proof-of-work screenshot (Vercel Blob URL) */
  screenshot_url: string;
  submitted_at: string;
}

export interface EmployeeStats {
  streak: number;
  totalLikes: number;
  totalComments: number;
  reportsDone: number;
  submittedToday: boolean;
  todaySubmission: Submission | null;
}

export interface Kpis {
  totalEmployees: number;
  submittedToday: number;
  pendingToday: number;
  participationRate: number;
  likesToday: number;
  commentsToday: number;
  activeCommunities: number;
}

/** Per-platform totals for a given day (or all-time) */
export interface PlatformBreakdown {
  platform: Platform;
  reports: number;
  likes: number;
  comments: number;
  posts: number;
}

export interface HeatmapEntry {
  name: string;
  reddit_username: string;
  submittedToday: boolean;
  /** which platforms were logged today */
  platformsToday: Platform[];
}

export interface LeaderboardEntry {
  name: string;
  reddit_username: string;
  value: number;
}

export interface DailyPoint {
  date: string;
  reports: number;
  likes: number;
  comments: number;
}

export interface WeeklyPoint {
  week: string;
  participation: number;
  avgLikes: number;
  avgComments: number;
  avgTime: number;
}

export type WarningType =
  | "missed_today"
  | "missed_yesterday"
  | "no_activity_7d"
  | "low_attendance"
  | "streak_broken";

export interface EmployeePerformance {
  name: string;
  reddit_username: string;
  currentStreak: number;
  bestStreak: number;
  last7Days: boolean[];
  last30DaysCount: number;
  attendanceRate: number;
  totalReports: number;
  totalLikes: number;
  totalComments: number;
  avgLikes: number;
  avgComments: number;
  avgTime: number;
  score: number;
  warnings: WarningType[];
  submittedToday: boolean;
  todaySubmission: Submission | null;
}

export interface Analytics {
  kpis: Kpis;
  platformsToday: PlatformBreakdown[];
  platformsAllTime: PlatformBreakdown[];
  heatmap: HeatmapEntry[];
  todaySubmissions: Submission[];
  leaderboard: {
    topLikes: LeaderboardEntry[];
    topComments: LeaderboardEntry[];
    topParticipants: LeaderboardEntry[];
  };
  daily: DailyPoint[];
  weekly: WeeklyPoint[];
  performance: EmployeePerformance[];
  onFire: EmployeePerformance[];
  needsAttention: EmployeePerformance[];
  topPerformers: EmployeePerformance[];
  last7DayLabels: string[];
}
