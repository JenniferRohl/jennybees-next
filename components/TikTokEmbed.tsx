'use client';
import * as React from 'react';

type Props = {
  url: string;            // full TikTok link
  className?: string;
  ratio?: '16/9' | '9/16' | '1/1';
};

function extractVideoId(url: string): string | null {
  // Works for https://www.tiktok.com/@user/video/123... and copied share links
  const m = url.match(/\/video\/(\d+)/);
  return m ? m[1] : null;
}

export default function TikTokEmbed({ url, className, ratio = '9/16' }: Props) {
  const videoId = extractVideoId(url);
  if (!videoId) return null;

  // Use the v2 iframe (cookie-lighter)
  const src = `https://www.tiktok.com/embed/v2/${videoId}?lang=en-US`;

  const [w, h] =
    ratio === '16/9' ? [16, 9] :
    ratio === '1/1'  ? [1, 1]  : [9, 16];

  const paddingTop = `${(h / w) * 100}%`;

  return (
    <div className={className} style={{ position: 'relative', width: '100%', height: 0, paddingTop }}>
      <iframe
        src={src}
        title="TikTok"
        loading="lazy"
        allow="encrypted-media; fullscreen; clipboard-write"
        referrerPolicy="strict-origin-when-cross-origin"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          border: 0,
          overflow: 'hidden'
        }}
      />
    </div>
  );
}
