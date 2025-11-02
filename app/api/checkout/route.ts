import Stripe from 'stripe';
import { NextResponse } from 'next/server';

// ✅ Ensure this runs on the Node.js runtime, not Edge
export const runtime = 'nodejs';

type LineItem = {
  price_data: {
    currency: 'usd';
    product_data: { name: string; images?: string[] };
    unit_amount: number; // cents, integer
  };
  quantity: number;
};

export async function POST(req: Request) {
  try {
    // 1) Env guard
    const secret = process.env.STRIPE_SECRET_KEY;
    if (!secret) {
      console.error('[checkout] Missing STRIPE_SECRET_KEY');
      return NextResponse.json({ error: 'Missing STRIPE_SECRET_KEY' }, { status: 500 });
    }

    // 2) Parse & validate body
    const body = (await req.json()) as { line_items?: LineItem[] };
    if (!body?.line_items || !Array.isArray(body.line_items) || body.line_items.length === 0) {
      console.error('[checkout] Invalid body:', body);
      return NextResponse.json({ error: 'Invalid body: line_items[] required' }, { status: 400 });
    }

    // Validate each item (unit_amount must be integer)
    for (const li of body.line_items) {
      if (
        !li?.price_data?.product_data?.name ||
        typeof li.price_data.unit_amount !== 'number' ||
        !Number.isInteger(li.price_data.unit_amount) ||
        li.price_data.unit_amount <= 0 ||
        typeof li.quantity !== 'number' ||
        li.quantity <= 0
      ) {
        console.error('[checkout] Bad line item:', li);
        return NextResponse.json({ error: 'Invalid line item' }, { status: 400 });
      }
    }

    // 3) Figure out correct origin (localhost in dev)
    const reqOrigin = req.headers.get('origin') ?? new URL(req.url).origin;
    const origin = process.env.NEXT_PUBLIC_SITE_URL || reqOrigin;

    // 4) Stripe client
    const stripe = new Stripe(secret, { apiVersion: '2023-10-16' });
    // 5) Create checkout session
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: body.line_items,
      success_url: `${origin}/success`,
      cancel_url: `${origin}/cancel`,
      shipping_address_collection: { allowed_countries: ['US'] },
      shipping_options: [
        {
          shipping_rate_data: {
            type: 'fixed_amount',
            fixed_amount: { amount: 599, currency: 'usd' },
            display_name: 'Standard (3–5 days)',
          },
        },
        {
          shipping_rate_data: {
            type: 'fixed_amount',
            fixed_amount: { amount: 0, currency: 'usd' },
            display_name: 'Free $35+ (Auto at Checkout)',
          },
        },
      ],
    });

    return NextResponse.json({ id: session.id, url: session.url });
  } catch (e: any) {
    // Surface the actual error to your terminal and to the client
    console.error('[checkout] Server error:', e?.raw ?? e);
    return NextResponse.json(
      { error: e?.message || e?.raw?.message || 'Server error' },
      { status: 500 }
    );
  }
}