// app/api/_env/route.ts
import { NextResponse } from "next/server";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const key = process.env.STRIPE_SECRET_KEY ?? "";
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const kvUrl = process.env.KV_REST_API_URL ?? "";
  return NextResponse.json({
    hasStripeKey: Boolean(key),
    stripeKeyPrefix: key.slice(0, 7), // should be "sk_test" in test mode
    stripeKeyLen: key.length,
    site,
    hasKvUrl: Boolean(kvUrl),
  });
}
