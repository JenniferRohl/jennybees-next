// app/api/checkout/route.ts
import Stripe from "stripe";
import { NextResponse } from "next/server";

export const runtime = "nodejs"; // Stripe needs Node runtime (not edge)

type StripeLineItem = Stripe.Checkout.SessionCreateParams.LineItem;

export async function POST(req: Request) {
  try {
    const STRIPE_KEY = process.env.STRIPE_SECRET_KEY ?? "";
    if (!STRIPE_KEY) {
      return NextResponse.json({ ok: false, error: "Missing STRIPE_SECRET_KEY" }, { status: 500 });
    }

    // Use TS api version that satisfies types in Next 16
    const stripe = new Stripe(STRIPE_KEY, { apiVersion: "2023-10-16" });

    // Body can be { items: [...] } or just [...]
    const body = (await req.json().catch(() => null)) as unknown;
    const items: unknown =
      Array.isArray(body) ? body : (body as any)?.items;

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ ok: false, error: "No line items provided" }, { status: 400 });
    }

    // ✅ Pass through exactly what the frontend sent (already Stripe-ready)
    const line_items = items as StripeLineItem[];

    // Build a site URL that works locally and on Vercel
    const site =
      process.env.NEXT_PUBLIC_SITE_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items,
      allow_promotion_codes: true,
      billing_address_collection: "auto",
      success_url: `${site}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${site}/cancel`,
    });

    return NextResponse.json({ ok: true, url: session.url });
  } catch (err: any) {
    console.error("Checkout error:", err?.message || err, err);
    return NextResponse.json(
      {
        ok: false,
        error: err?.message ?? "Checkout failed",
        type: err?.type,
        code: err?.code,
      },
      { status: 400 }
    );
  }
}
