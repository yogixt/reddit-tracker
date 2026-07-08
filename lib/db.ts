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

async function columnNames(db: Client, table: string): Promise<Set<string>> {
  try {
    const info = await db.execute(`PRAGMA table_info(${table})`);
    return new Set(info.rows.map((r) => String(r.name)));
  } catch {
    return new Set();
  }
}

async function tableExists(db: Client, table: string): Promise<boolean> {
  const res = await db.execute({
    sql: "SELECT name FROM sqlite_master WHERE type='table' AND name = ?",
    args: [table],
  });
  return res.rows.length > 0;
}

async function init(db: Client): Promise<void> {
  // Base tables (fresh installs land directly on the platform-aware schema).
  await db.batch(
    [
      `CREATE TABLE IF NOT EXISTS employees (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE COLLATE NOCASE,
        reddit_username TEXT NOT NULL DEFAULT '',
        quora_username TEXT NOT NULL DEFAULT '',
        linkedin_url TEXT NOT NULL DEFAULT '',
        added_at TEXT NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS submissions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL COLLATE NOCASE,
        platform TEXT NOT NULL DEFAULT 'reddit',
        handle TEXT NOT NULL DEFAULT '',
        date TEXT NOT NULL,
        time_spent INTEGER NOT NULL DEFAULT 0,
        likes INTEGER NOT NULL DEFAULT 0,
        comments INTEGER NOT NULL DEFAULT 0,
        posts INTEGER NOT NULL DEFAULT 0,
        communities TEXT NOT NULL DEFAULT '',
        source TEXT NOT NULL DEFAULT 'manual',
        screenshot_url TEXT NOT NULL DEFAULT '',
        submitted_at TEXT NOT NULL,
        UNIQUE(name, platform, date)
      )`,
      `CREATE TABLE IF NOT EXISTS admins (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE COLLATE NOCASE,
        password TEXT NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS recipients (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        phone TEXT NOT NULL UNIQUE,
        apikey TEXT NOT NULL,
        added_at TEXT NOT NULL
      )`,
    ],
    "write"
  );

  // --- Migrate an existing single-platform employees table ---
  const empCols = await columnNames(db, "employees");
  const empAlters: string[] = [];
  if (!empCols.has("quora_username"))
    empAlters.push(
      "ALTER TABLE employees ADD COLUMN quora_username TEXT NOT NULL DEFAULT ''"
    );
  if (!empCols.has("linkedin_url"))
    empAlters.push(
      "ALTER TABLE employees ADD COLUMN linkedin_url TEXT NOT NULL DEFAULT ''"
    );
  if (empAlters.length) await db.batch(empAlters, "write");

  // --- Migrate an existing single-platform submissions table ---
  // Old schema had UNIQUE(name, date) and no `platform` column. Since SQLite
  // can't drop that constraint in place, rebuild the table and backfill old
  // rows as Reddit self-reports.
  const subCols = await columnNames(db, "submissions");
  if ((await tableExists(db, "submissions")) && !subCols.has("platform")) {
    await db.batch(
      [
        `CREATE TABLE submissions_new (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL COLLATE NOCASE,
          platform TEXT NOT NULL DEFAULT 'reddit',
          handle TEXT NOT NULL DEFAULT '',
          date TEXT NOT NULL,
          time_spent INTEGER NOT NULL DEFAULT 0,
          likes INTEGER NOT NULL DEFAULT 0,
          comments INTEGER NOT NULL DEFAULT 0,
          posts INTEGER NOT NULL DEFAULT 0,
          communities TEXT NOT NULL DEFAULT '',
          source TEXT NOT NULL DEFAULT 'manual',
          screenshot_url TEXT NOT NULL DEFAULT '',
          submitted_at TEXT NOT NULL,
          UNIQUE(name, platform, date)
        )`,
        `INSERT INTO submissions_new
          (name, platform, handle, date, time_spent, likes, comments, posts, communities, source, submitted_at)
         SELECT name, 'reddit', reddit_username, date, time_spent, likes, comments, 0, communities, 'manual', submitted_at
         FROM submissions`,
        `DROP TABLE submissions`,
        `ALTER TABLE submissions_new RENAME TO submissions`,
      ],
      "write"
    );
  } else if (subCols.size && !subCols.has("screenshot_url")) {
    // Already platform-aware but predates the screenshot column
    await db.execute(
      "ALTER TABLE submissions ADD COLUMN screenshot_url TEXT NOT NULL DEFAULT ''"
    );
  }

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
