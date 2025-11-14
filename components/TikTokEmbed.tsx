"use client";

import React from "react";

type Props = {
  url: string;
};

export default function TikTokEmbed({ url }: Props) {
  if (!url) return null;

  return (
    <div className="w-full flex justify-center">
      <div className="w-full max-w-md aspect-[9/16]">
        <iframe
          src={url}
          title="TikTok video"
          className="w-full h-full"
          style={{ border: "none", overflow: "hidden" }}
          allow="autoplay; clipboard-write; encrypted-media; picture-in-picture"
          allowFullScreen
        />
      </div>
    </div>
  );
}
