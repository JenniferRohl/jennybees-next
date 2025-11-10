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
function normalizeSiteUrl(): string {
  // prefer explicit var
  let u = (process.env.NEXT_PUBLIC_SITE_URL || "").trim();
  // if empty, try vercel host
  if (!u) {
    const v = (process.env.VERCEL_URL || "").trim(); // host only on Vercel
    if (v) u = `https://${v}`;
  }
  // final fallback: your domain
  if (!u) u = "https://jennybeescreation.com";

  // ensure protocol and no trailing slash
  if (!/^https?:\/\//i.test(u)) u = `https://${u}`;
  return u.replace(/\/+$/, "");
}

type CustomItem = {
  name: string;
  unit_amount?: number | string; // dollars from UI
  amount?: number | string;      // alt name (dollars)
  price?: number | string;       // alt name (dollars)
  quantity?: number;
  image?: string;
};

type CartItem =
  | { priceId: string; quantity?: number }  // Stripe Price path
  | CustomItem;


function toLineItem(it: CartItem): Stripe.Checkout.SessionCreateParams.LineItem {
  // Price by ID (best)
  if ("priceId" in it && it.priceId) {
    const qty = Math.max(1, Number((it as any).quantity ?? 1));
    return { price: String(it.priceId), quantity: qty };
  }

  // Ad-hoc price (dollars → cents conversion)
  // Ad-hoc price (when no priceId is provided)
const c = it as Extract<CartItem, { name: string }>;

const qty = Math.max(1, Number(c.quantity ?? 1));

// Convert dollars → cents safely
const unit = Math.round(Number(c.unit_amount ?? c.amount ?? c.price ?? 0) * 100);

return {
  price_data: {
    currency: "usd",
    product_data: {
      name: c.name,
      images: c.image ? [c.image] : undefined,
    },
    unit_amount: unit, // 🔥 ALWAYS integer cents
  },
  quantity: qty,
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
