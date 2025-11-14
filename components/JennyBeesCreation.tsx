"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { useCart } from "./cart/CartContext";
import CartDrawer from "./cart/CartDrawer";
import TikTokEmbed from "./TikTokEmbed";
import FacebookEmbed from "./FacebookEmbed";

/** ===== THEME ===== */
const theme = {
  rose: "#b76e79",
  roseSoft: "#d6a8ae",
  cream: "#fffaf3",
  black: "#111111",
  white: "#ffffff",
  roseMetalStart: "#d4a5a5",
  roseMetalMid: "#b87979",
  roseMetalDeep: "#805050",
};

/** ===== TYPES ===== */
type Product = {
  id: string;
  name: string;
  notes: string;
  price: number;
  img: string;          // public URL only (no blob:)
  badge?: string;
  defaultQty?: number;
  qty?: number;         // optional inventory hook for future
};
type SectionId = "hero" | "shop" | "about" | "social" | "shipping" | "contact";
type HeroDecor = {
  img: string;
  x: number;
  y: number;
  size: number;
  shape: "circle" | "rounded";
  visible: boolean;
};
type Config = {
  order: Array<SectionId>;
  hidden: Record<SectionId, boolean>;
  header: { ctaLabel: string };
  logo: { src: string; alt?: string };
  hero: { heading: string; subheading: string; ctaText: string; ctaSecondary: string; img: string };
  heroDecor: HeroDecor;
  social: { tiktok: string; facebook: string; tiktokPost?: string };
  products: Product[];
};

/** ===== UTIL ===== */
const STORAGE_KEY = "jennybees_config_v6";
const priceFmt = (n: number) => `$${Number(n).toFixed(2)}`;
const idFromName = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-");
const makeId = () =>
  (typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `p_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`);
const withStableIds = (arr: any[]): Product[] =>
  (arr as Product[]).map((p: any) => (p.id ? p : { ...p, id: makeId() }));

const normalizeUrl = (u: string) => (u || "").trim();
const isBlobUrl = (u?: string) => !!u && u.startsWith("blob:");

/** Upload helper: POST /api/upload -> { ok: true, url } */
async function uploadToBlob(file: File, filename?: string): Promise<string> {
  const fd = new FormData();
  fd.set("file", file);
  if (filename) fd.set("filename", filename);
  const res = await fetch("/api/upload", { method: "POST", body: fd });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`Upload failed (${res.status}) ${t}`);
  }
  const data = await res.json().catch(() => ({}));
  if (!data?.ok || !data?.url) throw new Error("Upload did not return a url.");
  return String(data.url);
}

/** ===== DEFAULT CONFIG ===== */
const defaultConfig: Config = {
  order: ["hero", "shop", "about", "social", "shipping", "contact"],
  hidden: { hero: false, shop: false, about: false, social: false, shipping: false, contact: false },
  header: { ctaLabel: "Shop Now" },
  logo: { src: "/images/logo.png", alt: "Jenny Bee's Creation logo" },
  hero: {
    heading: "Hand-Poured Candles That Bring Charm And Whimsy To Your Home!",
    subheading: "Clean soy-blend wax • phthalate-free fragrance • cotton wicks. Made by Jen in small batches.",
    ctaText: "Shop the Collection",
    ctaSecondary: "About our process",
    img: "/images/jen/hero.jpg",
  },
  heroDecor: {
    img: "/images/jen/market-stall.jpg",
    x: -60,
    y: -20,
    size: 200,
    shape: "circle",
    visible: true,
  },
  social: {
    tiktok: "https://www.tiktok.com/@jennybeescreation",
    facebook: "https://www.facebook.com/profile.php?id=61557530316513",
    tiktokPost: "https://www.tiktok.com/@jennybeescreation/video/7564050728294075662",
  },
  products: withStableIds([
    { name: "Autumn Whispers", notes: "Pumpkin • Clove • Vanilla", price: 18, img: "/images/jen/autumn-whispers.jpg", badge: "Bestseller", defaultQty: 1 } as any,
    { name: "Brown Sugar Latte", notes: "Espresso • Brown Sugar • Cream", price: 18, img: "/images/jen/brown-sugar-latte.jpg", badge: "Cozy Pick", defaultQty: 1 } as any,
    { name: "Harvest Cookie", notes: "Warm Dough • Cinnamon • Nutmeg", price: 18, img: "/images/jen/harvest-cookie.jpg", badge: "Small Batch", defaultQty: 1 } as any,
    { name: "Forest Ember", notes: "Cedar • Amber • Smoke", price: 20, img: "/images/jen/forest-ember.jpg", badge: "New", defaultQty: 1 } as any,
  ]),
};

