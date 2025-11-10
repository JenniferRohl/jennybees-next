// app/api/contact/route.ts
import { NextResponse } from "next/server";

type ContactPayload = {
  name: string;
  email: string;
  subject: string;
  message: string;
  // Honeypot
  company?: string;
};

function isValidEmail(e: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as ContactPayload;

    // Honeypot (bots will often fill it)
    if (body.company && body.company.trim() !== "") {
      return NextResponse.json({ ok: true }); // pretend success; drop silently
    }

    // Basic validation
    if (!body.name?.trim() || !body.email?.trim() || !body.message?.trim()) {
      return NextResponse.json({ ok: false, error: "Missing required fields." }, { status: 400 });
    }
    if (!isValidEmail(body.email)) {
      return NextResponse.json({ ok: false, error: "Invalid email address." }, { status: 400 });
    }

    const RESEND_KEY = process.env.RESEND_API_KEY || "";
    const TO = process.env.CONTACT_TO || "";
    const FROM = process.env.CONTACT_FROM || ""; // e.g. "Jenny Bees <hello@yourdomain.com>"

    if (!RESEND_KEY || !TO || !FROM) {
      return NextResponse.json(
        { ok: false, error: "Server email is not configured." },
        { status: 500 }
      );
    }

    // Send via Resend REST API to avoid extra deps
    const subject = body.subject?.trim() || "Website contact";
    const html = `
      <div style="font-family:system-ui,Segoe UI,Arial,sans-serif;line-height:1.5">
        <h2 style="margin:0 0 8px">New contact form message</h2>
        <p><strong>Name:</strong> ${escapeHtml(body.name)}</p>
        <p><strong>Email:</strong> ${escapeHtml(body.email)}</p>
        <p><strong>Subject:</strong> ${escapeHtml(subject)}</p>
        <p><strong>Message:</strong></p>
        <pre style="white-space:pre-wrap;padding:12px;background:#f6f6f6;border-radius:8px;">${escapeHtml(body.message)}</pre>
      </div>
    `;

    const sendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM,
        to: [TO],
        subject: `Contact: ${subject}`,
        html,
        reply_to: body.email,
      }),
    });

    if (!sendRes.ok) {
      const text = await sendRes.text();
      return NextResponse.json(
        { ok: false, error: `Send failed: ${text}` },
        { status: 502 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Unexpected error" },
      { status: 500 }
    );
  }
}

// Tiny HTML escaper
function escapeHtml(s: string) {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
