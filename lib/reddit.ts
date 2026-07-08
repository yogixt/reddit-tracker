/**
 * Minimal Reddit read-only client using application-only OAuth
 * (client_credentials) — no Reddit user login required, just an app's
 * client id + secret. Good enough to read public user activity.
 *
 * Caveat: Reddit fuzzes/obscures scores on very fresh items, so same-day
 * "likes" (upvotes) can lag reality. It is still the best automated proxy.
 */

const TOKEN_URL = "https://www.reddit.com/api/v1/access_token";
const API_BASE = "https://oauth.reddit.com";

function userAgent(): string {
  return process.env.REDDIT_USER_AGENT ?? "web:tracker:v1 (by /u/tracker)";
}

export async function getAppToken(): Promise<string> {
  const id = process.env.REDDIT_CLIENT_ID;
  const secret = process.env.REDDIT_CLIENT_SECRET;
  if (!id || !secret) {
    throw new Error("REDDIT_CLIENT_ID / REDDIT_CLIENT_SECRET not set");
  }
  const basic = Buffer.from(`${id}:${secret}`).toString("base64");
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": userAgent(),
    },
    body: "grant_type=client_credentials",
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Reddit token failed: ${res.status} ${await res.text()}`);
  }
  const json = (await res.json()) as { access_token?: string };
  if (!json.access_token) throw new Error("Reddit token missing in response");
  return json.access_token;
}

interface RedditChild {
  kind: string; // t1 = comment, t3 = link/post
  data: {
    created_utc: number;
    score: number;
    subreddit: string;
    num_comments?: number;
  };
}

function istDate(epochSeconds: number): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
  }).format(new Date(epochSeconds * 1000));
}

export interface RedditDayMetric {
  likes: number;
  comments: number;
  posts: number;
  communities: string;
}

/**
 * Aggregate a user's activity for a single IST date from their /overview feed.
 * likes    = summed score across their posts + comments created that day
 * comments = number of comments they authored that day
 * posts    = number of posts they authored that day
 */
export async function fetchUserDay(
  username: string,
  token: string,
  date: string
): Promise<RedditDayMetric> {
  const uname = username.replace(/^\/?u\//i, "").trim();
  const res = await fetch(
    `${API_BASE}/user/${encodeURIComponent(uname)}/overview?limit=100&raw_json=1`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "User-Agent": userAgent(),
      },
      cache: "no-store",
    }
  );
  if (!res.ok) {
    throw new Error(`Reddit overview ${uname}: ${res.status}`);
  }
  const json = (await res.json()) as { data?: { children?: RedditChild[] } };
  const children = json.data?.children ?? [];

  let likes = 0;
  let comments = 0;
  let posts = 0;
  const subs = new Set<string>();

  for (const c of children) {
    if (istDate(c.data.created_utc) !== date) continue;
    likes += Number(c.data.score) || 0;
    if (c.data.subreddit) subs.add(c.data.subreddit.toLowerCase());
    if (c.kind === "t1") comments += 1;
    else if (c.kind === "t3") posts += 1;
  }

  return {
    likes,
    comments,
    posts,
    communities: [...subs].map((s) => `r/${s}`).join(", "),
  };
}
