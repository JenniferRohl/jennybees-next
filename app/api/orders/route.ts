// app/api/orders/route.ts
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { Resend } from "resend";

export const runtime = "nodejs"; // we use Stripe + Resend SDKs

const STRIPE_KEY = process.env.STRIPE_SECRET_KEY!;
const resend = new Resend(process.env.RESEND_API_KEY);
const TO_EMAIL = process.env.ORDERS_TO || "jenny@jennybeescreation.com";
const FROM_EMAIL = process.env.CONTACT_FROM || "Jenny Bees <orders@jennybeescreation.com>";

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
    // 🔹 Require JSON
    const contentType = req.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      return NextResponse.json(
        { ok: false, error: 'Please POST JSON with content-type "application/json".' },
        { status: 415 }
      );
    }

    const body = (await req.json()) as { session_id?: string; shipping?: Shipping };

    const sessionId = body?.session_id || "";
    const shipping = body?.shipping as Shipping | undefined;

    if (!sessionId || !shipping) {
      return NextResponse.json(
        { ok: false, error: "Missing session_id or shipping payload." },
        { status: 400 }
      );
    }

    // 🔹 (Optional) Pull some details from Stripe for the email
    const stripe = new Stripe(STRIPE_KEY, { apiVersion: "2023-10-16" });
    let session: Stripe.Checkout.Session | null = null;
    let items: Stripe.ApiList<Stripe.LineItem> | null = null;
    try {
      session = await stripe.checkout.sessions.retrieve(sessionId);
      items = await stripe.checkout.sessions.listLineItems(sessionId, { limit: 50 });
    } catch (e) {
      // If this fails, we still proceed with the shipping email
      console.warn("Stripe session fetch failed:", e);
    }

    // 🔹 Build an email-friendly HTML summary
    const lines =
      items?.data?.length
        ? items.data
            .map(
              (li) =>
                `<tr>
                   <td style="padding:6px 8px;border:1px solid #eee;">${li.description || "Item"}</td>
                   <td style="padding:6px 8px;border:1px solid #eee;">${li.quantity || 1}</td>
                   <td style="padding:6px 8px;border:1px solid #eee;">$${((li.amount_total || 0) / 100).toFixed(2)}</td>
                 </tr>`
            )
            .join("")
        : `<tr><td colspan="3" style="padding:6px 8px;border:1px solid #eee;">(Line items not available)</td></tr>`;

    const html = `
      <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;">
        <h2>New order — shipping details</h2>
        <p><strong>Stripe session:</strong> ${sessionId}</p>

        <h3>Customer</h3>
        <p>
          ${shipping.name}<br/>
          ${shipping.email}${shipping.phone ? " • " + shipping.phone : ""}<br/>
          ${shipping.address1}${shipping.address2 ? "<br/>" + shipping.address2 : ""}<br/>
          ${shipping.city}, ${shipping.state} ${shipping.postal_code}
        </p>

        ${shipping.notes ? `<p><strong>Notes:</strong> ${shipping.notes}</p>` : ""}

        <h3>Order</h3>
        <table style="border-collapse:collapse;border:1px solid #eee;">
          <thead>
            <tr>
              <th style="text-align:left;padding:6px 8px;border:1px solid #eee;">Item</th>
              <th style="text-align:left;padding:6px 8px;border:1px solid #eee;">Qty</th>
              <th style="text-align:left;padding:6px 8px;border:1px solid #eee;">Total</th>
            </tr>
          </thead>
          <tbody>${lines}</tbody>
        </table>

        ${
          session?.amount_total
            ? `<p style="margin-top:10px"><strong>Grand total:</strong> $${(session.amount_total / 100).toFixed(2)}</p>`
            : ""
        }
      </div>
    `;

    // 🔹 Send via Resend (JSON is correct here)
    const sendRes = await resend.emails.send({
      from: FROM_EMAIL,     // must be a verified/allowed sender in Resend
      to: [TO_EMAIL],
      subject: `New order — ${shipping.name} (${sessionId})`,
      html,
      replyTo: shipping.email || undefined,
    });

    if (sendRes.error) {
      console.error("Resend error:", sendRes.error);
      return NextResponse.json({ ok: false, error: "Email send failed." }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("orders route error:", err);
    return NextResponse.json({ ok: false, error: err?.message || "Server error" }, { status: 500 });
  }
}
