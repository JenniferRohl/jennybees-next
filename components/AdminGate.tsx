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

  // On mount, ask the server if we already have a valid admin cookie
  React.useEffect(() => {
    let cancelled = false;

    async function check() {
      try {
        const res = await fetch("/api/admin/check", { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to check admin status");
        const data = await res.json();
        if (!cancelled) {
          setIsAdmin(Boolean(data.ok));
        }
      } catch (err) {
        if (!cancelled) {
          console.error(err);
        }
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
      console.error(err);
      setError(err.message || "Login failed");
    } finally {
      setSubmitting(false);
    }
  }

  // While checking cookie, just show a small placeholder
  if (checking) {
    return (
      <section className="py-10">
        <div className="max-w-md mx-auto text-center text-sm text-neutral-500">
          Checking admin access…
        </div>
      </section>
    );
  }

  // 🚫 Not admin yet: ONLY show password card. Admin panel is NOT rendered at all.
  if (!isAdmin) {
    return (
      <section className="py-10">
        <div className="max-w-md mx-auto rounded-3xl bg-white/90 shadow-lg border border-neutral-200 px-6 py-8">
          <h2 className="text-xl font-semibold mb-2">Admin sign-in</h2>
          <p className="text-sm text-neutral-600 mb-4">
            Enter the admin password to edit products and site settings.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Admin password"
              className="w-full px-3 py-2 rounded-xl border text-sm"
              style={{ borderColor: "#e5e5e5" }}
            />

            {error && (
              <p className="text-sm text-red-500 text-left">{error}</p>
            )}

            <button
              type="submit"
              disabled={submitting || !password}
              className="w-full py-2 rounded-xl text-white text-sm font-medium disabled:opacity-60"
              style={{
                background:
                  "linear-gradient(135deg, #b76e79, #804657)",
              }}
            >
              {submitting ? "Signing in…" : "Enter admin mode"}
            </button>
          </form>
        </div>
      </section>
    );
  }

  // ✅ Logged in: now we actually show the admin panel content (children)
  return <>{children}</>;
}