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

  if (result.rows.length === 0) {
    return Response.json(
      { error: "Name not found. Ask your admin to add you." },
      { status: 401 }
    );
  }

  const row = result.rows[0];
  return Response.json({
    ok: true,
    name: String(row.name),
    redditUsername: String(row.reddit_username),
  });
}
