// app/api/upload/route.ts
import { NextResponse } from "next/server";
import { put } from "@vercel/blob";

export const runtime = "nodejs"; // required for file I/O

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    const filename = String(form.get("filename") || "upload.bin");

    if (!(file instanceof File)) {
      return NextResponse.json({ ok: false, error: "No file provided" }, { status: 400 });
    }

    // Make sure it looks like an image (basic guard)
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ ok: false, error: "Only images allowed" }, { status: 400 });
    }

    // Upload to Vercel Blob — public & cached
    const blob = await put(filename, file, {
      access: "public",
      addRandomSuffix: true,
      contentType: file.type,
      cacheControl: "public, max-age=31536000, immutable",
    });

    return NextResponse.json({ ok: true, url: blob.url });
  } catch (err: any) {
    console.error("Upload failed:", err);
    return NextResponse.json(
      { ok: false, error: err?.message ?? "Upload failed" },
      { status: 500 }
    );
  }
}
