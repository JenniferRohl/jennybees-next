// app/shipping/ShippingClient.tsx
"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";

type ShippingForm = {
  name: string;
  email: string;
  phone: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  postal_code: string;
  notes: string;
};

export default function ShippingClient() {
  const sp = useSearchParams();
  const sessionId = sp.get("session_id") || "";

  const [form, setForm] = React.useState<ShippingForm>({
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

  const onChange =
    (field: keyof ShippingForm) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!sessionId) {
      alert("Missing checkout session. Please return to cart and try again.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ session_id: sessionId, shipping: form }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) throw new Error(data?.error || "Failed to submit shipping info");

      setSubmitted(true);
    } catch (err: any) {
      alert(err?.message || "Error submitting shipping info");
    } finally {
      setSubmitting(false);
    }
  }

  if (!sessionId) {
    return (
      <main className="max-w-xl mx-auto p-6">
        <h1 className="text-2xl font-semibold mb-2">Missing checkout session</h1>
        <p className="text-neutral-600">Please return to the cart and checkout again.</p>
      </main>
    );
  }

  if (submitted) {
    return (
      <main className="max-w-xl mx-auto p-6 text-center">
        <h1 className="text-2xl font-semibold mb-2">Thanks! 🎉</h1>
        <p className="text-neutral-600">We’ve received your shipping details. We’ll email you an order confirmation shortly.</p>
      </main>
    );
  }

  return (
    <main className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Shipping Information</h1>
      <form onSubmit={onSubmit} className="grid gap-3">
        <div className="grid sm:grid-cols-2 gap-3">
          <input className="px-3 py-2 rounded border" placeholder="Full name" value={form.name} onChange={onChange("name")} />
          <input className="px-3 py-2 rounded border" placeholder="Email" type="email" value={form.email} onChange={onChange("email")} />
        </div>
        <input className="px-3 py-2 rounded border" placeholder="Phone" value={form.phone} onChange={onChange("phone")} />

        <input className="px-3 py-2 rounded border" placeholder="Address line 1" value={form.address1} onChange={onChange("address1")} />
        <input className="px-3 py-2 rounded border" placeholder="Address line 2 (optional)" value={form.address2} onChange={onChange("address2")} />

        <div className="grid sm:grid-cols-3 gap-3">
          <input className="px-3 py-2 rounded border" placeholder="City" value={form.city} onChange={onChange("city")} />
          <input className="px-3 py-2 rounded border" placeholder="State" value={form.state} onChange={onChange("state")} />
          <input className="px-3 py-2 rounded border" placeholder="Postal code" value={form.postal_code} onChange={onChange("postal_code")} />
        </div>

        <textarea className="px-3 py-2 rounded border" rows={4} placeholder="Notes (optional)" value={form.notes} onChange={onChange("notes")} />

        <button type="submit" disabled={submitting} className="px-4 py-2 rounded text-white" style={{ background: "#b76e79" }}>
          {submitting ? "Submitting…" : "Submit shipping info"}
        </button>
      </form>
    </main>
  );
}