export default function JennyBeesCreation() {
  const cart = useCart();
const cartCount = cart?.items?.reduce((sum, item) => sum + (item.qty ?? 0), 0);

  /** Admin from URL (SSR-safe) */
  const searchParams = useSearchParams();
  const admin = searchParams.get("admin") === "1";

  /** Config state — start from defaults, hydrate from localStorage */
  const [cfg, setCfg] = React.useState<Config>(() => ({
    ...defaultConfig,
    products: withStableIds(defaultConfig.products),
  }));

  /** Which editor tab is open in Admin */
  const [activeSection, setActiveSection] = React.useState<SectionId>("hero");

  /** Simple uploading flags (per-field) */
  const [uploading, setUploading] = React.useState<Record<string, boolean>>({});

  /** LocalStorage hydrate once */
  React.useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed: Partial<Config> = JSON.parse(raw);
      const merged = {
        ...defaultConfig,
        ...parsed,
        hidden: { ...defaultConfig.hidden, ...(parsed.hidden || {}) },
      } as Config;
      merged.products = withStableIds(merged.products || []);
      merged.heroDecor = { ...defaultConfig.heroDecor, ...(parsed as any)?.heroDecor };
      setCfg(merged);
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Load from server KV once (merge over local) */
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/admin/config", { cache: "no-store" });
        if (!res.ok) return;
        const json = await res.json();
        const data = json?.data as Partial<Config> | null;
        if (!cancelled && data) {
          const merged = {
            ...defaultConfig,
            ...data,
            hidden: { ...defaultConfig.hidden, ...(data.hidden || {}) },
          } as Config;
          merged.products = withStableIds(merged.products || []);
          merged.heroDecor = { ...defaultConfig.heroDecor, ...(data as any).heroDecor };
          setCfg(merged);
          try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(merged)); } catch {}
        }
      } catch {}
    })();
    return () => { cancelled = true; };
  }, []);

  /** Cross-tab live sync */
  React.useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY || !e.newValue) return;
      try {
        const next = JSON.parse(e.newValue) as Config;
        next.products = withStableIds(next.products || []);
        next.heroDecor = { ...defaultConfig.heroDecor, ...(next as any).heroDecor };
        setCfg(next);
      } catch {}
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  /** Debounced preview writer (prevents focus jank) */
  const previewTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const writePreview = React.useCallback((next: Config) => {
    if (previewTimer.current) clearTimeout(previewTimer.current);
    previewTimer.current = setTimeout(() => {
      try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
    }, 250);
  }, []);

  /** Save to local + KV */
  const saveCfg = React.useCallback(async (next?: Config) => {
    const merged = next || cfg;
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(merged)); } catch {}
    setCfg(merged);
    try {
      const res = await fetch("/api/admin/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(merged),
      });
      if (!res.ok) {
        const t = await res.text();
        alert("Save failed: " + t);
        return;
      }
      alert("Saved ✔ (synced)");
    } catch (e: any) {
      alert("Save failed: " + (e?.message || e));
    }
  }, [cfg]);

  /** ===== Admin helpers / focus stability ===== */
  const setCfgField = <K extends keyof Config>(key: K, value: Config[K]) =>
    setCfg((prev) => {
      const nxt = { ...prev, [key]: value };
      writePreview(nxt);
      return nxt;
    });

  const handleProductChange = (i: number, field: keyof Product, value: any) =>
    setCfg((prev) => {
      const products = prev.products.map((p, idx) => (idx === i ? { ...p, [field]: value } : p));
      const nxt = { ...prev, products };
      writePreview(nxt);
      return nxt;
    });

  // caret lock
  type Field = "name" | "notes" | "price" | "badge" | "defaultQty" | "img";
  const inputRefs = React.useRef<Record<string, Partial<Record<Field, HTMLInputElement | null>>>>({});
  const caretRef = React.useRef<{ id: string; field: Field; start: number | null; end: number | null } | null>(null);
  React.useLayoutEffect(() => {
    const c = caretRef.current;
    if (!c) return;
    const el = inputRefs.current[c.id]?.[c.field];
    if (el) {
      el.focus();
      try { if (c.start !== null && c.end !== null) el.setSelectionRange(c.start, c.end); } catch {}
    }
  }, [cfg.products]);
  const captureCaret = (id: string, field: Field, e: React.ChangeEvent<HTMLInputElement>) => {
    const t = e.target;
    caretRef.current = { id, field, start: t.selectionStart ?? null, end: t.selectionEnd ?? null };
  };

  const nameRefs = React.useRef<Record<string, HTMLInputElement | null>>({});
  const lastAddedIdRef = React.useRef<string | null>(null);

  const addProduct = () => {
    const newId = makeId();
    lastAddedIdRef.current = newId;
    setCfg((prev) => {
      const nxt: Config = {
        ...prev,
        products: [
          ...prev.products,
          { id: newId, name: "", notes: "", price: 0, img: "", badge: "", defaultQty: 1 },
        ],
      };
      writePreview(nxt);
      return nxt;
    });
  };

  React.useEffect(() => {
    if (!lastAddedIdRef.current) return;
    const id = lastAddedIdRef.current;
    const t = setTimeout(() => {
      const el = nameRefs.current[id];
      if (el) { el.focus(); el.select(); }
      lastAddedIdRef.current = null;
    }, 0);
    return () => clearTimeout(t);
  }, [cfg.products]);

  const removeProduct = (i: number) =>
    setCfg((prev) => {
      const products = [...prev.products];
      products.splice(i, 1);
      const nxt = { ...prev, products };
      writePreview(nxt);
      return nxt;
    });
