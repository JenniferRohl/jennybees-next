'use client';
import * as React from 'react';
import { useCart } from './CartContext';

/** If your header has a combined announcement+header height, pad the drawer */
const HEADER_OFFSET_PX = 96;

/** —— Reservation helpers (mirror of the logic used in the page) —— */
type ResvMap = Record<string, number[]>;
const RESV_KEY = 'jb_reservations_v1';
function loadResv(): ResvMap {
  try {
    const raw = typeof window !== 'undefined' ? window.localStorage.getItem(RESV_KEY) : null;
    if (!raw) return {};
    const parsed = JSON.parse(raw) as ResvMap;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch { return {}; }
}
function saveResv(map: ResvMap) { try { window.localStorage.setItem(RESV_KEY, JSON.stringify(map)); } catch {} }
function sweepExpired(map: ResvMap): ResvMap {
  const t = Date.now();
  let changed = false; const next: ResvMap = {};
  for (const [id, arr] of Object.entries(map)) {
    const filtered = (arr || []).filter(x => x > t);
    if (filtered.length) next[id] = filtered;
    if (filtered.length !== (arr || []).length) changed = true;
  }
  if (changed) saveResv(next);
  return changed ? next : map;
}
function releaseMany(id: string, n: number) {
  if (n <= 0) return;
  let map = sweepExpired(loadResv());
  const arr = map[id] || [];
  arr.sort((a,b) => a - b);
  const keep = arr.slice(0, Math.max(0, arr.length - n));
  if (keep.length) map[id] = keep; else delete map[id];
  saveResv(map);
}

export default function CartDrawer() {
  const { items, remove, setQty, total, open, setOpen, ready } = useCart();

  async function checkout() {
    try {
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const line_items = items.map((i) => {
        const img =
          i.image && /^https?:\/\//i.test(i.image)
            ? i.image
            : i.image && origin
            ? `${origin}${i.image.startsWith('/') ? '' : '/'}${i.image}`
            : undefined;

        return {
          price_data: {
            currency: 'usd',
            product_data: img ? { name: i.name, images: [img] } : { name: i.name },
            unit_amount: Math.round(Number(i.price) * 100),
          },
          quantity: i.qty,
        };
      });

      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: line_items }),
      });

      if (!res.ok) {
        const text = await res.text();
        console.error('Checkout failed:', res.status, text);
        alert(`Checkout failed (${res.status}). See terminal for details.`);
        return;
      }

      const data = await res.json();
      if (data?.url) {
        window.location.assign(data.url);
      } else {
        console.error('No URL in response:', data);
        alert('Checkout failed: no URL in response.');
      }
    } catch (e: any) {
      console.error('Checkout error:', e);
      alert(`Checkout error: ${e?.message || e}`);
    }
  }

  return (
    <>
      {/* overlay */}
      <div
        onClick={() => setOpen(false)}
        className={`fixed inset-0 bg-black/40 transition-opacity ${open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        style={{ zIndex: 50 }}
      />

      {/* drawer */}
      <aside
        className={`fixed right-0 w-[360px] max-w-[90vw] bg-white shadow-2xl p-4 transition-transform ${open ? 'translate-x-0' : 'translate-x-full'}`}
        style={{
          zIndex: 51,
          top: HEADER_OFFSET_PX,
          height: `calc(100% - ${HEADER_OFFSET_PX}px)`,
          borderTopLeftRadius: '1rem',
          borderBottomLeftRadius: '1rem',
        }}
        aria-hidden={!open}
        aria-label="Shopping cart"
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">Your cart</h3>
          <button onClick={() => setOpen(false)} className="text-sm px-3 py-1 rounded border">
            Close
          </button>
        </div>

        {/* Body */}
        <div className="space-y-3 overflow-y-auto max-h-[65vh] pr-1">
          {!ready && <div className="text-sm text-neutral-500">Loading your cart…</div>}

          {ready && items.length === 0 && (
            <div className="text-sm text-neutral-500">Your cart is empty.</div>
          )}

          {ready &&
            items.map((i) => (
              <div key={i.id} className="flex gap-3 items-center">
                {i.image ? (
                  <img src={i.image} alt="" className="h-16 w-16 object-cover rounded" />
                ) : (
                  <div className="h-16 w-16 bg-neutral-100 rounded" />
                )}

                <div className="flex-1">
                  <div className="font-medium">{i.name}</div>
                  <div className="text-sm text-neutral-600">${i.price.toFixed(2)}</div>

                  <div className="mt-1 flex items-center gap-2">
                    <button
                      onClick={() => {
                        // decrease qty -> release one reservation
                        releaseMany(i.id, 1);
                        setQty(i.id, i.qty - 1);
                      }}
                      className="px-2 border rounded"
                      aria-label={`Decrease quantity of ${i.name}`}
                    >
                      -
                    </button>
                    <span className="w-6 text-center text-sm" aria-live="polite">
                      {i.qty}
                    </span>
                    <button
                      onClick={() => {
                        // NOTE: we do NOT reserve here when increasing from the drawer,
                        // because availability is computed on the product cards.
                        // You can add a reserveOne(i.id) here if you want to enforce it.
                        setQty(i.id, i.qty + 1);
                      }}
                      className="px-2 border rounded"
                      aria-label={`Increase quantity of ${i.name}`}
                    >
                      +
                    </button>
                    <button
                      onClick={() => {
                        // remove -> release all reservations for this item
                        releaseMany(i.id, i.qty);
                        remove(i.id);
                      }}
                      className="ml-3 text-xs text-red-600"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
        </div>

        {/* Footer */}
        <div className="mt-4 border-t pt-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-neutral-600">Subtotal</span>
            <span className="font-semibold">${total.toFixed(2)}</span>
          </div>

          <button
            onClick={checkout}
            disabled={!ready || items.length === 0}
            className="mt-3 w-full px-4 py-3 rounded-xl text-white font-medium disabled:opacity-50"
            style={{ background: '#b76e79' }}
          >
            Checkout
          </button>
        </div>
      </aside>
    </>
  );
}