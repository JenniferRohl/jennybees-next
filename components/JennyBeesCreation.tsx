"use client";

import * as React from "react";

/** ──────────────────────────────────────────────────────────────
 *  Types & constants
 *  ────────────────────────────────────────────────────────────── */
type Product = {
  name: string;
  img: string;        // always a stable public path (e.g. /images/jen/foo.jpg)
  price: number;      // cents
  priceId?: string;   // Stripe price ID (optional)
  desc?: string;
};

type Hero = {
  img: string;        // stable public path
  heading: string;
  subheading?: string;
};

type HeroDecor = {
  visible: boolean;
  img: string;        // stable public path
  x: number;          // px offset
  y: number;          // px offset
  size: number;       // px
};

type SiteConfig = {
  hero: Hero;
  heroDecor: HeroDecor;
  products: Product[];
};

const CONFIG_KEY = "jennybees_config_v6";
const CART_KEY = "jb_cart_v1";

/** Default config (safe fallback) */
const DEFAULT_CFG: SiteConfig = {
  hero: {
    img: "/images/jen/hero.jpg",
    heading: "Jenny Bee’s Creation",
    subheading: "Small batches. Big smiles.",
  },
  heroDecor: {
    visible: true,
    img: "/images/jen/bee.jpg",
    x: 175,
    y: -200,
    size: 200,
  },
  products: [
    { name: "Forest Ember", img: "/images/jen/forest-ember.jpg", price: 2500, desc: "Smoky cedar & ember glow." },
    { name: "Autumn Whispers", img: "/images/jen/autumn-whispers.jpg", price: 2500, desc: "Spice & orchard notes." },
  ],
};

/** ──────────────────────────────────────────────────────────────
 *  Helper: compute stable public path for a selected file
 *  (Assumes the actual file exists or will be added under /public/images/jen)
 *  ────────────────────────────────────────────────────────────── */
function toPublicImagePath(file: File, dir = "/images/jen"): string {
  // Optionally sanitize file.name:
  // const clean = file.name.toLowerCase().replace(/[^a-z0-9._-]+/g, "-");
  const clean = file.name;
  return `${dir}/${clean}`;
}

/** ──────────────────────────────────────────────────────────────
 *  Main component
 *  ────────────────────────────────────────────────────────────── */
