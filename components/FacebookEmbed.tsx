"use client";

import React from "react";

type Props = {
  url: string;
};

export default function FacebookEmbed({ url }: Props) {
  if (!url) return null;

  return (
    <div className="w-full flex justify-center">
      <div className="w-full max-w-md aspect-video">
        <iframe
          src={url}
          title="Facebook embed"
          className="w-full h-full"
          style={{ border: "none", overflow: "hidden" }}
          scrolling="no"
          allow="encrypted-media; clipboard-write; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>
    </div>
  );
}
