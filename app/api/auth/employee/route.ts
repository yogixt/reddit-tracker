import { getDb } from "@/lib/db";

export async function POST(request: Request) {
  const body = await request.json();
  const name = String(body.name ?? "").trim();
  const redditUsername = String(body.redditUsername ?? "").trim();

  if (!name || !redditUsername) {
    return Response.json(
      { error: "Name and Reddit username are required" },
      { status: 400 }
    );
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
      redditUsername: String(row.reddit_username),
    });
  }

  // First login: register the employee automatically
  const normalized = redditUsername.startsWith("u/")
    ? redditUsername
    : `u/${redditUsername}`;
  await db.execute({
    sql: "INSERT INTO employees (name, reddit_username, added_at) VALUES (?, ?, ?)",
    args: [name, normalized, new Date().toISOString()],
  });

  return Response.json({
    ok: true,
    created: true,
    name,
    redditUsername: normalized,
  });
}