export default function JennyBeesCreation() {
  // Config state
  const [cfg, setCfg] = React.useState<SiteConfig>(DEFAULT_CFG);

  // Preview map: savedPath -> objectURL
  const [imgPreview, setImgPreview] = React.useState<Record<string, string>>({});

  // Load config from localStorage (admin-only convenience)
  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(CONFIG_KEY);
      if (raw) setCfg({ ...DEFAULT_CFG, ...JSON.parse(raw) });
    } catch {}
  }, []);

  // Persist config when it changes (so admin edits stick in browser)
  React.useEffect(() => {
    try {
      localStorage.setItem(CONFIG_KEY, JSON.stringify(cfg));
    } catch {}
  }, [cfg]);

  // Clean up object URLs on unmount
  React.useEffect(() => {
    return () => {
      Object.values(imgPreview).forEach((u) => {
        try { URL.revokeObjectURL(u); } catch {}
      });
    };
  }, [imgPreview]);

  /** Preview helper */
  function setPreview(savedPath: string, objectUrl: string) {
    setImgPreview((prev) => {
      const old = prev[savedPath];
      if (old && old !== objectUrl) {
        try { URL.revokeObjectURL(old); } catch {}
      }
      return { ...prev, [savedPath]: objectUrl };
    });
  }

  /** Update product field */
  function handleProductChange(i: number, key: keyof Product, value: any) {
    setCfg((prev) => {
      const products = [...prev.products];
      const next = { ...products[i], [key]: value };
      products[i] = next;
      return { ...prev, products };
    });
  }

  /** Generic config field setter (e.g., hero.img, heroDecor.visible, etc.) */
  function setCfgField<K extends keyof SiteConfig>(key: K, value: SiteConfig[K]) {
    setCfg((prev) => ({ ...prev, [key]: value }));
  }

  /** ──────────────────────────
   *  FILE HANDLERS (no blob saved)
   *  ────────────────────────── */
  const onBrowseFile = (
    ev: React.ChangeEvent<HTMLInputElement>,
    i: number | null,
    pathSetter?: (v: string) => void
  ) => {
    const file = ev.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("Please choose an image file.");
      return;
    }

    // 1) save a stable public path
    const savedPath = toPublicImagePath(file);

    // 2) show local preview
    const objectUrl = URL.createObjectURL(file);
    setPreview(savedPath, objectUrl);

    if (typeof i === "number") {
      handleProductChange(i, "img", savedPath);
    } else if (pathSetter) {
      pathSetter(savedPath);
    }
  };

  const onDropToField = (
    e: React.DragEvent<HTMLDivElement>,
    i: number | null,
    pathSetter?: (v: string) => void
  ) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("Please drop an image file.");
      return;
    }

    const savedPath = toPublicImagePath(file);
    const objectUrl = URL.createObjectURL(file);
    setPreview(savedPath, objectUrl);

    if (typeof i === "number") {
      handleProductChange(i, "img", savedPath);
    } else if (pathSetter) {
      pathSetter(savedPath);
    }
  };

  /** Stripe checkout (unchanged logic; ensure items use .img public paths) */
  async function handleCheckout(items: Array<Partial<Product>>) {
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ items }),
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) throw new Error(data?.error || "Checkout failed");
      window.location.href = data.url;
    } catch (err: any) {
      alert(`Checkout failed: ${err?.message || err}`);
      console.error(err);
    }
  }

  /** ──────────────────────────
   *  UI pieces
   *  ────────────────────────── */

  function SectionHero() {
    const heroSrc = imgPreview[cfg.hero.img] || cfg.hero.img;
    const decorSrc = imgPreview[cfg.heroDecor.img] || cfg.heroDecor.img;

    return (
      <section className="relative">
        <div className="h-[420px] w-full overflow-hidden rounded-2xl">
          <img
            src={heroSrc}
            alt="Hero"
            className="h-full w-full object-cover"
          />
        </div>

        {cfg.heroDecor.visible && (
          <img
            src={decorSrc}
            alt="Decor"
            style={{
              position: "absolute",
              left: `${cfg.heroDecor.x}px`,
              top: `${cfg.heroDecor.y}px`,
              width: `${cfg.heroDecor.size}px`,
              height: `${cfg.heroDecor.size}px`,
              borderRadius: "9999px",
              boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
            }}
          />
        )}

        <div className="mt-6 space-y-2 text-center">
          <h1 className="text-3xl font-bold">{cfg.hero.heading}</h1>
          {cfg.hero.subheading && (
            <p className="text-neutral-600">{cfg.hero.subheading}</p>
          )}
        </div>
      </section>
    );
  }

  function SectionShopBase() {
    return (
      <section className="mt-12">
        <h2 className="mb-4 text-2xl font-semibold">Shop</h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {cfg.products.map((p, i) => {
            const src = imgPreview[p.img] || p.img;
            return (
              <div key={i} className="rounded-2xl border p-3 shadow-sm">
                <div className="h-56 w-full overflow-hidden rounded-xl">
                  <img src={src} alt={p.name} className="h-full w-full object-cover" />
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <div>
                    <div className="text-lg font-medium">{p.name}</div>
                    {p.desc && <div className="text-sm text-neutral-600">{p.desc}</div>}
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">${(p.price / 100).toFixed(2)}</div>
                    <button
                      className="mt-2 rounded-lg bg-black px-3 py-1 text-white"
                      onClick={() => handleCheckout([{ name: p.name, unit_amount: p.price, quantity: 1, img: p.img }])}
                    >
                      Buy
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    );
  }

  /** Admin panel: minimal controls for images + text */
  function AdminPanel() {
    const fileInputHero = React.useRef<HTMLInputElement | null>(null);
    const fileInputDecor = React.useRef<HTMLInputElement | null>(null);
    const fileInputProducts: React.MutableRefObject<(HTMLInputElement | null)[]> = React.useRef([]);

    const setHeroImg = (v: string) => setCfgField("hero", { ...cfg.hero, img: v });
    const setHeroDecorImg = (v: string) =>
      setCfgField("heroDecor", { ...cfg.heroDecor, img: v });

    return (
      <section className="mt-12 rounded-2xl border p-4">
        <h2 className="mb-2 text-xl font-semibold">Admin</h2>

        {/* Hero image */}
        <div
          className="mb-4 rounded border p-3"
          onDrop={(e) => onDropToField(e, null, setHeroImg)}
          onDragOver={(e) => e.preventDefault()}
        >
          <div className="mb-2 font-medium">Hero image</div>
          <div className="flex items-center gap-3">
            <input
              ref={fileInputHero}
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => onBrowseFile(e, null, setHeroImg)}
            />
            <button
              className="rounded-lg border px-3 py-1"
              onClick={() => fileInputHero.current?.click()}
            >
              Browse…
            </button>
            <input
              className="flex-1 rounded border px-2 py-1"
              value={cfg.hero.img}
              onChange={(e) => setHeroImg(e.target.value)}
              placeholder="/images/jen/hero.jpg"
            />
          </div>
        </div>

        {/* Decor image */}
        <div
          className="mb-4 rounded border p-3"
          onDrop={(e) => onDropToField(e, null, setHeroDecorImg)}
          onDragOver={(e) => e.preventDefault()}
        >
          <div className="mb-2 font-medium">Decor image</div>
          <div className="flex items-center gap-3">
            <input
              ref={fileInputDecor}
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => onBrowseFile(e, null, setHeroDecorImg)}
            />
            <button
              className="rounded-lg border px-3 py-1"
              onClick={() => fileInputDecor.current?.click()}
            >
              Browse…
            </button>
            <input
              className="flex-1 rounded border px-2 py-1"
              value={cfg.heroDecor.img}
              onChange={(e) =>
                setCfgField("heroDecor", { ...cfg.heroDecor, img: e.target.value })
              }
              placeholder="/images/jen/bee.jpg"
            />
          </div>

          <div className="mt-3 grid grid-cols-3 gap-3">
            <label className="flex items-center gap-2">
              <span className="w-16 text-sm text-neutral-600">X</span>
              <input
                type="number"
                className="w-full rounded border px-2 py-1"
                value={cfg.heroDecor.x}
                onChange={(e) =>
                  setCfgField("heroDecor", { ...cfg.heroDecor, x: Number(e.target.value) })
                }
              />
            </label>
            <label className="flex items-center gap-2">
              <span className="w-16 text-sm text-neutral-600">Y</span>
              <input
                type="number"
                className="w-full rounded border px-2 py-1"
                value={cfg.heroDecor.y}
                onChange={(e) =>
                  setCfgField("heroDecor", { ...cfg.heroDecor, y: Number(e.target.value) })
                }
              />
            </label>
            <label className="flex items-center gap-2">
              <span className="w-16 text-sm text-neutral-600">Size</span>
              <input
                type="number"
                className="w-full rounded border px-2 py-1"
                value={cfg.heroDecor.size}
                onChange={(e) =>
                  setCfgField("heroDecor", { ...cfg.heroDecor, size: Number(e.target.value) })
                }
              />
            </label>
          </div>

          <label className="mt-3 flex items-center gap-2">
            <input
              type="checkbox"
              checked={cfg.heroDecor.visible}
              onChange={(e) =>
                setCfgField("heroDecor", { ...cfg.heroDecor, visible: e.target.checked })
              }
            />
            <span>Visible</span>
          </label>
        </div>

        {/* Products */}
        <div className="rounded border p-3">
          <div className="mb-2 font-medium">Products</div>
          <div className="grid gap-4 md:grid-cols-2">
            {cfg.products.map((p, i) => (
              <div key={i} className="rounded-xl border p-3">
                <div
                  className="mb-2 rounded border p-2"
                  onDrop={(e) => onDropToField(e, i)}
                  onDragOver={(e) => e.preventDefault()}
                >
                  <div className="mb-1 text-sm text-neutral-600">Image path</div>
                  <div className="flex items-center gap-3">
                    <input
                      ref={(el) => (fileInputProducts.current[i] = el)}
                      type="file"
                      accept="image/*"
                      hidden
                      onChange={(e) => onBrowseFile(e, i)}
                    />
                    <button
                      className="rounded-lg border px-3 py-1"
                      onClick={() => fileInputProducts.current[i]?.click()}
                    >
                      Browse…
                    </button>
                    <input
                      className="flex-1 rounded border px-2 py-1"
                      value={p.img}
                      onChange={(e) => handleProductChange(i, "img", e.target.value)}
                      placeholder="/images/jen/forest-ember.jpg"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <label className="col-span-2">
                    <div className="mb-1 text-sm text-neutral-600">Name</div>
                    <input
                      className="w-full rounded border px-2 py-1"
                      value={p.name}
                      onChange={(e) => handleProductChange(i, "name", e.target.value)}
                    />
                  </label>

                  <label>
                    <div className="mb-1 text-sm text-neutral-600">Price (USD)</div>
                    <input
                      type="number"
                      className="w-full rounded border px-2 py-1"
                      value={(p.price / 100).toFixed(2)}
                      onChange={(e) =>
                        handleProductChange(
                          i,
                          "price",
                          Math.max(0, Math.round(Number(e.target.value || "0") * 100))
                        )
                      }
                    />
                  </label>

                  <label>
                    <div className="mb-1 text-sm text-neutral-600">Stripe Price ID (optional)</div>
                    <input
                      className="w-full rounded border px-2 py-1"
                      value={p.priceId || ""}
                      onChange={(e) => handleProductChange(i, "priceId", e.target.value)}
                    />
                  </label>

                  <label className="col-span-2">
                    <div className="mb-1 text-sm text-neutral-600">Description</div>
                    <textarea
                      className="w-full rounded border px-2 py-1"
                      rows={2}
                      value={p.desc || ""}
                      onChange={(e) => handleProductChange(i, "desc", e.target.value)}
                    />
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <SectionHero />
      <SectionShopBase />
      {/* Remove AdminPanel on production if you want; keeping it here for now */}
      <AdminPanel />
    </main>
  );
}
