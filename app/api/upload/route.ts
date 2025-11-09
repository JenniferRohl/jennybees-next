// app/api/upload/route.ts
import { NextResponse } from "next/server";
import { put } from "@vercel/blob";

export const runtime = "nodejs"; // required for file I/O

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ ok: false, error: "No file provided" }, { status: 400 });
    }

    // Basic guardrails
    const MAX_MB = 8;
    if (file.size > MAX_MB * 1024 * 1024) {
      return NextResponse.json({ ok: false, error: `File too large (>${MAX_MB}MB)` }, { status: 400 });
    }
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ ok: false, error: "Only images allowed" }, { status: 400 });
    }

    // Nice-ish filename: yyyy/mm/slug-uuid.ext
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const base = file.name.replace(/\.[^.]+$/, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    const fname = `${y}/${m}/${base || "image"}-${crypto.randomUUID()}.${ext}`;

    // Upload public
    const { url } = await put(fname, file, {
      access: "public",
      contentType: file.type || "application/octet-stream",
      addRandomSuffix: false,
    });

    return NextResponse.json({ ok: true, url });
  } catch (err: any) {
    console.error("Upload error:", err);
    return NextResponse.json({ ok: false, error: err?.message || "Upload failed" }, { status: 500 });
  }
}
