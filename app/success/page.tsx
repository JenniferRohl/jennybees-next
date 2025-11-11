// app/success/page.tsx
"use client";

import Link from "next/link";
import * as React from "react";

export default function SuccessPage() {
  return (
    <main className="min-h-[70vh] grid place-items-center bg-white">
      <section className="text-center px-6 py-16 max-w-2xl">
        {/* Animated Bee */}
        <div className="mx-auto mb-6 w-28 h-28 relative">
          <Bee />
        </div>

        <h1 className="text-3xl font-semibold mb-3">Thanks! 🎉</h1>
        <p className="text-neutral-700 leading-relaxed">
          We’ve received your order and <strong>Jen is packing up your candles as we speak</strong> 🐝.
          You’ll get a confirmation email and we’ll send tracking as soon as it ships.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-xl px-5 py-3 text-white font-medium bg-rose-400 hover:bg-rose-500 transition"
          >
            Return to Shop
          </Link>

          <a
            href="https://www.tiktok.com/@jennybeescreation"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center rounded-xl px-5 py-3 font-medium border border-rose-300 text-rose-500 hover:bg-rose-50 transition"
            aria-label="Follow Jenny Bees Creation on TikTok"
          >
            Follow on TikTok
          </a>
        </div>
      </section>

      {/* local styles for the bee animation */}
      <style jsx>{`
        .bee {
          position: relative;
          width: 100%;
          height: 100%;
          animation: bob 2.4s ease-in-out infinite;
        }
        .wing {
          transform-origin: 50% 50%;
          animation: flap 0.18s ease-in-out infinite alternate;
        }
        @keyframes flap {
          from { transform: rotate(16deg); opacity: 0.9; }
          to   { transform: rotate(-22deg); opacity: 0.6; }
        }
        @keyframes bob {
          0%   { transform: translateY(0px); }
          50%  { transform: translateY(-8px); }
          100% { transform: translateY(0px); }
        }
      `}</style>
    </main>
  );
}

function Bee() {
  return (
    <svg viewBox="0 0 140 140" className="bee">
      {/* Wings */}
      <ellipse className="wing" cx="45" cy="30" rx="22" ry="16" fill="#e5f4ff" />
      <ellipse className="wing" cx="95" cy="26" rx="22" ry="16" fill="#e5f4ff" />

      {/* Body */}
      <ellipse cx="70" cy="75" rx="46" ry="36" fill="#111" />
      <ellipse cx="70" cy="75" rx="42" ry="32" fill="#ffd166" />
      {/* Stripes */}
      <rect x="35" y="50" width="70" height="10" fill="#111" opacity="0.9" />
      <rect x="35" y="68" width="70" height="10" fill="#111" opacity="0.9" />
      <rect x="35" y="86" width="70" height="10" fill="#111" opacity="0.9" />
      {/* Stinger */}
      <polygon points="116,75 134,75 116,88" fill="#111" />
      {/* Face */}
      <circle cx="54" cy="72" r="4" fill="#111" />
      <circle cx="86" cy="72" r="4" fill="#111" />
      <path d="M58 86 Q70 94 82 86" stroke="#111" strokeWidth="4" fill="none" strokeLinecap="round" />
    </svg>
  );
}
