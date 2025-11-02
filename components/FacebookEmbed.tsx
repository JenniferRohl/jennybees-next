"use client";

import * as React from "react";

type Ratio = "9/16" | "16/9" | "1/1";

type Props = {
  /** Facebook Page URL (for timeline) or Post URL (for post) */
  url: string;
  /** Show a page timeline or a specific post */
  kind?: "timeline" | "post";
  /** Keeps height consistent with other embeds */
  ratio?: Ratio;
  className?: string;
  maxWidth?: number;
  minWidth?: number;
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
    const hasSDK = !!document.querySelector('script[src*="connect.facebook.net"]');
    if (!hasSDK) {
      const script = document.createElement("script");
      script.async = true;
      script.defer = true;
      script.crossOrigin = "anonymous";
      script.src = "https://connect.facebook.net/en_US/sdk.js#xfbml=1&version=v21.0";
      document.body.appendChild(script);
      script.onload = () => {
        // @ts-expect-error FB is injected by the SDK
        if (window.FB && wrapperRef.current) window.FB.XFBML.parse(wrapperRef.current);
      };
    } else {
      // @ts-expect-error FB is injected by the SDK
      if (window.FB && wrapperRef.current) window.FB.XFBML.parse(wrapperRef.current);
    }
  }, []);

  // Maintain an aspect-ratio style height
  React.useEffect(() => {
    const [w, h] = RATIO_NUMS[ratio];
    const compute = () => {
      const el = wrapperRef.current;
      const width = Math.max(minWidth, Math.min(maxWidth, el?.clientWidth ?? maxWidth));
      setHeightPx(Math.round((width * h) / w));
    };
    compute();
    const ro = new ResizeObserver(compute);
    if (wrapperRef.current) ro.observe(wrapperRef.current);
    return () => ro.disconnect();
  }, [ratio, maxWidth, minWidth]);

  return (
    <div ref={wrapperRef} className={className} style={{ width: "100%" }}>
      {kind === "timeline" ? (
        <div
          className="fb-page"
          data-href={url}
          data-tabs="timeline"
          data-adapt-container-width="true"
          data-hide-cover="false"
          data-show-facepile="true"
          data-width="auto"
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
