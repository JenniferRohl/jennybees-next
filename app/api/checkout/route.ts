// app/api/checkout/route.ts
import Stripe from "stripe";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STRIPE_KEY = process.env.STRIPE_SECRET_KEY ?? "";
// Use the version bundled with your installed stripe types:
const stripe = new Stripe(STRIPE_KEY, { apiVersion: "2023-10-16" });
// (Alternatively: const stripe = new Stripe(STRIPE_KEY);)

export async function POST(req: Request) {
  try {
    if (!STRIPE_KEY) {
      return NextResponse.json(
        { ok: false, error: "Missing STRIPE_SECRET_KEY" },
        { status: 500 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const items = Array.isArray(body?.items) ? body.items : [];
    if (!items.length) {
      return NextResponse.json({ ok: false, error: "No items provided" }, { status: 400 });
    }

    const site =
      process.env.NEXT_PUBLIC_SITE_URL ||
      `https://${process.env.VERCEL_URL || "jennybeescreation.com"}`;

    const line_items =
      items[0]?.priceId
        ? items.map((it: any) => ({
            price: String(it.priceId),
            quantity: Number(it.quantity || 1),
          }))
        : items.map((it: any) => ({
            price_data: {
              currency: "usd",
              unit_amount: Math.round(Number(it.unit_amount) * 100),
              product_data: { name: String(it.name ?? "Item") },
            },
            quantity: Number(it.quantity || 1),
          }));

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
    console.error("Checkout error:", err?.message, err);
    return NextResponse.json(
      { ok: false, error: err?.message ?? "Checkout failed", type: err?.type, code: err?.code },
      { status: 500 }
    );
  }
}
