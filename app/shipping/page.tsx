// app/shipping/page.tsx
import * as React from "react";
import ShippingClient from "./ShippingClient";

// prevent prerender (we need the query string session_id on the client)
export const dynamic = "force-dynamic";

export default function ShippingPage() {
  return (
    <React.Suspense fallback={<div className="p-8 text-center">Loading…</div>}>
      <ShippingClient />
    </React.Suspense>
  );
}
