"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";

type AdminGateProps = {
  children: React.ReactNode;
};

export default function AdminGate({ children }: AdminGateProps) {
  const searchParams = useSearchParams();
  const wantsAdmin = searchParams.get("admin") === "1";

  const [isAdmin, setIsAdmin] = React.useState(false);
  const [checked, setChecked] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    // ❌ If URL does NOT have ?admin=1, do NOT prompt at all
    if (!wantsAdmin) {
      setIsAdmin(false);
      setChecked(true);
      return;
    }

    // 👇 this uses the same env var you said you're using: ADMIN_PASSWORD
    const expected = process.env.ADMIN_PASSWORD;

    const entered = window.prompt("Admin access: enter password");

    if (entered && expected && entered === expected) {
      setIsAdmin(true);
    } else {
      alert("Incorrect admin password.");
      setIsAdmin(false);
    }

    setChecked(true);
  }, [wantsAdmin]);

  // While deciding, render nothing
  if (!checked) return null;

  // If not admin (either no ?admin=1 or wrong password), render nothing
  if (!isAdmin) return null;

  // ✅ Only when ?admin=1 AND password correct do we show children
  return <>{children}</>;
}