async function shrinkImageIfNeeded(file: File, opts?: { maxSide?: number; quality?: number }): Promise<File> {
  const maxSide = opts?.maxSide ?? 1600;   // shrink long side to 1600px
  const quality = opts?.quality ?? 0.85;   // JPEG quality
  if (!file.type.startsWith("image/")) return file;

  // If it's already small (< 1.5 MB), skip
  if (file.size < 1.5 * 1024 * 1024) return file;

  const bitmap = await createImageBitmap(file);
  let { width, height } = bitmap;
  const scale = Math.min(1, maxSide / Math.max(width, height));
  if (scale < 1) {
    width = Math.round(width * scale);
    height = Math.round(height * scale);
  } else {
    // not big enough to shrink — but maybe it’s highly compressed already
    // if still too large the server will handle; return original
    return file;
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(bitmap, 0, 0, width, height);

  // Export as JPEG to keep size down
  const blob: Blob = await new Promise((res) => canvas.toBlob((b) => res(b!), "image/jpeg", quality));
  return new File([blob], (file.name.replace(/\.[^.]+$/, "") || "image") + ".jpg", { type: "image/jpeg" });
}

  /** Public uploader: ALWAYS store public URL, never blob */
  const onPickOrDropPublicUrl = async (
    file: File,
    apply: (url: string) => void,
    busyKey: string
  ) => {
    setUploading((u) => ({ ...u, [busyKey]: true }));
    try {
      const url = await uploadToBlob(file, file.name);
      apply(normalizeUrl(url));
    } catch (e: any) {
      alert(e?.message || "Upload failed.");
    } finally {
      setUploading((u) => ({ ...u, [busyKey]: false }));
    }
  };

  const onBrowseFile = async (
    ev: React.ChangeEvent<HTMLInputElement>,
    i: number | null,
    pathSetter?: (v: string) => void
  ) => {
    const file = ev.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { alert("Please choose an image file."); return; }
    if (typeof i === "number") {
      await onPickOrDropPublicUrl(file, (url) => handleProductChange(i, "img", url), `product:${i}:img`);
    } else if (pathSetter) {
      await onPickOrDropPublicUrl(file, (url) => pathSetter(url), `adhoc`);
    }
  };

  const onDropToField = async (
    e: React.DragEvent<HTMLDivElement>,
    i: number | null,
    pathSetter?: (v: string) => void
  ) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { alert("Please drop an image file."); return; }
    if (typeof i === "number") {
      await onPickOrDropPublicUrl(file, (url) => handleProductChange(i, "img", url), `product:${i}:img`);
    } else if (pathSetter) {
      await onPickOrDropPublicUrl(file, (url) => pathSetter(url), `adhoc`);
    }
  };

  /** ===== Sections (public) ===== */
  function SectionHero() {
    const decor = cfg.heroDecor;

    return (
      <section className="relative overflow-hidden">
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at top, rgba(212,165,165,0.10), transparent 60%)" }} />
        <div className="relative max-w-6xl mx-auto px-4 py-16 md:py-24 grid md:grid-cols-2 gap-10 items-center">
          {/* LEFT: Text + optional decor image */}
          <div className="relative">
            {decor.visible && decor.img && (
              <img
                src={normalizeUrl(decor.img)}
                alt="Decor"
                className={`${decor.shape === "circle" ? "rounded-full" : "rounded-3xl"} ring-4 ring-white shadow-xl absolute`}
                style={{
                  width: decor.size,
                  height: decor.size,
                  transform: `translate(${decor.x}px, ${decor.y}px)`,
                  left: 0,
                  top: 0,
                  objectFit: "cover",
                  imageRendering: "auto",
                }}
                onError={(e) => { (e.currentTarget as HTMLImageElement).src = "/placeholder.png"; }}
              />
            )}

            <h1 className="relative text-4xl md:text-5xl font-light leading-tight tracking-tight capitalize bg-gradient-to-br from-[#d4a5a5] via-[#b87979] to-[#805050] bg-clip-text text-transparent">
              {cfg.hero.heading}
            </h1>
            <p className="mt-4 text-neutral-700 text-lg">{cfg.hero.subheading}</p>

            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href="#shop"
                className="px-5 py-3 rounded-2xl font-medium shadow bg-clip-padding transition hover:brightness-[1.04] hover:shadow-md"
                style={{ backgroundImage: `linear-gradient(135deg, ${theme.roseMetalStart}, ${theme.roseMetalMid} 40%, ${theme.roseMetalDeep})`, color: theme.white }}
              >
                {cfg.hero.ctaText}
              </a>
              <a
                href="#about"
                className="px-5 py-3 rounded-2xl font-medium border"
                style={{ borderColor: theme.roseMetalMid, color: theme.roseMetalMid }}
              >
                {cfg.hero.ctaSecondary}
              </a>
            </div>
          </div>

          {/* RIGHT: Main hero image */}
          <div className="relative">
            <div className="aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl ring-1 ring-black/5 bg-white">
              <img
                src={normalizeUrl(cfg.hero.img)}
                alt="Jen's candles hero"
                className="h-full w-full object-cover"
                style={{ imageRendering: "auto" }}
                onError={(e) => { (e.currentTarget as HTMLImageElement).src = "/placeholder.png"; }}
              />
            </div>
          </div>
        </div>
      </section>
    );
  }

  /** Base shop, then memo to avoid re-render cost */
  const SectionShopBase: React.FC = () => (
    <section id="shop" className="max-w-6xl mx-auto px-4 py-16">
      <div className="flex items-end justify-between mb-8">
        <div>
          <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">Shop</h2>
          <p className="text-neutral-600 mt-1">Seasonal and core scents — small batches sell out fast.</p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {cfg.products.map((p) => {
          const out = (p.qty ?? 9999) <= 0;
          return (
            <div key={p.id} className="group rounded-3xl bg-white ring-1 ring-neutral-200 shadow-sm hover:shadow-md transition overflow-hidden">
              <div className="relative">
                <img
                  src={normalizeUrl(p.img)}
                  alt={p.name}
                  className="h-56 w-full object-cover"
                  style={{ imageRendering: "auto" }}
                  onError={(e) => { (e.currentTarget as HTMLImageElement).src = "/placeholder.png"; }}
                />
                {p.badge && (
                  <div className="absolute left-3 top-3 text-xs px-2 py-1 rounded-full border bg-white/90" style={{ borderColor: "#e5e5e5", color: theme.black }}>
                    {p.badge}
                  </div>
                )}
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold tracking-tight">{p.name}</h3>
                    <p className="text-sm text-neutral-600">{p.notes}</p>
                  </div>
                  <div className="font-medium">{priceFmt(p.price)}</div>
                </div>
                <div className="mt-4 flex gap-2">
                  <button
                    disabled={out}
                    className="flex-1 px-4 py-2 rounded-xl text-sm font-medium shadow bg-clip-padding transition hover:brightness-[1.04] hover:shadow-md disabled:opacity-50"
                    style={{ backgroundImage: `linear-gradient(135deg, ${theme.roseMetalStart}, ${theme.roseMetalMid} 40%, ${theme.roseMetalDeep})`, color: theme.white }}
                    onClick={() =>
                      cart.add({ id: idFromName(p.name), name: p.name, price: p.price, image: p.img }, p.defaultQty ?? 1)
                    }
                  >
                    {out ? "Sold out" : "Add to cart"}
                  </button>
                  <button className="px-4 py-2 rounded-xl border text-sm" style={{ borderColor: "#e5e5e5" }}>
                    Details
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 text-center text-sm text-neutral-600">
        *Candles are 8oz / ~45hr burn • 16oz 3-wick available.
      </div>
    </section>
  );
  const SectionShop = React.memo(SectionShopBase);

  function SectionAbout() {
    return (
      <section id="about" className="bg-white border-y" style={{ borderColor: "#e5e5e5" }}>
        <div className="max-w-6xl mx-auto px-4 py-16 grid md:grid-cols-3 gap-8">
          <div className="md:col-span-1">
            <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">About Jen</h2>
            <p className="text-neutral-600 mt-2">A maker’s heart and a nose for cozy — every candle is hand-poured with care.</p>
          </div>
          <div className="md:col-span-2 grid sm:grid-cols-2 gap-6">
            {[
              { t: "Clean ingredients", d: "Soy-blend wax, phthalate-free oils, cotton wicks." },
              { t: "Small batches", d: "Slow pour, careful cure (7–14 days) for amazing hot throw." },
              { t: "Test burned", d: "Each batch is test-burned for safety and performance." },
              { t: "Eco-minded", d: "Recyclable glass, paper labels, biodegradable fill." },
            ].map((i) => (
              <div key={i.t} className="rounded-2xl p-5 ring-1 ring-neutral-200" style={{ background: theme.cream }}>
                <div className="text-base font-semibold">{i.t}</div>
                <div className="text-sm text-neutral-700 mt-1">{i.d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  function SectionSocial() {
    const hasFb = !!cfg.social.facebook;
    return (
      <section className="max-w-6xl mx-auto px-4 py-16">
        <div className="rounded-3xl overflow-hidden ring-1 ring-neutral-200 bg-white p-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <div className="text-sm font-semibold">Follow along</div>
              <div className="text-sm text-neutral-600">Behind-the-scenes pours, wicks, tests & restocks.</div>
            </div>
            <div className="flex items-center gap-2">
              <a href={cfg.social.tiktok} target="_blank" rel="noreferrer" className="px-4 py-2 rounded-xl border text-sm font-medium" style={{ borderColor: "#e5e5e5" }}>
                TikTok
              </a>
              <a href={cfg.social.facebook} target="_blank" rel="noreferrer" className="px-4 py-2 rounded-xl border text-sm font-medium" style={{ borderColor: "#e5e5e5" }}>
                Facebook
              </a>
            </div>
          </div>

          <div className="mt-4 grid md:grid-cols-2 gap-4">
            <TikTokEmbed url={cfg.social.tiktokPost || ""} ratio="9/16" />
            {hasFb ? (
              <FacebookEmbed url={cfg.social.facebook} kind="timeline" ratio="9/16" className="shadow-sm" />
            ) : (
              <div className="rounded-2xl bg-neutral-100 grid place-items-center text-neutral-500 text-sm aspect-[9/16]">
                Add your Facebook page URL in the admin panel to show the feed.
              </div>
            )}
          </div>
        </div>
      </section>
    );
  }

  function SectionShipping() {
    return (
      <section id="shipping" className="bg-white border-y" style={{ borderColor: "#e5e5e5" }}>
        <div className="max-w-6xl mx-auto px-4 py-16 grid md:grid-cols-3 gap-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">Shipping & Returns</h2>
            <p className="text-neutral-600 mt-2">Simple, transparent, and candle-friendly.</p>
          </div>
          <div className="md:col-span-2 grid sm:grid-cols-2 gap-6 text-sm text-neutral-700">
            <div className="rounded-2xl p-5 ring-1 ring-neutral-200">
              <div className="font-semibold">Shipping</div>
              <ul className="mt-2 space-y-2">
                <li>• Free U.S. shipping on orders $50+</li>
                <li>• Flat rate under $50</li>
                <li>• Orders ship in 2–4 business days</li>
              </ul>
            </div>
            <div className="rounded-2xl p-5 ring-1 ring-neutral-200">
              <div className="font-semibold">Returns</div>
              <ul className="mt-2 space-y-2">
                <li>• 30-day easy exchanges on unused items</li>
                <li>• If damaged in transit, we’ll replace it</li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    );
  }

  function SectionContact() {
    return (
      <section id="contact" className="bg-white">
        <div className="max-w-6xl mx-auto px-4 py-16 grid md:grid-cols-2 gap-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">Wholesale & Custom</h2>
            <p className="text-neutral-600 mt-2">Boutiques, corporate gifts, wedding favors — we’d love to collaborate.</p>
            <ul className="mt-4 text-neutral-700 text-sm space-y-2">
              <li>▪️ Minimums start at 24 units per scent</li>
              <li>▪️ 2–3 week lead time for customs</li>
              <li>▪️ Private label available</li>
            </ul>
          </div>
          <form className="rounded-2xl p-6 ring-1 ring-neutral-200" style={{ background: theme.cream }}>
            <div className="grid sm:grid-cols-2 gap-4">
              <input placeholder="Name" className="px-4 py-3 rounded-xl ring-1 ring-neutral-300 focus:ring-2 outline-none" />
              <input placeholder="Email" className="px-4 py-3 rounded-xl ring-1 ring-neutral-300 focus:ring-2 outline-none" />
            </div>
            <input placeholder="Subject" className="mt-4 w-full px-4 py-3 rounded-xl ring-1 ring-neutral-300 focus:ring-2 outline-none" />
            <textarea placeholder="Tell us about your project" rows={5} className="mt-4 w-full px-4 py-3 rounded-xl ring-1 ring-neutral-300 focus:ring-2 outline-none" />
            <button type="button" className="mt-4 px-5 py-3 rounded-xl font-medium"
              style={{ backgroundImage: `linear-gradient(135deg, ${theme.roseMetalStart}, ${theme.roseMetalMid} 40%, ${theme.roseMetalDeep})`, color: theme.white }}>
              Send
            </button>
          </form>
        </div>
      </section>
    );
  }

  /** ===== Section map ===== */
  const SectionMap: Record<SectionId, React.ComponentType> = {
    hero: SectionHero,
    shop: SectionShop,
    about: SectionAbout,
    social: SectionSocial,
    shipping: SectionShipping,
    contact: SectionContact,
  };

  /** ===== Admin Panel ===== */
  function AdminPanel() {
    if (!admin) return null;

    return (
      <div className="sticky top-14 z-20 bg-white/95 backdrop-blur border-b" style={{ borderColor: "#e5e5e5" }}>
        <div className="max-w-6xl mx-auto px-4 py-4 grid md:grid-cols-3 gap-6">
          {/* Left: tabs + reset */}
          <div>
            <div className="text-sm font-semibold">Edit section</div>
            <div className="mt-2 flex flex-wrap gap-2">
              {cfg.order.map((id) => (
                <button
                  key={id}
                  className={`px-2 py-1 rounded text-sm ${
                    activeSection === id ? "bg-neutral-900 text-white" : "bg-neutral-100"
                  }`}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => setActiveSection(id)}
                  type="button"
                >
                  {id}
                </button>
              ))}
            </div>

            <div className="mt-3">
              <label className="text-xs flex items-center gap-2">
                <span>Header CTA</span>
                <input
                  className="px-2 py-1 rounded border"
                  style={{ borderColor: "#e5e5e5" }}
                  value={cfg.header.ctaLabel}
                  onChange={(e) => setCfgField("header", { ...cfg.header, ctaLabel: e.target.value })}
                />
              </label>
            </div>

            <button
              className="mt-3 px-3 py-2 rounded border"
              style={{ borderColor: "#e5e5e5" }}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                window.localStorage.removeItem(STORAGE_KEY);
                setCfg({ ...defaultConfig, products: withStableIds(defaultConfig.products) });
                setActiveSection("hero");
              }}
              type="button"
            >
              Reset
            </button>
          </div>

          {/* Right: Editors */}
          <div className="md:col-span-2">
            <div className="text-sm font-semibold mb-2">
              Edit content — <span className="opacity-70">{activeSection}</span>
            </div>

            {/* ===== HERO ===== */}
            {activeSection === "hero" && (
              <div className="grid gap-3 mb-8">
                <input
                  className="px-3 py-2 rounded border"
                  style={{ borderColor: "#e5e5e5" }}
                  value={cfg.hero.heading}
                  onChange={(e) => setCfgField("hero", { ...cfg.hero, heading: e.target.value })}
                  placeholder="Hero heading"
                />
                <input
                  className="px-3 py-2 rounded border"
                  style={{ borderColor: "#e5e5e5" }}
                  value={cfg.hero.subheading}
                  onChange={(e) => setCfgField("hero", { ...cfg.hero, subheading: e.target.value })}
                  placeholder="Hero subheading"
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    className="px-3 py-2 rounded border"
                    style={{ borderColor: "#e5e5e5" }}
                    value={cfg.hero.ctaText}
                    onChange={(e) => setCfgField("hero", { ...cfg.hero, ctaText: e.target.value })}
                    placeholder="Primary CTA"
                  />
                  <input
                    className="px-3 py-2 rounded border"
                    style={{ borderColor: "#e5e5e5" }}
                    value={cfg.hero.ctaSecondary}
                    onChange={(e) => setCfgField("hero", { ...cfg.hero, ctaSecondary: e.target.value })}
                    placeholder="Secondary CTA"
                  />
                </div>

                {/* Hero image */}
                <div className="grid gap-2">
                  <label className="text-xs font-medium">Hero image</label>
                  <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => onDropToField(e, null, (v) => setCfgField("hero", { ...cfg.hero, img: v }))}
                    className="rounded border p-3 text-sm bg-neutral-50"
                    style={{ borderColor: "#e5e5e5" }}
                    title="Drag an image here"
                  >
                    <div className="flex gap-3">
                      <input
                        className="flex-1 px-3 py-2 rounded border bg-white"
                        style={{ borderColor: "#e5e5e5" }}
                        value={cfg.hero.img}
                        onChange={(e) => setCfgField("hero", { ...cfg.hero, img: e.target.value })}
                        placeholder="/images/jen/hero.jpg or https://…"
                      />
                      <label className="px-3 py-2 rounded border cursor-pointer" style={{ borderColor: "#e5e5e5" }}>
                        {uploading["adhoc"] ? "Uploading…" : "Browse…"}
                        <input type="file" accept="image/*" hidden onChange={(ev) => onBrowseFile(ev, null, (v) => setCfgField("hero", { ...cfg.hero, img: v }))} />
                      </label>
                    </div>
                    {isBlobUrl(cfg.hero.img) && (
                      <div className="text-xs text-red-600 mt-1">Finish upload first (no blob URLs).</div>
                    )}
                  </div>
                </div>

                {/* Decor image controls */}
                <div className="mt-4 grid gap-2">
                  <div className="text-xs font-medium">Decorative image (left of heading)</div>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 text-xs">
                      <input
                        type="checkbox"
                        checked={cfg.heroDecor.visible}
                        onChange={(e) => setCfgField("heroDecor", { ...cfg.heroDecor, visible: e.target.checked })}
                      />
                      Visible
                    </label>

                    <select
                      className="px-2 py-1 rounded border text-xs"
                      style={{ borderColor: "#e5e5e5" }}
                      value={cfg.heroDecor.shape}
                      onChange={(e) =>
                        setCfgField("heroDecor", { ...cfg.heroDecor, shape: e.target.value as HeroDecor["shape"] })
                      }
                    >
                      <option value="circle">Circle</option>
                      <option value="rounded">Rounded</option>
                    </select>
                  </div>

                  <div className="grid sm:grid-cols-3 gap-3">
                    <label className="text-xs">
                      <div>X offset (px)</div>
                      <input
                        type="number"
                        className="w-full px-2 py-1 rounded border"
                        style={{ borderColor: "#e5e5e5" }}
                        value={cfg.heroDecor.x}
                        onChange={(e) => setCfgField("heroDecor", { ...cfg.heroDecor, x: Number(e.target.value) })}
                      />
                    </label>
                    <label className="text-xs">
                      <div>Y offset (px)</div>
                      <input
                        type="number"
                        className="w-full px-2 py-1 rounded border"
                        style={{ borderColor: "#e5e5e5" }}
                        value={cfg.heroDecor.y}
                        onChange={(e) => setCfgField("heroDecor", { ...cfg.heroDecor, y: Number(e.target.value) })}
                      />
                    </label>
                    <label className="text-xs">
                      <div>Size (px)</div>
                      <input
                        type="number"
                        className="w-full px-2 py-1 rounded border"
                        style={{ borderColor: "#e5e5e5" }}
                        value={cfg.heroDecor.size}
                        onChange={(e) =>
                          setCfgField("heroDecor", {
                            ...cfg.heroDecor,
                            size: Math.max(60, Number(e.target.value || 60)),
                          })
                        }
                      />
                    </label>
                  </div>

                  <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => onDropToField(e, null, (v) => setCfgField("heroDecor", { ...cfg.heroDecor, img: v }))}
                    className="rounded border p-3 text-sm bg-neutral-50"
                    style={{ borderColor: "#e5e5e5" }}
                    title="Drag an image here"
                  >
                    <div className="flex gap-3">
                      <input
                        className="flex-1 px-2 py-1 rounded border bg-white"
                        style={{ borderColor: "#e5e5e5" }}
                        value={cfg.heroDecor.img}
                        onChange={(e) => setCfgField("heroDecor", { ...cfg.heroDecor, img: e.target.value })}
                        placeholder="/images/… or https://…"
                      />
                      <label className="px-2 py-1 rounded border cursor-pointer text-sm" style={{ borderColor: "#e5e5e5" }}>
                        {uploading["adhoc"] ? "Uploading…" : "Browse…"}
                        <input
                          type="file"
                          accept="image/*"
                          hidden
                          onChange={(ev) =>
                            onBrowseFile(ev, null, (v) => setCfgField("heroDecor", { ...cfg.heroDecor, img: v }))
                          }
                        />
                      </label>
                    </div>
                    {isBlobUrl(cfg.heroDecor.img) && (
                      <div className="text-xs text-red-600 mt-1">Finish upload first (no blob URLs).</div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ===== SHOP ===== */}
            {activeSection === "shop" && (
              <div className="grid gap-4">
                <div className="flex justify-end">
                  <button
                    className="px-3 py-2 rounded border text-sm"
                    style={{ borderColor: "#e5e5e5" }}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={addProduct}
                    type="button"
                  >
                    + Add product
                  </button>
                </div>

                {cfg.products.map((p, i) => (
                  <div
                    key={p.id}
                    className="grid grid-cols-2 md:grid-cols-9 gap-2 items-center p-2 rounded border"
                    style={{ borderColor: "#f0f0f0" }}
                  >
                    <input
                      ref={(el) => { nameRefs.current[p.id] = el; inputRefs.current[p.id] ||= {}; inputRefs.current[p.id].name = el; }}
                      className="px-2 py-1 rounded border md:col-span-2"
                      style={{ borderColor: "#e5e5e5" }}
                      value={p.name}
                      onChange={(e) => { captureCaret(p.id, "name", e); handleProductChange(i, "name", e.target.value); }}
                      placeholder="Name"
                    />
                    <input
                      ref={(el) => { inputRefs.current[p.id] ||= {}; inputRefs.current[p.id].notes = el; }}
                      className="px-2 py-1 rounded border md:col-span-3"
                      style={{ borderColor: "#e5e5e5" }}
                      value={p.notes}
                      onChange={(e) => { captureCaret(p.id, "notes", e); handleProductChange(i, "notes", e.target.value); }}
                      placeholder="Notes"
                    />
                    <input
                      ref={(el) => { inputRefs.current[p.id] ||= {}; inputRefs.current[p.id].price = el; }}
                      className="px-2 py-1 rounded border"
                      style={{ borderColor: "#e5e5e5" }}
                      type="number"
                      step="0.01"
                      value={p.price}
                      onChange={(e) => { captureCaret(p.id, "price", e); handleProductChange(i, "price", e.target.value === "" ? 0 : parseFloat(e.target.value)); }}
                      placeholder="Price"
                    />
                    <input
                      ref={(el) => { inputRefs.current[p.id] ||= {}; inputRefs.current[p.id].badge = el; }}
                      className="px-2 py-1 rounded border"
                      style={{ borderColor: "#e5e5e5" }}
                      value={p.badge ?? ""}
                      onChange={(e) => { captureCaret(p.id, "badge", e); handleProductChange(i, "badge", e.target.value); }}
                      placeholder="Badge"
                    />
                    <input
                      ref={(el) => { inputRefs.current[p.id] ||= {}; inputRefs.current[p.id].defaultQty = el; }}
                      className="px-2 py-1 rounded border"
                      style={{ borderColor: "#e5e5e5" }}
                      type="number"
                      min={1}
                      step={1}
                      value={p.defaultQty ?? 1}
                      onChange={(e) => { captureCaret(p.id, "defaultQty", e); handleProductChange(i, "defaultQty", Math.max(1, Number(e.target.value || 1))); }}
                      placeholder="Qty (add to cart)"
                    />
                    <div
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => onDropToField(e, i)}
                      className="md:col-span-3 rounded border p-1 bg-neutral-50"
                      style={{ borderColor: "#e5e5e5" }}
                      title="Drag an image here"
                    >
                      <div className="flex gap-3">
                        <input
                          ref={(el) => { inputRefs.current[p.id] ||= {}; inputRefs.current[p.id].img = el; }}
                          className="flex-1 px-2 py-1 rounded border bg-white"
                          style={{ borderColor: "#e5e5e5" }}
                          value={p.img}
                          onChange={(e) => { captureCaret(p.id, "img", e); handleProductChange(i, "img", e.target.value); }}
                          placeholder="/images/… or https://…"
                        />
                        <label className="px-2 py-1 rounded border cursor-pointer text-sm" style={{ borderColor: "#e5e5e5" }}>
                          {uploading[`product:${i}:img`] ? "Uploading…" : "Browse…"}
                          <input type="file" accept="image/*" hidden onChange={(ev) => onBrowseFile(ev, i)} />
                        </label>
                      </div>
                      {isBlobUrl(p.img) && (
                        <div className="text-xs text-red-600 mt-1">Finish upload first (no blob URLs).</div>
                      )}
                    </div>
                    <div className="flex justify-end ml-3 md:ml-0">
                      <button
                        className="px-2 py-1 text-xs rounded border text-red-600"
                        style={{ borderColor: "#e5e5e5" }}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => removeProduct(i)}
                        type="button"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}

                <div className="flex gap-2">
                  <button
                    className="px-3 py-2 rounded text-white"
                    style={{ background: theme.black }}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => saveCfg()}
                  >
                    Save changes
                  </button>
                  <button
                    className="px-3 py-2 rounded border"
                    style={{ borderColor: "#e5e5e5" }}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => setCfg({ ...defaultConfig, products: withStableIds(defaultConfig.products) })}
                  >
                    Discard
                  </button>
                </div>
              </div>
            )}

            {/* ===== SOCIAL ===== */}
            {activeSection === "social" && (
              <div className="grid gap-3">
                <input
                  className="px-3 py-2 rounded border"
                  style={{ borderColor: "#e5e5e5" }}
                  value={cfg.social.tiktok}
                  onChange={(e) => setCfgField("social", { ...cfg.social, tiktok: e.target.value })}
                  placeholder="TikTok profile URL"
                />
                <input
                  className="px-3 py-2 rounded border"
                  style={{ borderColor: "#e5e5e5" }}
                  value={cfg.social.facebook}
                  onChange={(e) => setCfgField("social", { ...cfg.social, facebook: e.target.value })}
                  placeholder="Facebook page URL"
                />
                <input
                  className="px-3 py-2 rounded border"
                  style={{ borderColor: "#e5e5e5" }}
                  value={cfg.social.tiktokPost || ""}
                  onChange={(e) => setCfgField("social", { ...cfg.social, tiktokPost: e.target.value })}
                  placeholder="TikTok post URL to embed"
                />
              </div>
            )}

            {/* ===== SHIPPING / CONTACT ===== */}
            {activeSection === "shipping" && (
              <div className="text-sm text-neutral-600">Shipping content is static for now.</div>
            )}
            {activeSection === "contact" && (
              <div className="text-sm text-neutral-600">Contact form is static for now.</div>
            )}
          </div>
        </div>
      </div>
    );
  }

  /** ===== RENDER ===== */
  const social = cfg.social;

  return (
    <div className="min-h-screen" style={{ color: theme.black, backgroundColor: "#fffff0" }}>
      {/* Announcement */}
      <div className="w-full text-center text-xs md:text-sm py-2" style={{ background: theme.black, color: theme.white }}>
        ✨ Free shipping on orders $50+ • Hand-poured in Georgia
      </div>

      <header
  className="sticky top-0 z-30 backdrop-blur supports-[backdrop-filter]:bg-white/70 bg-white/80 border-b"
  style={{ borderColor: "#e5e5e5" }}
>
  <div className="max-w-6xl mx-auto px-3 sm:px-4 py-3 sm:py-4 flex items-center justify-between">
    <div className="flex items-center gap-3">
      <img
        src={normalizeUrl(cfg.logo?.src)}
        alt={cfg.logo?.alt || "Logo"}
        className="h-8 w-8 sm:h-9 sm:w-9 rounded-full ring-1 ring-black/5 object-contain bg-white"
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).src = "/placeholder.png";
        }}
      />

      {/* Title text */}
      <div className="flex flex-col leading-tight">
        <span className="text-lg sm:text-xl font-semibold" style={{ color: theme.black }}>
          Jenny Bee's
        </span>
        <span className="text-lg sm:text-xl font-semibold -mt-1" style={{ color: theme.black }}>
          Creation
        </span>
      </div>
    </div>

    {/* Buttons */}
    <div className="flex items-center gap-2 sm:gap-3">
      <a
        href={cfg.social?.tiktok}
        className="px-3 sm:px-4 py-2 rounded-xl border text-sm sm:text-base"
        style={{ borderColor: "#e5e5e5" }}
      >
        TikTok
      </a>

      <a
        href="#shop"
        className="px-3 sm:px-4 py-2 rounded-xl text-sm sm:text-base shadow bg-clip-padding"
        style={{
          backgroundImage: `linear-gradient(135deg, ${theme.roseMetalStart}, ${theme.roseMetalMid} 40%, ${theme.roseMetalDeep})`,
          color: theme.white,
        }}
      >
        Shop Now
      </a>

      <button
  type="button"
  onClick={() => cart.setOpen(true)}
  className="px-3 sm:px-4 py-2 rounded-xl border text-sm sm:text-base font-medium shadow-sm bg-white/80 hover:bg-white transition"
  style={{ borderColor: "#e5e5e5" }}
>
  Cart ({cartCount})
</button>

    </div>
  </div>
</header>


      {/* ADMIN */}
      <AdminPanel />

      {/* CONTENT */}
      {cfg.order.map((id) => {
        const key = id as SectionId;
        const Comp = SectionMap[key];
        const hidden = !!cfg.hidden[key];
        if (!Comp || hidden) return null;
        return <div key={key}><Comp /></div>;
      })}

      {/* Footer */}
      <footer className="text-neutral-300 pt-1" style={{ background: theme.black }}>
        <div className="max-w-6xl mx-auto px-4 py-12 grid sm:grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <div className="text-white font-semibold">Jenny Bee&apos;s Creation</div>
            <p className="mt-2 text-sm text-neutral-400">Hand-poured candles and wax melts that make home feel like home.</p>
          </div>
          <div>
            <div className="text-white font-semibold">Shop</div>
            <ul className="mt-2 text-sm space-y-2">
              <li><a href="#shop" className="hover:underline">Candles</a></li>
              <li><a href="#shop" className="hover:underline">Wax Melts</a></li>
              <li><a href="#shop" className="hover:underline">Gift Sets</a></li>
            </ul>
          </div>
          <div>
            <div className="text-white font-semibold">Company</div>
            <ul className="mt-2 text-sm space-y-2">
              <li><a href="#about" className="hover:underline">About</a></li>
              <li><a href="#shipping" className="hover:underline">Shipping</a></li>
              <li><a href="#contact" className="hover:underline">Contact</a></li>
            </ul>
          </div>
          <div>
            <div className="text-white font-semibold">Stay in the loop</div>
            <form className="mt-2 flex gap-2">
              <input placeholder="Email address" className="flex-1 px-3 py-2 rounded-lg bg-neutral-900 ring-1 ring-neutral-700 focus:ring-2 outline-none" />
              <button className="px-3 py-2 rounded-lg font-medium"
                style={{ backgroundImage: `linear-gradient(135deg, ${theme.roseMetalStart}, ${theme.roseMetalMid} 40%, ${theme.roseMetalDeep})`, color: theme.white }}>
                Join
              </button>
            </form>
            <div className="mt-3 text-xs text-neutral-500">
              © {new Date().getFullYear()} Jenny Bee&apos;s Creation — All rights reserved.
            </div>
          </div>
        </div>
      </footer>

      {/* Cart Drawer */}
      <CartDrawer />
    </div>
  );
}
