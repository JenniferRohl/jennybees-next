// app/api/admin/config/route.ts
import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";

export const runtime = "edge";
export const dynamic = "force-dynamic";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const KEY = "admin:config";

export async function GET() {
  try {
    const data = await redis.get(KEY);
    return NextResponse.json({ ok: true, data: data ?? null });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message ?? "Redis GET failed" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    await redis.set(KEY, body);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message ?? "Redis SET failed" },
      { status: 500 }
    );
  }
}
