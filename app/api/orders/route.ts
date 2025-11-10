// app/api/orders/route.ts
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { Resend } from "resend";

export const runtime = "nodejs";

const STRIPE_KEY = process.env.STRIPE_SECRET_KEY ?? "";
const resend = new Resend(process.env.RESEND_API_KEY ?? "");

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const sessionId = String(form.get("sessionId") || "");
    if (!sessionId) return NextResponse.json({ ok: false, error: "Missing sessionId" }, { status: 400 });

    // Shipping fields
    const shipping = {
      name: String(form.get("name") || ""),
      line1: String(form.get("line1") || ""),
      line2: String(form.get("line2") || ""),
      city: String(form.get("city") || ""),
      state: String(form.get("state") || ""),
      postal_code: String(form.get("postal_code") || ""),
      email: String(form.get("email") || ""),
    };

    const stripe = new Stripe(STRIPE_KEY, { apiVersion: "2024-06-20" });
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const items = await stripe.checkout.sessions.listLineItems(sessionId, { limit: 50 });

    // Compose simple html summary
    const listHtml = items.data
      .map((li) => `<li>${li.description} × ${li.quantity} — $${((li.amount_total ?? 0) / 100).toFixed(2)}</li>`)
      .join("");

    const html = `
      <div style="font-family:system-ui,Segoe UI,Arial,sans-serif">
        <h2>New order (fallback shipping)</h2>
        <p><strong>Session:</strong> ${sessionId}</p>
        <h3>Items</h3>
        <ul>${listHtml}</ul>
        <h3>Total</h3>
        <p>$${(((session.amount_total ?? 0) / 100)).toFixed(2)} ${String(session.currency ?? "usd").toUpperCase()}</p>
        <h3>Shipping</h3>
        <p>
          ${shipping.name}<br/>
          ${shipping.line1}<br/>
          ${shipping.line2 ? shipping.line2 + "<br/>" : ""}
          ${shipping.city}, ${shipping.state} ${shipping.postal_code}<br/>
          ${shipping.email}
        </p>
      </div>
    `;

    // Send to Jen
    const ordersTo = process.env.ORDERS_TO || "jenny@jennybeescreation.com";
    const from = process.env.EMAIL_FROM || "Jenny Bees <noreply@your-domain.com>";

    await resend.emails.send({
      from,
      to: ordersTo,
      subject: "New order – fallback shipping submitted",
      html,
    });

    // Customer confirmation
    if (shipping.email) {
      await resend.emails.send({
        from,
        to: shipping.email,
        subject: "Thanks! We received your shipping details",
        html: `
          <div style="font-family:system-ui,Segoe UI,Arial,sans-serif">
            <p>Thanks for your order — we’ve received your shipping address and will ship within 2–4 business days.</p>
            <p><strong>Order:</strong> ${sessionId}</p>
          </div>
        `,
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("orders POST error:", err?.message, err);
    return NextResponse.json({ ok: false, error: err?.message || "Failed" }, { status: 500 });
  }
}
