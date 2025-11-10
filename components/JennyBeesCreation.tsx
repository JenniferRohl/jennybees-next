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
  img: string;
  badge?: string;
  defaultQty?: number;
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

/** ===== DEFAULT CONFIG ===== */
const defaultConfig: Config = {
  order: ["hero", "shop", "about", "social", "shipping", "contact"],
  hidden: { hero: false, shop: false, about: false, social: false, shipping: false, contact: false },
  header: { ctaLabel: "Shop Now" },
  logo: { src: "/images/logo.png", alt: "Jenny Bee's Creation logo" },
  hero: {
    heading: "Hand-Poured Candles That Bring Charm And Whimsy To Your Home!",
    subheading: "Clean soy-coconut wax • phthalate-free fragrance • cotton wicks. Made by Jen in small batches.",
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

/** ===== Reusable upload field (drag, browse, preview) ===== */
function ImageUploadField({
  label,
  value,
  onChange,
  onDropFile,
  className = "",
  note,
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
  onDropFile: (file: File) => Promise<string>;
  className?: string;
  note?: string;
}) {
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const [dragging, setDragging] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);

  const handleFiles = async (file?: File) => {
    setErr(null);
    if (!file) return;
    if (!file.type.startsWith("image/")) { setErr("Please select an image."); return; }
    // instant preview while uploading
    const preview = URL.createObjectURL(file);
    onChange(preview);
    setBusy(true);
    try {
      const finalUrl = await onDropFile(file); // server upload -> final https URL
      onChange(finalUrl);
    } catch (e: any) {
      setErr(e?.message || "Upload failed");
    } finally {
      setBusy(false);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    void handleFiles(file);
  };

  const onBrowse = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    void handleFiles(file);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className={className}>
      <div className="text-xs font-medium mb-1">{label}</div>

      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`rounded-2xl border bg-neutral-50 p-3 transition ${
          dragging ? "border-neutral-400 bg-neutral-100" : "border-neutral-200"
        }`}
      >
        {value ? (
          <div className="flex items-center gap-3">
            <img src={value} alt="preview" className="w-16 h-16 rounded object-cover ring-1 ring-black/5 bg-white" />
            <div className="flex gap-2">
              <button
                type="button"
                className="px-3 py-2 rounded-xl border text-sm"
                onClick={() => inputRef.current?.click()}
              >
                {busy ? "Uploading…" : "Replace"}
              </button>
              <button
                type="button"
                className="px-3 py-2 rounded-xl border text-sm"
                onClick={() => onChange("")}
              >
                Remove
              </button>
            </div>
          </div>
        ) : (
          <div className="grid place-items-center text-sm text-neutral-600 py-6">
            <div>Drag an image here, or</div>
            <button
              type="button"
              className="mt-2 px-3 py-2 rounded-xl border"
              onClick={() => inputRef.current?.click()}
            >
              {busy ? "Uploading…" : "Browse…"}
            </button>
          </div>
        )}

        <input ref={inputRef} type="file" accept="image/*" hidden onChange={onBrowse} />
      </div>

      {note && <div className="text-xs text-neutral-500 mt-1">{note}</div>}
      {err && <div className="text-xs text-red-600 mt-1">{err}</div>}
    </div>
  );
}

/** ===== Server upload helper -> final HTTPS URL ===== */
async function uploadFile(file: File): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("filename", file.name || "upload.bin");
  const res = await fetch("/api/upload", { method: "POST", body: fd });
  if (!res.ok) throw new Error(`Upload failed (${res.status})`);
  const json = await res.json();
  return String(json?.url || "");
}

