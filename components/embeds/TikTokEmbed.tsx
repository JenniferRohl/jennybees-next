"use client";

import * as React from "react";

type Props = {
  url: string;
  className?: string;
  height?: number; // px
};

declare global {
  interface Window {
    tiktokEmbed?: { load: () => void };
  }
}

export default function TikTokEmbed({ url, className, height = 420 }: Props) {
  const ref = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    // load TikTok SDK once
    const id = "tiktok-embed-js";
    if (!document.getElementById(id)) {
      const s = document.createElement("script");
      s.id = id;
      s.async = true;
      s.src = "https://www.tiktok.com/embed.js";
      document.body.appendChild(s);
    } else {
      // re-render if already loaded
      setTimeout(() => (window as any)?.tiktokEmbed?.load?.(), 0);
    }
  }, []);

  React.useEffect(() => {
    // re-parse when url/height changes
    setTimeout(() => (window as any)?.tiktokEmbed?.load?.(), 0);
  }, [url, height]);

  return (
    <div
      ref={ref}
      className={className}
      style={{ height, overflow: "hidden", borderRadius: 16, background: "#000" }}
    >
      {url ? (
        <blockquote
          className="tiktok-embed"
          cite={url}
          data-video-id=""
          data-embed-from="embed_page"
          style={{ maxWidth: "100%", minWidth: 320, height }}
        >
          <section>
            <a href={url}> </a>
          </section>
        </blockquote>
      ) : (
        <div
          style={{
            height: "100%",
            display: "grid",
            placeItems: "center",
            color: "#888",
            background: "#f3f3f3",
          }}
        >
          Add a TikTok post URL
        </div>
      )}
    </div>
  );
}
