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
  | { priceId: string; quantity?: number } // pre-created Stripe Prices
  | {
      name: string;
      unit_amount: number | string; // dollars or cents handled below
      quantity?: number;
      image?: string;
    };

function toLineItem(it: CartItem): Stripe.Checkout.SessionCreateParams.LineItem {
  // Price by ID (best)
  if ("priceId" in it && it.priceId) {
    const qty = Math.max(1, Number((it as any).quantity ?? 1));
    return { price: String(it.priceId), quantity: qty };
  }

  // Ad-hoc price
  const c = it as Extract<CartItem, { name: string }>;

  const qty = Math.max(1, Number(c.quantity ?? 1));
  const amountRaw = Number(c.unit_amount);
  // If amount looks like dollars (e.g. 25, 18.99), convert to cents
  const unit_amount =
    amountRaw > 0 && amountRaw < 1000 && !Number.isInteger(amountRaw)
      ? Math.round(amountRaw * 100)
      : Math.round(amountRaw);

  if (!c.name || !Number.isFinite(unit_amount) || unit_amount <= 0) {
    throw new Error("Invalid item: must include name and positive unit_amount");
  }

  const img = c.image && /^https?:\/\//i.test(c.image) ? c.image : undefined;

  return {
    quantity: qty,
    price_data: {
      currency: "usd",
      unit_amount,
      product_data: { name: c.name, images: img ? [img] : undefined },
    },
  };
}

export async function POST(req: Request) {
  const STRIPE_KEY = process.env.STRIPE_SECRET_KEY;
  if (!STRIPE_KEY) {
    console.error("Checkout error: missing STRIPE_SECRET_KEY");
    return NextResponse.json({ ok: false, error: "Server not configured." }, { status: 500 });
  }

  const stripe = new Stripe(STRIPE_KEY, { apiVersion: "2023-10-16" });

  try {
    const body = await req.json().catch(() => ({} as any));
    const rawItems = Array.isArray(body?.items) ? (body.items as CartItem[]) : [];
    if (!rawItems.length) {
      return NextResponse.json({ ok: false, error: "No line items provided" }, { status: 400 });
    }

    const line_items = rawItems.map(toLineItem);

    const site = siteBase();
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items,
      allow_promotion_codes: true,
      billing_address_collection: "auto",
      shipping_address_collection: { allowed_countries: ["US", "CA"] }, // collect shipping at Stripe
      success_url: `${site}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${site}/cancel`,
    });

    return NextResponse.json({ ok: true, url: session.url });
  } catch (err: any) {
    // Emit full detail to logs; return safe message to client
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