export default function JennyBeesCreation() {
  const cart = useCart();

  /** Admin from URL (SSR-safe, no window usage) */
  const searchParams = useSearchParams();
  const admin = searchParams.get("admin") === "1";

  /** Config state — start from defaults, then hydrate from localStorage in an effect */
  const [cfg, setCfg] = React.useState<Config>(() => ({
    ...defaultConfig,
    products: withStableIds(defaultConfig.products),
  }));

  /** Which editor tab is open in Admin */
  const [activeSection, setActiveSection] = React.useState<SectionId>("hero");

  /** Load from localStorage once on mount */
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

  /** Load from server config once on mount (merges over defaults/local preview) */
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

  /** Debounced preview writer (prevents focus jank while typing) */
  const previewTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const writePreview = React.useCallback((next: Config) => {
    if (previewTimer.current) clearTimeout(previewTimer.current);
    previewTimer.current = setTimeout(() => {
      try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
    }, 250);
  }, []);

  /** Save (localStorage + server) */
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
      alert("Saved ✔");
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

  // caret lock to keep cursor stable while typing
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
                src={decor.img}
                alt="Decor"
                className={`${decor.shape === "circle" ? "rounded-full" : "rounded-3xl"} ring-4 ring-white shadow-xl absolute`}
                style={{
                  width: decor.size,
                  height: decor.size,
                  transform: `translate(${decor.x}px, ${decor.y}px)`,
                  left: 0,
                  top: 0,
                }}
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
              <img src={cfg.hero.img} alt="Jen's candles hero" className="h-full w-full object-cover" />
            </div>
          </div>
        </div>
      </section>
    );
  }

  /** Shop section (memoized) */
  const SectionShopBase: React.FC = () => (
    <section id="shop" className="max-w-6xl mx-auto px-4 py-16">
      <div className="flex items-end justify-between mb-8">
        <div>
          <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">Shop</h2>
          <p className="text-neutral-600 mt-1">Seasonal and core scents — small batches sell out fast.</p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {cfg.products.map((p) => (
          <div key={p.id} className="group rounded-3xl bg-white ring-1 ring-neutral-200 shadow-sm hover:shadow-md transition overflow-hidden">
            <div className="relative">
              <img src={p.img} alt={p.name} className="h-56 w-full object-cover" />
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
                  className="flex-1 px-4 py-2 rounded-xl text-sm font-medium shadow bg-clip-padding transition hover:brightness-[1.04] hover:shadow-md"
                  style={{ backgroundImage: `linear-gradient(135deg, ${theme.roseMetalStart}, ${theme.roseMetalMid} 40%, ${theme.roseMetalDeep})`, color: theme.white }}
                  onClick={() =>
                    cart.add({ id: idFromName(p.name), name: p.name, price: p.price, image: p.img }, p.defaultQty ?? 1)
                  }
                >
                  Add to cart
                </button>
                <button className="px-4 py-2 rounded-xl border text-sm" style={{ borderColor: "#e5e5e5" }}>
                  Details
                </button>
              </div>
            </div>
          </div>
        ))}
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
              { t: "Clean ingredients", d: "Soy-coconut wax, phthalate-free oils, cotton wicks." },
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
                <li>• Free U.S. shipping on orders $35+</li>
                <li>• Flat rate under $35</li>
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

                <ImageUploadField
                  label="Hero image"
                  value={cfg.hero.img}
                  onChange={(url) => setCfgField("hero", { ...cfg.hero, img: url })}
                  onDropFile={uploadFile}
                />

                {/* Decor image controls */}
                <div className="mt-4 grid gap-2">
                  <ImageUploadField
                    label="Decorative image (left of heading)"
                    value={cfg.heroDecor.img}
                    onChange={(url) => setCfgField("heroDecor", { ...cfg.heroDecor, img: url })}
                    onDropFile={uploadFile}
                    note="Tip: try 200–260px size; use the X/Y controls below to position."
                  />

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
                      placeholder="Qty"
                    />

                    <div className="md:col-span-3">
                      <ImageUploadField
                        label="Product image"
                        value={p.img}
                        onChange={(url) => handleProductChange(i, "img", url)}
                        onDropFile={uploadFile}
                      />
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
        ✨ Free shipping on orders $35+ • Hand-poured in Georgia
      </div>

      {/* Header */}
      <header className="sticky top-0 z-30 backdrop-blur supports-[backdrop-filter]:bg-white/70 bg-white/80 border-b" style={{ borderColor: "#e5e5e5" }}>
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={cfg.logo?.src} alt={cfg.logo?.alt || "Logo"} className="h-9 w-9 rounded-full ring-1 ring-black/5 object-contain bg-white" />
            <div className="flex flex-col">
              <span
                className="text-2xl font-semibold bg-clip-text text-transparent"
                style={{ backgroundImage: `linear-gradient(135deg, ${theme.roseMetalStart}, ${theme.roseMetalMid} 40%, ${theme.roseMetalDeep})` }}
              >
                Jenny Bee&apos;s Creation
              </span>
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm">
            <a href="#shop" className="hover:opacity-80">Shop</a>
            <a href="#about" className="hover:opacity-80">About</a>
            <a href="#shipping" className="hover:opacity-80">Shipping</a>
            <a href="#contact" className="hover:opacity-80">Contact</a>
          </nav>
          <div className="flex items-center gap-2 md:gap-3">
            <a href={social.tiktok} target="_blank" rel="noreferrer" className="px-3 py-2 text-sm rounded-xl border" style={{ borderColor: "#e5e5e5" }}>
              TikTok
            </a>
            <a href={social.facebook} target="_blank" rel="noreferrer" className="px-3 py-2 text-sm rounded-xl border hidden sm:inline-flex" style={{ borderColor: "#e5e5e5" }}>
              Facebook
            </a>
            <a
              href="#shop"
              className="px-4 py-2 text-sm font-medium rounded-xl shadow bg-clip-padding"
              style={{ backgroundImage: `linear-gradient(135deg, ${theme.roseMetalStart}, ${theme.roseMetalMid} 40%, ${theme.roseMetalDeep})`, color: theme.white }}
            >
              {cfg.header.ctaLabel}
            </a>
            <button onClick={() => cart.setOpen(true)} className="px-3 py-2 text-sm rounded-xl border" style={{ borderColor: "#e5e5e5" }}>
              Cart ({cart.items.length})
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
