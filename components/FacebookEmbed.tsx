"use client";

import * as React from "react";

type Ratio = "9/16" | "16/9" | "1/1";

type Props = {
  url: string;                   // Facebook Page or Post URL
  kind?: "timeline" | "post";
  ratio?: Ratio;                 // keeps visual height consistent with TikTok
  className?: string;
  maxWidth?: number;             // optional clamp
  minWidth?: number;             // optional clamp
};

const RATIO_NUMS: Record<Ratio, [number, number]> = {
  "9/16": [9, 16],
  "16/9": [16, 9],
  "1/1": [1, 1],
};

export default function FacebookEmbed({
  url,
  kind = "timeline",
  ratio = "9/16",
  className,
  maxWidth = 720,
  minWidth = 320,
}: Props) {
  const wrapperRef = React.useRef<HTMLDivElement | null>(null);
  const [heightPx, setHeightPx] = React.useState<number>(420);

  // Ensure fb-root and SDK are present
  React.useEffect(() => {
    if (!document.getElementById("fb-root")) {
      const div = document.createElement("div");
      div.id = "fb-root";
      document.body.appendChild(div);
    }
    if (!document.getElementById("facebook-jssdk")) {
      const s = document.createElement("script");
      s.id = "facebook-jssdk";
      s.async = true;
      s.defer = true;
      s.crossOrigin = "anonymous";
      s.src = "https://connect.facebook.net/en_US/sdk.js#xfbml=1&version=v18.0";
      document.body.appendChild(s);
    } else {
      // If already loaded, parse later after we set height
      setTimeout(() => (window as any)?.FB?.XFBML?.parse?.(), 0);
    }
  }, []);

  // Keep a responsive height based on wrapper width and desired ratio
  React.useEffect(() => {
    if (!wrapperRef.current) return;

    const [wNum, hNum] = RATIO_NUMS[ratio];
    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      const width = entry.contentRect.width;
      if (!width) return;
      const h = Math.max(300, Math.round((hNum / wNum) * width)); // min 300px for FB Page plugin
      setHeightPx(h);
      // Re-parse after size changes to let FB recalc iframes
      setTimeout(() => (window as any)?.FB?.XFBML?.parse?.(wrapperRef.current), 0);
    });

    ro.observe(wrapperRef.current);
    return () => ro.disconnect();
  }, [ratio]);

  // Reparse when URL or kind changes
  React.useEffect(() => {
    setTimeout(() => (window as any)?.FB?.XFBML?.parse?.(wrapperRef.current), 0);
  }, [url, kind]);

  return (
    <div
      ref={wrapperRef}
      className={className}
      style={{
        height: heightPx,
        overflow: "hidden",
        borderRadius: 16,
        background: "#fff",
      }}
    >
      {kind === "timeline" ? (
        <div
          className="fb-page"
          data-href={url}
          data-tabs="timeline"
          data-adapt-container-width="true"
          data-hide-cover="false"
          data-show-facepile="true"
          // Facebook requires a pixel value, so we pass our responsive height
          data-height={heightPx}
          style={{ width: "100%", maxWidth, minWidth, height: heightPx }}
        >
          <blockquote cite={url} className="fb-xfbml-parse-ignore">
            <a href={url}>Facebook</a>
          </blockquote>
        </div>
      ) : (
        <div
          className="fb-post"
          data-href={url}
          data-show-text="true"
          data-width="auto"
          style={{ width: "100%", maxWidth, minWidth, height: heightPx }}
        />
      )}
    </div>
  );
}
