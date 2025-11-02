import { NextResponse } from 'next/server';
import { writeFile, mkdir, stat } from 'fs/promises';
import path from 'path';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    // Only allow in dev for now (safety). Remove this check if you really want it in prod (not recommended on Vercel).
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Uploads are disabled in production.' }, { status: 403 });
    }

    const form = await req.formData();
    const file = form.get('file') as File | null;
    if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 });

    const bytes = Buffer.from(await file.arrayBuffer());
    const safeBase = path
      .basename(file.name)
      .replace(/[^a-z0-9._-]+/gi, '-')
      .toLowerCase();

    const stamp = Date.now();
    const filename = `${stamp}-${safeBase}`;
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');

    // ensure folder exists
    try { await stat(uploadsDir); } catch { await mkdir(uploadsDir, { recursive: true }); }

    const filepath = path.join(uploadsDir, filename);
    await writeFile(filepath, bytes);

    const url = `/uploads/${filename}`;
    return NextResponse.json({ url });
  } catch (e: any) {
    console.error('[upload] error:', e);
    return NextResponse.json({ error: e?.message || 'Upload failed' }, { status: 500 });
  }
}