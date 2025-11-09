"use client";

import * as React from "react";

type Product = {
  name: string;
  img: string;
  price: number;
  priceId?: string;
  desc?: string;
};

type Hero = {
  img: string;
  heading: string;
  subheading?: string;
};

type HeroDecor = {
  visible: boolean;
  img: string;
  x: number;
  y: number;
  size: number;
};

type SiteConfig = {
  hero: Hero;
  heroDecor: HeroDecor;
  products: Product[];
};

type CheckoutItem = {
  name: string;
  price?: number;
  priceId?: string;
  quantity: number;
  img?: string;
};

const CONFIG_KEY = "jennybees_config_v6";

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
    { name: "Autumn Whispers", img: "/images/jen/autumn-whispers.jpg", price: 2500, desc: "Spice & orchard notes." }
  ],
};

function toPublicImagePath(file: File, dir = "/images/jen"): string {
  const clean = file.name;
  return `${dir}/${clean}`;
}

export default function JennyBeesCreation(): JSX.Element {

  const [cfg, setCfg] = React.useState<SiteConfig>(DEFAULT_CFG);
  const [imgPreview, setImgPreview] = React.useState<Record<string, string>>({});

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(CONFIG_KEY);
      if (raw) setCfg({ ...DEFAULT_CFG, ...JSON.parse(raw) });
    } catch {}
  }, []);

  React.useEffect(() => {
    try { localStorage.setItem(CONFIG_KEY, JSON.stringify(cfg)); } catch {}
  }, [cfg]);

  function setPreview(path: string, url: string) {
    setImgPreview((prev) => {
      const old = prev[path];
      if (old && old !== url) URL.revokeObjectURL(old);
      return { ...prev, [path]: url };
    });
  }

  function handleProductChange(i: number, key: keyof Product, value: any) {
    setCfg((prev) => {
      const copy = [...prev.products];
      copy[i] = { ...copy[i], [key]: value };
      return { ...prev, products: copy };
    });
  }

  function setCfgField<K extends keyof SiteConfig>(key: K, value: SiteConfig[K]) {
    setCfg((prev) => ({ ...prev, [key]: value }));
  }

  const onBrowseFile = (
    e: React.ChangeEvent<HTMLInputElement>,
    i: number | null,
    setPath?: (v: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;

    const saved = toPublicImagePath(file);
    setPreview(saved, URL.createObjectURL(file));

    if (typeof i === "number") handleProductChange(i, "img", saved);
    else if (setPath) setPath(saved);
  };

  const onDropToField = (
    e: React.DragEvent<HTMLDivElement>,
    i: number | null,
    setPath?: (v: string) => void
  ) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;

    const saved = toPublicImagePath(file);
    setPreview(saved, URL.createObjectURL(file));

    if (typeof i === "number") handleProductChange(i, "img", saved);
    else if (setPath) setPath(saved);
  };

  async function handleCheckout(items: CheckoutItem | CheckoutItem[]) {
    items = Array.isArray(items) ? items : [items];
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ items }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error);
      window.location.href = data.url;
    } catch (err: any) {
      alert("Checkout failed: " + err?.message);
      console.error(err);
    }
  }

  const heroSrc = imgPreview[cfg.hero.img] || cfg.hero.img;
  const decorSrc = imgPreview[cfg.heroDecor.img] || cfg.heroDecor.img;

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">

      <section className="relative">
        <img src={heroSrc} className="w-full h-[420px] object-cover rounded-2xl" />
        {cfg.heroDecor.visible && (
          <img src={decorSrc} style={{
            position: "absolute",
            left: cfg.heroDecor.x,
            top: cfg.heroDecor.y,
            width: cfg.heroDecor.size,
            height: cfg.heroDecor.size,
            borderRadius: "9999px"
          }} />
        )}
        <h1 className="text-center text-3xl font-bold mt-6">{cfg.hero.heading}</h1>
        <p className="text-center text-neutral-600">{cfg.hero.subheading}</p>
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-semibold mb-4">Shop</h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {cfg.products.map((p, i) => (
            <div key={i} className="border rounded-2xl p-3 shadow-sm">
              <img src={imgPreview[p.img] || p.img} className="h-56 w-full object-cover rounded-xl" />
              <div className="mt-3 flex justify-between">
                <div>
                  <div className="font-medium">{p.name}</div>
                  {p.desc && <div className="text-sm text-neutral-600">{p.desc}</div>}
                </div>
                <div className="text-right">
                  <div className="font-semibold">${(p.price / 100).toFixed(2)}</div>
                  <button className="bg-black text-white px-3 py-1 rounded"
                    onClick={() => handleCheckout({ name: p.name, price: p.price, quantity: 1, img: p.img })}
                  >
                    Buy
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Keeping Admin Panel for now */}
      <section className="mt-12 border rounded-2xl p-4">
        <h2 className="text-xl font-semibold mb-2">Admin</h2>

        {/* Hero */}
        <div className="mb-4" onDrop={(e) => onDropToField(e, null, (v) => setCfgField("hero", { ...cfg.hero, img: v }))} onDragOver={(e) => e.preventDefault()}>
          <button onClick={(e) => (e.currentTarget.nextElementSibling as any).click()} className="border px-3 py-1 rounded">Browse…</button>
          <input type="file" accept="image/*" hidden onChange={(e) => onBrowseFile(e, null, (v) => setCfgField("hero", { ...cfg.hero, img: v }))} />
          <input className="border rounded px-2 py-1 ml-3 w-80" value={cfg.hero.img} onChange={(e) => setCfgField("hero", { ...cfg.hero, img: e.target.value })} />
        </div>

      </section>
    </main>
  );
}
