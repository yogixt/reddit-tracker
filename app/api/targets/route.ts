import { getDb } from "@/lib/db";

// The scraper worker calls this to learn which profiles to scrape.
// Auth via ?token= (GitHub Actions can't easily send Authorization for a GET fetch chain).
export async function GET(request: Request) {
  const token = process.env.INGEST_TOKEN;
  const { searchParams } = new URL(request.url);
  if (!token || searchParams.get("token") !== token) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = await getDb();
  const res = await db.execute(
    "SELECT quora_username, linkedin_url FROM employees"
  );

  const targets: { platform: string; handle: string }[] = [];
  for (const row of res.rows) {
    const q = String(row.quora_username ?? "").trim();
    const l = String(row.linkedin_url ?? "").trim();
    if (q) targets.push({ platform: "quora", handle: q });
    if (l) targets.push({ platform: "linkedin", handle: l });
  }

  return Response.json({ targets });
}
