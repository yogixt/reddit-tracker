/**
 * Simple WhatsApp notifications via CallMeBot.
 *
 * Setup:
 * 1. Save +34 605 782 620 to your contacts as "CallMeBot"
 * 2. Open WhatsApp and send "I allow callmebot to send me messages"
 * 3. You'll receive an API key
 * 4. Add to .env.local / Vercel env:
 *    WHATSAPP_PHONE=918xxxxxxxxx   (with country code, no +)
 *    WHATSAPP_APIKEY=xxxxx
 */

export async function sendWhatsApp(text: string): Promise<void> {
  const phone = process.env.WHATSAPP_PHONE;
  const apiKey = process.env.WHATSAPP_APIKEY;

  if (!phone || !apiKey) {
    throw new Error("WhatsApp not configured. Set WHATSAPP_PHONE and WHATSAPP_APIKEY.");
  }

  const url = new URL("https://api.callmebot.com/whatsapp.php");
  url.searchParams.set("phone", phone);
  url.searchParams.set("text", text);
  url.searchParams.set("apikey", apiKey);

  const res = await fetch(url.toString(), { method: "GET" });
  const body = await res.text();

  if (!res.ok || body.toLowerCase().includes("error")) {
    throw new Error(`CallMeBot failed: ${body}`);
  }
}
