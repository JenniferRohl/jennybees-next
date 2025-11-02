// …imports and everything above unchanged…
import TikTokEmbed from "./TikTokEmbed";
import FacebookEmbed from "./FacebookEmbed";

// inside the component, replace the whole SectionSocial with this:
function SectionSocial() {
  const FEED_HEIGHT = 420; // tweak this to adjust both embeds together
  const hasFb = !!cfg.social.facebook;

  return (
    <section className="max-w-6xl mx-auto px-4 py-16">
      <div className="rounded-3xl overflow-hidden ring-1 ring-neutral-200 bg-white p-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <div className="text-sm font-semibold">Follow along</div>
            <div className="text-sm text-neutral-600">
              Behind-the-scenes pours, wicks, tests &amp; restocks.
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={cfg.social.tiktok}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 rounded-xl border text-sm font-medium"
              style={{ borderColor: "#e5e5e5" }}
            >
              TikTok
            </a>
            <a
              href={cfg.social.facebook}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 rounded-xl border text-sm font-medium"
              style={{ borderColor: "#e5e5e5" }}
            >
              Facebook
            </a>
          </div>
        </div>

        <div className="mt-4 grid md:grid-cols-2 gap-4">
          {/* TikTok */}
          {hydrated ? (
            <TikTokEmbed url={cfg.social.tiktokPost || ""} height={FEED_HEIGHT} />
          ) : (
            <div
              className="rounded-2xl bg-neutral-100 grid place-items-center text-neutral-500 text-sm"
              style={{ height: FEED_HEIGHT }}
            >
              Loading TikTok…
            </div>
          )}

          {/* Facebook */}
          {hasFb ? (
            <FacebookEmbed
              url={cfg.social.facebook}
              kind="timeline"
              height={FEED_HEIGHT}
              className="shadow-sm"
            />
          ) : (
            <div
              className="rounded-2xl bg-neutral-100 grid place-items-center text-neutral-500 text-sm"
              style={{ height: FEED_HEIGHT }}
            >
              Add your Facebook page URL in the admin panel to show the feed.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
// …rest of file unchanged…
