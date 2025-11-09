// app/api/checkout/route.ts
import { NextResponse } from "next/server";
import Stripe from "stripe";

export const runtime = "nodejs";          // Stripe needs Node runtime (not edge)
export const dynamic = "force-dynamic";   // avoid static caching of this route

const STRIPE_KEY = process.env.STRIPE_SECRET_KEY ?? "";
const stripe = new Stripe(STRIPE_KEY);    // Don’t pass apiVersion to avoid TS union mismatch errors

type PriceItem = { priceId: string; quantity?: number };
type CustomItem = {
  name: string;
  unit_amount: number;   // dollars or cents; we’ll normalize
  quantity?: number;
  image?: string;
};
type Incoming = { items?: Array<PriceItem | CustomItem> } | Array<PriceItem | CustomItem>;

// Normalize to absolute site URL for success/cancel
function absoluteUrl(req: Request, path: string) {
  const incoming = new URL(req.url);
  const base = process.env.NEXT_PUBLIC_SITE_URL || `${incoming.protocol}//${incoming.host}`;
  return `${base}${path}`;
}

// Turn dollars into cents if needed (tolerant to already-in-cents)
const toCents = (n: number) => {
  // Heuristic: if it’s already big (>= 1000), assume cents; otherwise dollars.
  return n >= 1000 ? Math.round(n) : Math.round(n * 100);
};

export async function POST(req: Request) {
  try {
    if (!STRIPE_KEY) {
      return NextResponse.json({ error: "Missing STRIPE_SECRET_KEY" }, { status: 500 });
    }

    const body = (await req.json().catch(() => null)) as Incoming | null;
    const items = Array.isArray(body) ? body : body?.items;
    if (!items?.length) {
      return NextResponse.json({ error: "No line items provided" }, { status: 400 });
    }

    const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = items.map((it) => {
      if ("priceId" in it && it.priceId) {
        return { price: it.priceId, quantity: Math.max(1, it.quantity ?? 1) };
      }
      // Custom ad-hoc product (name/price/image)
      const qty = Math.max(1, (it as CustomItem).quantity ?? 1);
      const name = (it as CustomItem).name;
      const unit_amount = toCents((it as CustomItem).unit_amount);
      const image = (it as CustomItem).image;

      if (!name || !Number.isFinite(unit_amount) || unit_amount <= 0) {
        throw new Error("Invalid custom item: requires name and positive unit_amount");
      }

      return {
        quantity: qty,
        price_data: {
          currency: "usd",
          unit_amount,
          product_data: {
            name,
            images: image ? [image] : undefined,
          },
        },
      };
    });

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items,
      success_url: absoluteUrl(req, "/success"),
      cancel_url: absoluteUrl(req, "/cancel"),
      shipping_address_collection: { allowed_countries: ["US", "CA"] },
    });

    return NextResponse.json({ url: session.url }, { status: 200 });
  } catch (err: any) {
    console.error("checkout error:", err);
    return NextResponse.json(
      { error: err?.message ?? "Checkout failed" },
      { status: 500 }
    );
  }
}
