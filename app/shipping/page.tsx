// app/shipping/page.tsx
"use client";
export const dynamic = "force-dynamic";
import * as React from "react";
import { useSearchParams } from "next/navigation";

export default function ShippingPage() {
  const sp = useSearchParams();
  const sessionId = sp.get("session_id") || "";

  const [form, setForm] = React.useState({
    name: "",
    email: "",
    phone: "",
    address1: "",
    address2: "",
    city: "",
    state: "",
    postal_code: "",
    notes: "",
  });
  const [submitting, setSubmitting] = React.useState(false);
  const [submitted, setSubmitted] = React.useState(false);
  const onChange = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      // We’ll implement this API next (app/api/order/route.ts)
      const res = await fetch("/api/order", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ session_id: sessionId, shipping: form }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || "Failed to submit shipping info");
      }
      setSubmitted(true);
    } catch (err: any) {
      alert(err?.message || "Could not submit shipping info");
    } finally {
      setSubmitting(false);
    }
  }

  if (!sessionId) {
    return (
      <main className="max-w-xl mx-auto p-6">
        <h1 className="text-2xl font-semibold mb-3">Missing checkout session</h1>
        <p className="text-neutral-600">
          We couldn’t find your payment session. Please return to your cart and try checkout again.
        </p>
      </main>
    );
  }

  if (submitted) {
    return (
      <main className="max-w-xl mx-auto p-6">
        <h1 className="text-2xl font-semibold mb-3">Thanks! 🎉</h1>
        <p className="text-neutral-700">
          We’ve received your shipping details. You’ll get an email from us shortly. If anything looks off, reply to that email and we’ll fix it.
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#fffff0]">
      <div className="max-w-2xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-semibold">Shipping Information</h1>
        <p className="text-neutral-700 mt-1">
          Payment complete. Enter your shipping details to finalize your order.
        </p>

        <form onSubmit={onSubmit} className="mt-6 grid gap-4 bg-white p-6 rounded-2xl ring-1 ring-neutral-200">
          {/* keep the Stripe session id so the API can look up the paid order */}
          <input type="hidden" name="session_id" value={sessionId} />

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium">Full name</label>
              <input className="mt-1 w-full px-3 py-2 rounded-lg ring-1 ring-neutral-300 focus:ring-2 outline-none"
                     value={form.name} onChange={onChange("name")} required />
            </div>
            <div>
              <label className="block text-sm font-medium">Email</label>
              <input type="email" className="mt-1 w-full px-3 py-2 rounded-lg ring-1 ring-neutral-300 focus:ring-2 outline-none"
                     value={form.email} onChange={onChange("email")} required />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium">Phone (for delivery updates)</label>
            <input className="mt-1 w-full px-3 py-2 rounded-lg ring-1 ring-neutral-300 focus:ring-2 outline-none"
                   value={form.phone} onChange={onChange("phone")} />
          </div>

          <div>
            <label className="block text-sm font-medium">Address line 1</label>
            <input className="mt-1 w-full px-3 py-2 rounded-lg ring-1 ring-neutral-300 focus:ring-2 outline-none"
                   value={form.address1} onChange={onChange("address1")} required />
          </div>

          <div>
            <label className="block text-sm font-medium">Address line 2 (optional)</label>
            <input className="mt-1 w-full px-3 py-2 rounded-lg ring-1 ring-neutral-300 focus:ring-2 outline-none"
                   value={form.address2} onChange={onChange("address2")} />
          </div>

          <div className="grid sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium">City</label>
              <input className="mt-1 w-full px-3 py-2 rounded-lg ring-1 ring-neutral-300 focus:ring-2 outline-none"
                     value={form.city} onChange={onChange("city")} required />
            </div>
            <div>
              <label className="block text-sm font-medium">State</label>
              <input className="mt-1 w-full px-3 py-2 rounded-lg ring-1 ring-neutral-300 focus:ring-2 outline-none"
                     value={form.state} onChange={onChange("state")} required />
            </div>
            <div>
              <label className="block text-sm font-medium">ZIP</label>
              <input className="mt-1 w-full px-3 py-2 rounded-lg ring-1 ring-neutral-300 focus:ring-2 outline-none"
                     value={form.postal_code} onChange={onChange("postal_code")} required />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium">Notes (delivery instructions, gift messages, etc.)</label>
            <textarea rows={4} className="mt-1 w-full px-3 py-2 rounded-lg ring-1 ring-neutral-300 focus:ring-2 outline-none"
                      value={form.notes} onChange={onChange("notes")} />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="mt-2 w-full px-4 py-3 rounded-xl text-white font-medium"
            style={{ background: "#b76e79" }}
          >
            {submitting ? "Submitting…" : "Submit shipping details"}
          </button>
        </form>

        <p className="text-xs text-neutral-500 mt-3">
          Your payment session: <code>{sessionId.slice(0, 12)}…</code>
        </p>
      </div>
    </main>
  );
}
