"use client";

type Props = {
  url: string | null;
};

export default function FacebookEmbed({ url }: Props) {
  if (!url) return null;

  return (
    <div className="w-full overflow-hidden rounded-2xl bg-neutral-100 p-2">
      <iframe
        src={`https://www.facebook.com/plugins/post.php?href=${encodeURIComponent(
          url
        )}&show_text=true&width=500`}
        width="100%"
        height="600"
        style={{ border: "none", overflow: "hidden" }}
        scrolling="no"
        frameBorder="0"
        allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
      ></iframe>
    </div>
  );
}
