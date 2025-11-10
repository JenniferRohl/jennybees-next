// app/api/checkout/route.ts
import { NextResponse } from "next/server";
import Stripe from "stripe";

export const runtime = "nodejs"; // Stripe needs Node runtime

// --- helpers ---
function siteBase() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
    "https://jennybeescreation.com"
  );
}

type CartItem =
  | { priceId: string; quantity?: number } // use existing Stripe Price
  | {
      name: string;
      unit_amount: number | string; // dollars or cents (we fix below)
      quantity?: number;
      image?: string;
    };

function toLineItem(it: CartItem): Stripe.Checkout.SessionCreateParams.LineItem {
  // Price by ID (best)
  if ("priceId" in it && it.priceId) {
    const qty = Math.max(1, Number((it as any).quantity ?? 1));
    return { price: String(it.priceId), quantity: qty };
  }

  // Ad-hoc price (dollars → cents conversion)
  const c = it as Extract<CartItem, { name: string }>;
  const qty = Math.max(1, Number(c.quantity ?? 1));
  const rawAmount = Number(c.unit_amount);
  const unit_amount =
    rawAmount >= 100 ? Math.round(rawAmount) : Math.round(rawAmount * 100);

  return {
    quantity: qty,
    price_data: {
      currency: "usd",
      unit_amount,
      product_data: {
        name: c.name,
        images: c.image ? [c.image] : undefined,
      },
    },
  };
}

export async function POST(req: Request) {
  try {
    const STRIPE_KEY = process.env.STRIPE_SECRET_KEY;
    if (!STRIPE_KEY) {
      return NextResponse.json(
        { ok: false, error: "Missing STRIPE_SECRET_KEY" },
        { status: 500 }
      );
    }

    const stripe = new Stripe(STRIPE_KEY, { apiVersion: "2023-10-16" });

    const body = (await req.json().catch(() => null)) as { items?: CartItem[] } | null;
    const items: CartItem[] = Array.isArray(body?.items) ? body!.items : [];
    if (!items.length) {
      return NextResponse.json(
        { ok: false, error: "No line items provided" },
        { status: 400 }
      );
    }

    const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] =
      items.map(toLineItem);

    const site = siteBase();

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
    // log full on server, send safe error to client
    console.error("Checkout error:", err?.message, err?.type, err?.code, err);
    return NextResponse.json(
      {
        ok: false,
        error: err?.message || "Checkout failed",
        type: err?.type,
        code: err?.code,
      },
      { status: 400 }
    );
  }
}
