import { getDb } from "@/lib/db";

export async function POST(request: Request) {
  const body = await request.json();
  const name = String(body.name ?? "").trim();
  const password = String(body.password ?? "");

  if (!name || !password) {
    return Response.json(
      { error: "Name and password are required" },
      { status: 400 }
    );
  }

  const db = await getDb();
  const result = await db.execute({
    sql: "SELECT name FROM admins WHERE name = ? AND password = ?",
    args: [name, password],
  });

  if (result.rows.length === 0) {
    return Response.json({ error: "Invalid credentials" }, { status: 401 });
  }

  return Response.json({ ok: true, name: String(result.rows[0].name) });
}
