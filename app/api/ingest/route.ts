import { getDb } from "@/lib/db";
import { ingestMetrics, type IncomingMetric } from "@/lib/ingest";

function authorized(request: Request): boolean {
  const token = process.env.INGEST_TOKEN;
  if (!token) return false; // fail closed if unconfigured
  const header = request.headers.get("authorization") ?? "";
  const bearer = header.replace(/^Bearer\s+/i, "");
  return bearer === token;
}

// Accept scraped metrics from the external worker (Quora / LinkedIn).
export async function POST(request: Request) {
  if (!authorized(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { date?: string; metrics?: IncomingMetric[] };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!Array.isArray(body.metrics)) {
    return Response.json({ error: "metrics[] required" }, { status: 400 });
  }

  const db = await getDb();
  const result = await ingestMetrics(db, body.metrics, "scraper", body.date);
  return Response.json({ ok: true, ...result });
}
