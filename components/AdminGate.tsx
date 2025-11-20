"use client";

import * as React from "react";

type AdminGateProps = {
  children: React.ReactNode;
};

export default function AdminGate({ children }: AdminGateProps) {
  const [password, setPassword] = React.useState("");
  const [isAdmin, setIsAdmin] = React.useState(false);
  const [checking, setChecking] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Check existing cookie/session
  React.useEffect(() => {
    let cancelled = false;

    async function check() {
      try {
        const res = await fetch("/api/admin/check", { cache: "no-store" });
        const data = await res.json();
        if (!cancelled) setIsAdmin(Boolean(data.ok));
      } catch {
        if (!cancelled) setIsAdmin(false);
      } finally {
        if (!cancelled) setChecking(false);
      }
    }

    check();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Invalid password");
      }
      setIsAdmin(true);
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setSubmitting(false);
    }
  }

  // While verifying cookie
  if (checking) {
    return (
      <div className="fixed inset-0 bg-white flex items-center justify-center z-50">
        <p className="text-sm text-neutral-600">Checking admin access...</p>
      </div>
    );
  }

  // 🚫 If not admin: full-page lockout — nothing else renders behind it
  if (!isAdmin) {
    return (
      <div className="fixed inset-0 bg-white/95 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="max-w-md w-full bg-white p-6 rounded-3xl shadow-lg border border-neutral-200">
          <h2 className="text-xl font-semibold mb-2 text-center">Admin sign-in</h2>
          <p className="text-sm text-neutral-600 mb-4 text-center">
            Enter the admin password to access editing tools.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Admin password"
              className="w-full px-3 py-2 rounded-xl border text-sm border-neutral-300 focus:outline-none focus:ring-2 focus:ring-rose-300"
            />

            {error && (
              <p className="text-sm text-red-500 text-center">{error}</p>
            )}

            <button
              type="submit"
              disabled={submitting || !password}
              className="w-full py-2 rounded-xl text-white font-medium disabled:opacity-60"
              style={{
                background:
                  "linear-gradient(135deg, #b76e79, #804657)",
              }}
            >
              {submitting ? "Signing in..." : "Enter admin mode"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ✅ Authenticated: unlock and render children
  return <>{children}</>;
}
