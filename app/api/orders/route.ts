// app/api/orders/route.ts
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { Resend } from "resend";

export const runtime = "nodejs";

const STRIPE_KEY   = process.env.STRIPE_SECRET_KEY!;
const resend       = new Resend(process.env.RESEND_API_KEY!);
const TO_EMAIL     = process.env.ORDERS_TO || "jenny@jennybeescreation.com";
const FROM_EMAIL   = process.env.CONTACT_FROM || "Jenny Bee <noreply@jennybeescreation.com>";

type Shipping = {
  name: string;
  email: string;
  phone: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  postal_code: string;
  notes?: string;
};

export async function POST(req: Request) {
  try {
    // Expect JSON from /shipping client: { session_id, shipping }
    const ct = req.headers.get("content-type") || "";
    if (!ct.includes("application/json")) {
      return NextResponse.json(
        { ok: false, error: "Please POST JSON with content-type application/json" },
        { status: 415 }
      );
    }

    const body = (await req.json()) as { session_id?: string; shipping?: Shipping };
    const sessionId = body?.session_id || "";
    const shipping  = body?.shipping as Shipping | undefined;

    if (!sessionId || !shipping) {
      return NextResponse.json(
        { ok: false, error: "Missing session_id or shipping payload" },
        { status: 400 }
      );
    }

    // (Optional) Pull Stripe details for the order summary
    let itemsHtml = "";
    try {
      const stripe = new Stripe(STRIPE_KEY, { apiVersion: "2023-10-16" });
      const items = await stripe.checkout.sessions.listLineItems(sessionId, { limit: 50 });
      if (items?.data?.length) {
        itemsHtml =
          `<table width="100%" cellpadding="6" cellspacing="0" style="border-collapse:collapse;border:1px solid #eee;">
            <thead>
              <tr>
                <th align="left" style="border-bottom:1px solid #eee;">Item</th>
                <th align="center" style="border-bottom:1px solid #eee;">Qty</th>
                <th align="right" style="border-bottom:1px solid #eee;">Total</th>
              </tr>
            </thead>
            <tbody>` +
          items.data
            .map((li) => {
              const desc = li.description ?? "Item";
              const qty = li.quantity ?? 1;
              const total = (li.amount_total ?? 0) / 100;
              return `<tr>
                  <td>${desc}</td>
                  <td align="center">${qty}</td>
                  <td align="right">$${total.toFixed(2)}</td>
                </tr>`;
            })
            .join("") +
          `</tbody></table>`;
      }
    } catch {
      // Stripe fetch is optional; ignore failures
    }

    // -------- Internal email to Jen --------
    const adminHtml = `
      <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;line-height:1.5">
        <h2>New order — ${shipping.name} <small style="color:#888;">(${sessionId})</small></h2>

        <h3 style="margin:16px 0 6px">Shipping To:</h3>
        <p>
          ${shipping.name}<br/>
          ${shipping.address1}${shipping.address2 ? `, ${shipping.address2}` : ""}<br/>
          ${shipping.city}, ${shipping.state} ${shipping.postal_code}<br/>
          <strong>Email:</strong> ${shipping.email}<br/>
          <strong>Phone:</strong> ${shipping.phone}
        </p>

        ${shipping.notes ? `<p><strong>Notes:</strong> ${shipping.notes}</p>` : ""}

        ${itemsHtml || ""}

        <p style="margin-top:20px;color:#666">— Jenny Bees Creation</p>
      </div>
    `;

    const sendAdmin = await resend.emails.send({
      from: FROM_EMAIL,
      to: [TO_EMAIL],
      subject: `New order — ${shipping.name} (${sessionId})`,
      html: adminHtml,
      replyTo: shipping.email || undefined,
    });

    if (sendAdmin?.error) {
      console.error("Resend admin error:", sendAdmin.error);
      return NextResponse.json({ ok: false, error: "Email send failed." }, { status: 502 });
    }

    // -------- Customer confirmation email --------
    const firstName = (shipping.name || "").split(" ")[0] || "there";
    const customerHtml = `
      <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;line-height:1.5;text-align:center;padding:24px">
        <h1 style="margin-bottom:8px">Thanks, ${firstName}! 🐝</h1>
        <p style="margin:0 0 16px">We’ve received your order — Jen is already preparing your candles.</p>
        <p style="margin:0 0 24px;color:#666">We’ll email tracking info as soon as it ships.</p>
        <div style="font-size:14px;color:#666">
          <div><strong>Ship to</strong> ${shipping.name}</div>
          <div>${shipping.address1}${shipping.address2 ? `, ${shipping.address2}` : ""}</div>
          <div>${shipping.city}, ${shipping.state} ${shipping.postal_code}</div>
        </div>
        <p style="margin-top:24px;color:#666">— Jenny Bees Creation</p>
      </div>
    `;

    if (shipping.email) {
      await resend.emails.send({
        from: FROM_EMAIL,
        to: [shipping.email],
        subject: "Thanks! We got your order 🐝",
        html: customerHtml,
      });
      // (Ignore errors here so we don't block the order flow; you can log if desired)
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("orders route error:", err);
    return NextResponse.json(
      { ok: false, error: err?.message || "Server error" },
      { status: 500 }
    );
  }
}
