import { getDb } from "@/lib/db";

export async function GET() {
  const db = await getDb();
  const result = await db.execute(
    "SELECT id, name, reddit_username, added_at FROM employees ORDER BY name"
  );
  return Response.json({ employees: result.rows });
}

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

  const normalized = redditUsername.startsWith("u/")
    ? redditUsername
    : `u/${redditUsername}`;

  const db = await getDb();
  try {
    await db.execute({
      sql: "INSERT INTO employees (name, reddit_username, added_at) VALUES (?, ?, ?)",
      args: [name, normalized, new Date().toISOString()],
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    if (message.includes("UNIQUE")) {
      return Response.json(
        { error: "An employee with this name already exists" },
        { status: 409 }
      );
    }
    throw err;
  }

  return Response.json({ ok: true }, { status: 201 });
}
