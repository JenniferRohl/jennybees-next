// app/api/checkout/route.ts
import { NextResponse } from "next/server";
import Stripe from "stripe";

export const runtime = "nodejs";

const STRIPE_KEY = process.env.STRIPE_SECRET_KEY ?? "";
const stripe = new Stripe(STRIPE_KEY, { apiVersion: "2024-06-20" });

type PriceItem = { priceId: string; quantity?: number };
type CustomItem = {
  name: string;
  unit_amount: number; // cents
  quantity?: number;
  image?: string;
};
type Incoming = { items: Array<PriceItem | CustomItem> };

export async function POST(req: Request) {
  try {
    if (!STRIPE_KEY) {
      return NextResponse.json({ error: "Missing STRIPE_SECRET_KEY" }, { status: 500 });
    }

    const body = (await req.json().catch(() => null)) as Incoming | null;
    const items = Array.isArray(body?.items) ? body!.items : [];
    if (!items.length) {
      return NextResponse.json({ error: "No line items provided" }, { status: 400 });
    }

    const site =
      process.env.NEXT_PUBLIC_SITE_URL ||
      `https://${process.env.VERCEL_URL || "jennybeescreation.com"}`;

    // Map incoming to Stripe line_items
    const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = items.map((it: any) => {
      if ("priceId" in it && it.priceId) {
        return { price: String(it.priceId), quantity: Math.max(1, it.quantity ?? 1) };
      }
      // custom ad-hoc
      const qty = Math.max(1, (it as CustomItem).quantity ?? 1);
      const name = (it as CustomItem).name;
      const unit_amount = Number((it as CustomItem).unit_amount);
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
      line_items,
      allow_promotion_codes: true,
      billing_address_collection: "auto",

      // ✨ Collect shipping address in Stripe Checkout
      shipping_address_collection: { allowed_countries: ["US"] },

      // Redirect back to your site after payment
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/thanks`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/cart`,
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
