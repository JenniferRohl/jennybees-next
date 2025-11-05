// app/api/admin/config/route.ts
import { NextResponse } from "next/server";
import { redis } from "@/lib/redis";

export const runtime = "edge";        // KV works great on edge
export const dynamic = "force-dynamic";

const KEY = "jennybees_config_v6";

export async function GET() {
  try {
    const data = await kv.get(KEY);
    return NextResponse.json({ ok: true, data: data ?? null });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message ?? "KV GET failed" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    await redis.set(KEY, body);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message ?? "KV SET failed" }, { status: 500 });
  }
}
