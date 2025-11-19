"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";

type AdminGateProps = {
  children: React.ReactNode;
};

export default function AdminGate({ children }: AdminGateProps) {
  const searchParams = useSearchParams();
  const showGate = searchParams.get("admingate") === "1";

  const [password, setPassword] = React.useState("");
  const [isAdmin, setIsAdmin] = React.useState(false);
  const [checking, setChecking] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  // On mount, ask the server if we already have the admin cookie
  React.useEffect(() => {
    let cancelled = false;

    async function check() {
      try {
        const res = await fetch("/api/admin/check", { cache: "no-store" });
        if (!res.ok) throw new Error("check failed");
        const data = await res.json();
        if (cancelled) return;
        setIsAdmin(!!data.ok);
      } catch {
        if (cancelled) return;
        setIsAdmin(false);
      } finally {
        if (!cancelled) setChecking(false);
      }
    }

    check();
    return () => {
      cancelled = true;
    };
  }, []);

  // 🚫 If URL does NOT have ?admingate=1, hide the entire admin UI
  if (!showGate) {
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Invalid password");
      }

      setIsAdmin(true);
    } catch (err: any) {
      setError(err.message || "Login failed");
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  }

  if (checking) {
    return (
      <section className="max-w-6xl mx-auto px-4 py-8">
        <p className="text-sm text-neutral-500">Checking admin access…</p>
      </section>
    );
  }

  if (!isAdmin) {
    return (
      <section className="max-w-6xl mx-auto px-4 py-10">
        <div className="rounded-3xl bg-rose-50/60 border border-rose-100 px-6 py-8 shadow-sm">
          <h2 className="text-xl font-semibold mb-2">Admin sign-in</h2>
          <p className="text-sm text-neutral-600 mb-4">
            Enter the admin password to edit products and site settings.
          </p>

          <form onSubmit={handleSubmit} className="space-y-3 max-w-sm">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 rounded border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-rose-300"
              placeholder="Admin password"
            />

            {error && (
              <p className="text-sm text-red-600">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || !password}
              className="px-4 py-2 rounded-xl bg-[#b76e79] text-white font-medium disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? "Signing in…" : "Enter admin mode"}
            </button>
          </form>
        </div>
      </section>
    );
  }

  // Logged-in admin view
  return (
    <section className="max-w-6xl mx-auto px-4 py-10">
      <div className="rounded-3xl bg-neutral-50 border border-neutral-200 px-4 py-4 shadow-sm">
        {children}
      </div>
    </section>
  );
}