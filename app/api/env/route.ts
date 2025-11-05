import { NextResponse } from "next/server";

export async function GET() {
  const key = process.env.STRIPE_SECRET_KEY ?? "";
  const hasStripeKey = key.length > 0;

  const hasKvUrl =
    !!process.env.UPSTASH_REDIS_REST_URL ||
    !!process.env.REDIS_URL ||
    !!process.env.KV_URL;

  return NextResponse.json({
    hasStripeKey,
    stripeKeyPrefix: key.slice(0, 7),
    stripeKeyLen: key.length,
    site: process.env.NEXT_PUBLIC_SITE_URL ?? "",
    hasKvUrl,
  });
}
