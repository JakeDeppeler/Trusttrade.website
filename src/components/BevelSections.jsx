/**
 * Bevel-style section components. Reused across LandingPage + all sub-pages
 * so the site feels of-a-piece. All are prop-driven — pass in the copy
 * and content, get the visual back.
 */

/* ------------------------------------------------------------------
 * FeatureStories — the core bevel move. A stack of left-text/right-phone
 * feature blocks. Every story is:
 *   { eyebrow, headline, body, screenshot, alt, overlayCards?: [] }
 * overlayCards is optional; if provided, small floating mock UI cards
 * are absolutely-positioned around the phone (bevel's signature).
 * ------------------------------------------------------------------ */
export function FeatureStories({ stories = [], id = "features" }) {
  return (
    <section className="feature-stories" id={id}>
      <div className="container">
        {stories.map((s) => (
          <article className="story" key={s.headline}>
            <div className="story-body">
              <div className="story-eyebrow">{s.eyebrow}</div>
              <h3 className="story-title">{s.headline}</h3>
              <p className="story-lede">{s.body}</p>
            </div>
            <div className="story-visual">
              <div className="story-phone-wrap">
                {s.overlayCards?.map((c, i) => (
                  <div
                    key={i}
                    className={`story-float-card story-float-${c.position || "tl"}`}
                  >
                    {c.badge && (
                      <div className={`float-badge ${c.badgeStyle || ""}`}>
                        {c.badge}
                      </div>
                    )}
                    {c.icon && (
                      <div className="float-icon" aria-hidden="true">
                        {c.icon}
                      </div>
                    )}
                    <div>
                      <strong>{c.title}</strong>
                      <span>{c.sub}</span>
                    </div>
                  </div>
                ))}
                <div className="phone">
                  <div className="phone-screen">
                    <img
                      src={s.screenshot}
                      alt={s.alt}
                      loading="lazy"
                      decoding="async"
                      width={1284}
                      height={2778}
                    />
                  </div>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------
 * BehindTheScenes — bevel's "Bevel Intelligence" umbrella section.
 * A big centered head + a 3-card grid of sub-features.
 * ------------------------------------------------------------------ */
export function BehindTheScenes({
  eyebrow,
  title,
  italicWord,
  subhead,
  items = [],
}) {
  return (
    <section className="behind-scenes">
      <div className="container">
        <div className="behind-head">
          <div className="eyebrow accent">— {eyebrow}</div>
          <h2 className="h-1">
            {title} {italicWord && <span className="it">{italicWord}</span>}
          </h2>
          {subhead && <p className="lede">{subhead}</p>}
        </div>
        <div className="behind-grid">
          {items.map((it) => (
            <article className="behind-item" key={it.headline}>
              <div className="behind-eyebrow">— {it.eyebrow}</div>
              <h3 className="behind-title">{it.headline}</h3>
              <p className="behind-body">{it.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------
 * AdditionalFeatures — bevel's "And that's not all" 2-col text grid
 * paired with a phone screenshot on the right.
 * ------------------------------------------------------------------ */
export function AdditionalFeatures({
  eyebrow,
  title,
  italicWord,
  items = [],
  screenshot,
  alt,
}) {
  return (
    <section className="additional-features">
      <div className="container">
        <div className="additional-head">
          <div className="eyebrow accent">— {eyebrow}</div>
          <h2 className="h-1">
            {title} {italicWord && <span className="it">{italicWord}</span>}
          </h2>
        </div>
        <div className="additional-inner">
          <ul className="additional-grid">
            {items.map((f) => (
              <li className="additional-item" key={f.title}>
                <h4>{f.title}</h4>
                <p>{f.body}</p>
              </li>
            ))}
          </ul>
          {screenshot && (
            <div className="additional-visual">
              <div className="phone">
                <div className="phone-screen">
                  <img
                    src={screenshot}
                    alt={alt}
                    loading="lazy"
                    decoding="async"
                    width={1284}
                    height={2778}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------
 * PrivacyBreak — bevel's "Built for privacy" section. Cream break with
 * decorative background + centred statement + author attribution.
 * ------------------------------------------------------------------ */
export function PrivacyBreak({
  eyebrow,
  title,
  italicWord,
  body,
  authorName = "Jake",
  authorRole = "Mech plumber · Founder · Melbourne",
}) {
  return (
    <section className="privacy-break">
      <div className="privacy-decor" aria-hidden="true" />
      <div className="container">
        <div className="privacy-inner">
          <div className="eyebrow accent">— {eyebrow}</div>
          <h2 className="h-1">
            {title} {italicWord && <span className="it">{italicWord}</span>}
          </h2>
          <p className="lede">{body}</p>
          <div className="privacy-attr">
            <div className="privacy-avatar" aria-hidden="true">
              {authorName.charAt(0)}
            </div>
            <div>
              <strong>{authorName}</strong>
              <span>{authorRole}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------
 * VoiceCards — bevel's testimonial carousel adapted as a 3-card grid.
 * Founder pull-quotes until real user testimonials exist.
 * ------------------------------------------------------------------ */
export function VoiceCards({
  eyebrow,
  title,
  italicWord,
  quotes = [],
  authorName = "Jake",
}) {
  return (
    <section className="voice-cards">
      <div className="container">
        <div className="voice-head">
          <div className="eyebrow accent">— {eyebrow}</div>
          <h2 className="h-1">
            {title} {italicWord && <span className="it">{italicWord}</span>}
          </h2>
        </div>
        <div className="voice-grid">
          {quotes.map((v) => (
            <article className="voice-card" key={v.title}>
              <div className="voice-eyebrow">— {v.title}</div>
              <blockquote>{v.quote}</blockquote>
              <div className="voice-attr">
                <div className="voice-avatar" aria-hidden="true">
                  {authorName.charAt(0)}
                </div>
                <div>
                  <strong>{authorName}</strong>
                  <span>{v.when}</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
