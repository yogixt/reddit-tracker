import { getDb } from "@/lib/db";

function normalizeReddit(v: string): string {
  const t = v.trim().replace(/^\/?u\//i, "");
  return t ? `u/${t}` : "";
}

function normalizeQuora(v: string): string {
  // Accept a full profile URL or a bare handle; store the handle segment.
  const t = v.trim();
  if (!t) return "";
  const m = t.match(/quora\.com\/profile\/([^/?#]+)/i);
  return m ? m[1] : t.replace(/^@/, "");
}

function normalizeLinkedin(v: string): string {
  // Store the full profile URL (that is what the scraper navigates to).
  const t = v.trim();
  if (!t) return "";
  if (/^https?:\/\//i.test(t)) return t;
  const slug = t.replace(/^\/?(in\/)?/i, "");
  return `https://www.linkedin.com/in/${slug}`;
}

export async function GET() {
  const db = await getDb();
  const result = await db.execute(
    "SELECT id, name, reddit_username, quora_username, linkedin_url, added_at FROM employees ORDER BY name"
  );
  return Response.json({ employees: result.rows });
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return Response.json({ error: "ID required" }, { status: 400 });
  }

  const db = await getDb();
  await db.execute({
    sql: "DELETE FROM employees WHERE id = ?",
    args: [Number(id)],
  });

  return Response.json({ ok: true });
}

export async function POST(request: Request) {
  const body = await request.json();
  const name = String(body.name ?? "").trim();
  const reddit = normalizeReddit(String(body.redditUsername ?? ""));
  const quora = normalizeQuora(String(body.quoraUsername ?? ""));
  const linkedin = normalizeLinkedin(String(body.linkedinUrl ?? ""));

  if (!name) {
    return Response.json({ error: "Name is required" }, { status: 400 });
  }
  if (!reddit && !quora && !linkedin) {
    return Response.json(
      { error: "At least one platform handle is required" },
      { status: 400 }
    );
  }

  const db = await getDb();
  try {
    await db.execute({
      sql: `INSERT INTO employees (name, reddit_username, quora_username, linkedin_url, added_at)
            VALUES (?, ?, ?, ?, ?)`,
      args: [name, reddit, quora, linkedin, new Date().toISOString()],
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

export async function PATCH(request: Request) {
  const body = await request.json();
  const id = Number(body.id);
  if (!id) return Response.json({ error: "ID required" }, { status: 400 });

  const reddit = normalizeReddit(String(body.redditUsername ?? ""));
  const quora = normalizeQuora(String(body.quoraUsername ?? ""));
  const linkedin = normalizeLinkedin(String(body.linkedinUrl ?? ""));

  const db = await getDb();
  await db.execute({
    sql: `UPDATE employees
          SET reddit_username = ?, quora_username = ?, linkedin_url = ?
          WHERE id = ?`,
    args: [reddit, quora, linkedin, id],
  });
  return Response.json({ ok: true });
}
