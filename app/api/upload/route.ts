import { put } from "@vercel/blob";

const MAX_BYTES = 4 * 1024 * 1024; // 4MB — stays under Vercel's request body limit
const ALLOWED = ["image/png", "image/jpeg", "image/webp", "image/gif"];

export async function POST(request: Request) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return Response.json(
      { error: "Screenshot storage is not configured (no Blob store)" },
      { status: 501 }
    );
  }

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return Response.json({ error: "No file provided" }, { status: 400 });
  }
  if (!ALLOWED.includes(file.type)) {
    return Response.json(
      { error: "Only PNG, JPEG, WebP or GIF images are allowed" },
      { status: 400 }
    );
  }
  if (file.size > MAX_BYTES) {
    return Response.json(
      { error: "Image must be under 4MB" },
      { status: 400 }
    );
  }

  const name = String(form.get("name") ?? "anon")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const platform = String(form.get("platform") ?? "misc").replace(/[^a-z]/gi, "");
  const ext = file.type.split("/")[1] ?? "png";
  const key = `screenshots/${name || "anon"}/${platform}-${Date.now()}.${ext}`;

  const blob = await put(key, file, {
    access: "public",
    contentType: file.type,
  });

  return Response.json({ ok: true, url: blob.url });
}
