import { getDb } from "@/lib/db";

export async function POST(request: Request) {
  const body = await request.json();
  const name = String(body.name ?? "").trim();

  if (!name) {
    return Response.json({ error: "Name is required" }, { status: 400 });
  }

  const db = await getDb();
  const result = await db.execute({
    sql: "SELECT name, reddit_username FROM employees WHERE name = ?",
    args: [name],
  });

  if (result.rows.length > 0) {
    const row = result.rows[0];
    return Response.json({
      ok: true,
      created: false,
      name: String(row.name),
      redditUsername: String(row.reddit_username ?? ""),
    });
  }

  // First login: register the employee. Platform handles are added later by
  // an admin on the Employees page (or the person can still log manually).
  // Insert explicit empty handles — on DBs migrated from the old schema the
  // handle columns are NOT NULL without a default.
  await db.execute({
    sql: `INSERT INTO employees (name, reddit_username, quora_username, linkedin_url, added_at)
          VALUES (?, '', '', '', ?)`,
    args: [name, new Date().toISOString()],
  });

  return Response.json({ ok: true, created: true, name, redditUsername: "" });
}
