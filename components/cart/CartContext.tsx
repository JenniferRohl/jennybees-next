'use client';
import * as React from 'react';

/** ===== Types ===== */
export type CartItem = {
  id: string;           // slug/sku
  name: string;
  price: number;        // unit price in USD (e.g., 18)
  image?: string;       // absolute or site-relative path
  qty: number;          // integer ≥ 1
};

type CartCtx = {
  items: CartItem[];
  add: (item: Omit<CartItem, 'qty'>, qty?: number) => void;
  remove: (id: string) => void;
  setQty: (id: string, qty: number) => void;
  clear: () => void;
  total: number;        // subtotal (sum of price * qty)
  open: boolean;
  setOpen: (v: boolean) => void;
  ready: boolean;       // true once localStorage has been loaded
};

/** ===== Constants ===== */
const Ctx = React.createContext<CartCtx | null>(null);
const KEY = 'jb_cart_v1';

/**
 * Parse cart JSON safely.
 */
function parseCartJSON(raw: string | null): CartItem[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as any[];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((i) => ({
        id: String(i?.id ?? ''),
        name: String(i?.name ?? ''),
        // Ensure price is a finite positive number
        price: Number.isFinite(Number(i?.price)) && Number(i?.price) > 0 ? Number(i.price) : 0,
        image: i?.image ? String(i.image) : undefined,
        qty: Number.isInteger(i?.qty) && i.qty > 0 ? Number(i.qty) : 1,
      }))
      .filter((i) => i.id && i.name);
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  // Start empty on first render (SSR + initial client render) to avoid hydration mismatch.
  const [items, setItems] = React.useState<CartItem[]>([]);
  const [open, setOpen] = React.useState(false);
  const [ready, setReady] = React.useState(false); // becomes true after we read localStorage

  /** Load from localStorage AFTER mount */
  React.useEffect(() => {
    try {
      const raw = typeof window !== 'undefined' ? window.localStorage.getItem(KEY) : null;
      const loaded = parseCartJSON(raw);
      if (loaded.length) setItems(loaded);
    } catch {
      /* ignore */
    } finally {
      setReady(true);
    }
  }, []);

  /** Persist to localStorage whenever items change (but only after initial load) */
  React.useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(KEY, JSON.stringify(items));
    } catch {
      /* ignore */
    }
  }, [items, ready]);

  /** Cross-tab sync */
  React.useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key !== KEY) return;
      setItems(parseCartJSON(e.newValue));
    }
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  /** Actions */
  const add: CartCtx['add'] = (item, qty = 1) => {
    const delta = Math.max(1, Math.floor(qty));
    setItems((prev) => {
      const i = prev.findIndex((p) => p.id === item.id);
      if (i >= 0) {
        const copy = [...prev];
        copy[i] = { ...copy[i], qty: copy[i].qty + delta };
        return copy;
      }
      return [...prev, { ...item, qty: delta }];
    });
    setOpen(true); // open drawer on add
  };

  const remove: CartCtx['remove'] = (id) => setItems((p) => p.filter((i) => i.id !== id));

  const setQty: CartCtx['setQty'] = (id, qty) =>
    setItems((p) =>
      p.map((i) =>
        i.id === id ? { ...i, qty: Math.max(1, Math.floor(Number(qty) || 1)) } : i
      )
    );

  const clear: CartCtx['clear'] = () => setItems([]);

  const total = React.useMemo(
    () => items.reduce((sum, i) => sum + i.price * i.qty, 0),
    [items]
  );

  const value: CartCtx = { items, add, remove, setQty, clear, total, open, setOpen, ready };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart() {
  const ctx = React.useContext(Ctx);
  if (!ctx) throw new Error('useCart must be used inside CartProvider');
  return ctx;
}