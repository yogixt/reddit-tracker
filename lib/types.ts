export interface Employee {
  id: number;
  name: string;
  reddit_username: string;
  added_at: string;
}

export interface Submission {
  id: number;
  name: string;
  reddit_username: string;
  date: string;
  time_spent: number;
  likes: number;
  comments: number;
  communities: string;
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

export interface HeatmapEntry {
  name: string;
  reddit_username: string;
  submittedToday: boolean;
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

export interface Analytics {
  kpis: Kpis;
  heatmap: HeatmapEntry[];
  todaySubmissions: Submission[];
  leaderboard: {
    topLikes: LeaderboardEntry[];
    topComments: LeaderboardEntry[];
    topParticipants: LeaderboardEntry[];
  };
  daily: DailyPoint[];
  weekly: WeeklyPoint[];
}
