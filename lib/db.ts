import { createClient, type Client } from "@libsql/client";

let client: Client | null = null;
let initialized: Promise<void> | null = null;

function getClient(): Client {
  if (!client) {
    const url = process.env.TURSO_DATABASE_URL ?? "file:local.db";
    const authToken = process.env.TURSO_AUTH_TOKEN;
    client = createClient(authToken ? { url, authToken } : { url });
  }
  return client;
}

async function init(db: Client): Promise<void> {
  await db.batch(
    [
      `CREATE TABLE IF NOT EXISTS employees (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE COLLATE NOCASE,
        reddit_username TEXT NOT NULL,
        added_at TEXT NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS submissions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL COLLATE NOCASE,
        reddit_username TEXT NOT NULL,
        date TEXT NOT NULL,
        time_spent INTEGER NOT NULL,
        likes INTEGER NOT NULL,
        comments INTEGER NOT NULL,
        communities TEXT NOT NULL,
        submitted_at TEXT NOT NULL,
        UNIQUE(name, date)
      )`,
      `CREATE TABLE IF NOT EXISTS admins (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE COLLATE NOCASE,
        password TEXT NOT NULL
      )`,
    ],
    "write"
  );

  // Seed a default admin if none exists (change via ADMIN_NAME / ADMIN_PASSWORD env)
  const admins = await db.execute("SELECT COUNT(*) AS c FROM admins");
  if (Number(admins.rows[0].c) === 0) {
    await db.execute({
      sql: "INSERT INTO admins (name, password) VALUES (?, ?)",
      args: [
        process.env.ADMIN_NAME ?? "Admin",
        process.env.ADMIN_PASSWORD ?? "admin123",
      ],
    });
  }
}

export async function getDb(): Promise<Client> {
  const db = getClient();
  if (!initialized) {
    initialized = init(db).catch((err) => {
      initialized = null;
      throw err;
    });
  }
  await initialized;
  return db;
}

/** Today's date in IST (YYYY-MM-DD) */
export function todayIST(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
  }).format(new Date());
}

/** Date N days before today in IST (YYYY-MM-DD) */
export function daysAgoIST(n: number): string {
  const d = new Date(Date.now() - n * 86400000);
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(d);
}
