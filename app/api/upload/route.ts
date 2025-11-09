// app/api/upload/route.ts
import { NextResponse } from "next/server";
import path from "node:path";
import { writeFile, mkdir } from "node:fs/promises";

export const runtime = "nodejs";          // ensure Node (not edge)
export const dynamic = "force-dynamic";   // we write to /public

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ ok: false, error: "No file" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();            // Web API ArrayBuffer
    const uint8 = new Uint8Array(bytes);               // <- TS-friendly for writeFile

    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadsDir, { recursive: true });

    const safeName = file.name.replace(/[^a-z0-9.\-_]/gi, "_");
    const filename = `${Date.now()}_${safeName}`;
    const filepath = path.join(uploadsDir, filename);

    await writeFile(filepath, uint8);

    const url = `/uploads/${filename}`;
    return NextResponse.json({ ok: true, url });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message ?? "Upload failed" }, { status: 500 });
  }
}
