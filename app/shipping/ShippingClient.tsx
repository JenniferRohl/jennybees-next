"use client";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function ShippingClient() {
  const router = useRouter();
  const params = useSearchParams();
  const sessionId = params.get("session_id") ?? "";
  const [submitting, setSubmitting] = React.useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);

    const fd = new FormData(e.currentTarget);
    const shipping = Object.fromEntries(fd.entries());

    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ session_id: sessionId, shipping }),
    });

    if (res.ok) {
      router.replace("/success"); // ✅ GO TO REAL SUCCESS PAGE
      return;
    }

    const data = await res.json().catch(() => null);
    alert(data?.error ?? "Sorry, something went wrong.");
    setSubmitting(false);
  }

  return (
    <form onSubmit={onSubmit} className="max-w-xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-semibold text-center mb-4">Shipping Details</h1>

      {/* Name */}
      <input
        name="name"
        placeholder="Full Name"
        required
        className="w-full border p-2 rounded"
      />

      {/* Email */}
      <input
        name="email"
        type="email"
        placeholder="Email"
        required
        className="w-full border p-2 rounded"
      />

      {/* Phone */}
      <input
        name="phone"
        placeholder="Phone Number"
        required
        className="w-full border p-2 rounded"
      />

      {/* Address */}
      <input
        name="address1"
        placeholder="Address"
        required
        className="w-full border p-2 rounded"
      />

      <input
        name="address2"
        placeholder="Address 2 (optional)"
        className="w-full border p-2 rounded"
      />

      <div className="grid grid-cols-3 gap-2">
        <input name="city" placeholder="City" required className="border p-2 rounded" />
        <input name="state" placeholder="State" required className="border p-2 rounded" />
        <input name="postal_code" placeholder="ZIP" required className="border p-2 rounded" />
      </div>

      {/* Notes */}
      <textarea
        name="notes"
        placeholder="Order Notes (optional)"
        className="w-full border p-2 rounded"
      />

      <button
        type="submit"
        disabled={submitting}
        className="w-full py-3 rounded-md text-white font-semibold"
        style={{ background: "#b76e79" }}
      >
        {submitting ? "Submitting…" : "Submit Shipping Info"}
      </button>
    </form>
  );
}
