import { getDb, todayIST } from "@/lib/db";
import { getAppToken, fetchUserDay } from "@/lib/reddit";
import { ingestMetrics, type IncomingMetric } from "@/lib/ingest";

// Allow either the Vercel Cron secret or the shared ingest token, so it can
// also be triggered manually with the same token the scraper uses.
function authorized(request: Request): boolean {
  const header = request.headers.get("authorization") ?? "";
  const bearer = header.replace(/^Bearer\s+/i, "");
  const cron = process.env.CRON_SECRET;
  const ingest = process.env.INGEST_TOKEN;
  if (cron && bearer === cron) return true;
  if (ingest && bearer === ingest) return true;
  return false;
}

async function run(): Promise<Response> {
  const db = await getDb();
  const date = todayIST();

  const res = await db.execute(
    "SELECT name, reddit_username FROM employees WHERE reddit_username != ''"
  );

  let token: string;
  try {
    token = await getAppToken();
  } catch (err) {
    return Response.json(
      { ok: false, error: err instanceof Error ? err.message : "token error" },
      { status: 500 }
    );
  }

  const metrics: IncomingMetric[] = [];
  const failures: string[] = [];

  for (const row of res.rows) {
    const handle = String(row.reddit_username);
    try {
      const day = await fetchUserDay(handle, token, date);
      metrics.push({ platform: "reddit", handle, ...day });
    } catch (err) {
      failures.push(`${handle}: ${err instanceof Error ? err.message : "error"}`);
    }
  }

  const result = await ingestMetrics(db, metrics, "api", date);
  return Response.json({ ok: true, date, ...result, failures });
}

export async function GET(request: Request) {
  if (!authorized(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  return run();
}

export async function POST(request: Request) {
  if (!authorized(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  return run();
}
