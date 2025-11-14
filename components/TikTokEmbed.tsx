"use client";

type Props = {
  url: string | null;
};

export default function TikTokEmbed({ url }: Props) {
  if (!url) return null;

  return (
    <div className="w-full overflow-hidden rounded-2xl bg-neutral-100 p-2">
      <blockquote
        className="tiktok-embed"
        cite={url}
        data-video-id={url.split("/").pop()}
        style={{ maxWidth: "605px", minWidth: "325px" }}
      >
        <section></section>
      </blockquote>
      <script async src="https://www.tiktok.com/embed.js"></script>
    </div>
  );
}
