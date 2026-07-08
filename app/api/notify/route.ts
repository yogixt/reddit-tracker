import { getDb, todayIST } from "@/lib/db";
import { sendWhatsApp } from "@/lib/whatsapp";
import type { Employee, Submission } from "@/lib/types";

export async function POST() {
  const db = await getDb();
  const today = todayIST();

  const [employeesRes, todayRes, recipientsRes] = await Promise.all([
    db.execute("SELECT * FROM employees ORDER BY name"),
    db.execute({
      sql: "SELECT * FROM submissions WHERE date = ? ORDER BY name",
      args: [today],
    }),
    db.execute("SELECT phone, apikey FROM recipients ORDER BY name"),
  ]);

  const employees = employeesRes.rows as unknown as Employee[];
  const todaySubmissions = todayRes.rows as unknown as Submission[];
  const recipients = recipientsRes.rows as unknown as { phone: string; apikey: string }[];

  const submittedNames = new Set(
    todaySubmissions.map((s) => String(s.name).toLowerCase())
  );

  const missing = employees.filter(
    (e) => !submittedNames.has(String(e.name).toLowerCase())
  );

  const submittedCount = todaySubmissions.length;
  const totalCount = employees.length;
  const missingCount = missing.length;

  if (missingCount === 0) {
    return Response.json({
      ok: true,
      sent: false,
      message: "Everyone submitted today. No alert needed.",
    });
  }

  // Fallback to env vars if no recipients in DB
  if (recipients.length === 0) {
    const envPhone = process.env.WHATSAPP_PHONE;
    const envKey = process.env.WHATSAPP_APIKEY;
    if (envPhone && envKey) {
      recipients.push({ phone: envPhone, apikey: envKey });
    }
  }

  if (recipients.length === 0) {
    return Response.json({
      ok: true,
      sent: false,
      message: "No recipients configured. Add people in Notifications page.",
    });
  }

  // Build WhatsApp message
  const dateStr = new Date().toLocaleDateString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "numeric",
    month: "short",
  });

  const lines: string[] = [
    `🚨 *Reddit Tracker — ${dateStr}*`,
    ``,
    `📊 ${submittedCount}/${totalCount} submitted · ${missingCount} missing`,
    ``,
    `❌ *Missing today:*`,
  ];

  for (const emp of missing) {
    lines.push(`• ${emp.name}`);
  }

  lines.push(``);
  lines.push(`👀 Dashboard: https://reddit-tracker-beta.vercel.app/admin/dashboard`);

  const message = lines.join("\n");

  // Send to all recipients
  const results: { phone: string; ok: boolean; error?: string }[] = [];
  for (const r of recipients) {
    try {
      await sendWhatsAppTo(r.phone, r.apikey, message);
      results.push({ phone: r.phone, ok: true });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed";
      results.push({ phone: r.phone, ok: false, error: msg });
    }
  }

  const failed = results.filter((r) => !r.ok);
  if (failed.length === results.length) {
    return Response.json(
      {
        ok: false,
        error: `All ${results.length} message(s) failed. Check API keys.`,
        details: failed,
      },
      { status: 502 }
    );
  }

  return Response.json({
    ok: true,
    sent: true,
    sentTo: results.filter((r) => r.ok).length,
    failed: failed.length,
    message: `Alert sent to ${results.filter((r) => r.ok).length} recipient(s).`,
  });
}

async function sendWhatsAppTo(phone: string, apikey: string, text: string) {
  const url = new URL("https://api.callmebot.com/whatsapp.php");
  url.searchParams.set("phone", phone);
  url.searchParams.set("text", text);
  url.searchParams.set("apikey", apikey);

  const res = await fetch(url.toString(), { method: "GET" });
  const body = await res.text();

  if (!res.ok || body.toLowerCase().includes("error")) {
    throw new Error(body);
  }
}
