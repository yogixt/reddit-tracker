import { getDb } from "@/lib/db";

export async function GET() {
  const db = await getDb();
  const result = await db.execute(
    "SELECT id, name, phone, apikey, added_at FROM recipients ORDER BY name"
  );
  return Response.json({ recipients: result.rows });
}

export async function POST(request: Request) {
  const body = await request.json();
  const name = String(body.name ?? "").trim();
  const phone = String(body.phone ?? "").trim();
  const apikey = String(body.apikey ?? "").trim();

  if (!name || !phone || !apikey) {
    return Response.json(
      { error: "Name, phone and API key are required" },
      { status: 400 }
    );
  }

  const db = await getDb();
  try {
    await db.execute({
      sql: "INSERT INTO recipients (name, phone, apikey, added_at) VALUES (?, ?, ?, ?)",
      args: [name, phone, apikey, new Date().toISOString()],
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    if (message.includes("UNIQUE")) {
      return Response.json(
        { error: "A recipient with this phone already exists" },
        { status: 409 }
      );
    }
    throw err;
  }

  return Response.json({ ok: true }, { status: 201 });
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return Response.json({ error: "ID required" }, { status: 400 });
  }

  const db = await getDb();
  await db.execute({
    sql: "DELETE FROM recipients WHERE id = ?",
    args: [Number(id)],
  });

  return Response.json({ ok: true });
}
