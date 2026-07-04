import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useLocation } from "react-router-dom";
import PageLink from "./PageLink.jsx";
import { HREF_TO_ROUTE, resolveHref } from "../routes.js";

export const PAGE_LINKS = [
  { label: "For homeowners", href: "For Homeowners.html" },
  { label: "For tradies", href: "For Tradies.html" },
  { label: "How we verify", href: "How we verify.html" },
  { label: "How it works", href: "How it works.html" },
  { label: "FAQ", href: "FAQ.html" },
];

export function MobileNavMenu({ current }) {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  useEffect(() => {
    setOpen(false);
  }, [pathname]);
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const currentRoute = current ? resolveHref(current) : null;

  return (
    <>
      <button
        type="button"
        className="nav-toggle"
        aria-label="Open menu"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="4" y1="7" x2="20" y2="7" />
          <line x1="4" y1="17" x2="20" y2="17" />
        </svg>
      </button>
      {open &&
        createPortal(
          <div className="nav-overlay" role="dialog" aria-modal="true" aria-label="Site menu">
            <div className="nav-overlay-head">
              <PageLink href="Trust Trade Landing.html" className="brand">
                Trust Trade<span className="reg">®</span>
              </PageLink>
              <button
                type="button"
                className="nav-toggle"
                aria-label="Close menu"
                onClick={() => setOpen(false)}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="6" y1="6" x2="18" y2="18" />
                  <line x1="6" y1="18" x2="18" y2="6" />
                </svg>
              </button>
            </div>
            <nav className="nav-overlay-links">
              {PAGE_LINKS.map((l) => (
                <PageLink
                  key={l.href}
                  href={l.href}
                  className={HREF_TO_ROUTE[l.href] === currentRoute ? "current" : ""}
                >
                  {l.label}
                </PageLink>
              ))}
            </nav>
            <div className="nav-overlay-cta">
              <PageLink
                className="btn btn-primary btn-lg"
                href="Trust Trade Landing.html#waitlist"
              >
                Get early access →
              </PageLink>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}

export function ScrollToTop() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) {
      const el = document.getElementById(hash.slice(1));
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
    }
    window.scrollTo(0, 0);
  }, [pathname, hash]);
  return null;
}

export function PageHeader({ current }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const f = () => setScrolled(window.scrollY > 32);
    f();
    window.addEventListener("scroll", f, { passive: true });
    return () => window.removeEventListener("scroll", f);
  }, []);
  const currentRoute = current ? resolveHref(current) : null;
  return (
    <header className={"header " + (scrolled ? "scrolled" : "")}>
      <div className="container">
        <PageLink href="Trust Trade Landing.html" className="brand">
          <img className="brand-mascot" src="/assets/mascot-toolbox.png" alt="" aria-hidden="true" />
          Trust Trade<span className="reg">®</span>
        </PageLink>
        <nav className="nav-links">
          {PAGE_LINKS.map((l) => (
            <PageLink
              key={l.href}
              href={l.href}
              className={HREF_TO_ROUTE[l.href] === currentRoute ? "current" : ""}
            >
              {l.label}
            </PageLink>
          ))}
        </nav>
        <div className="header-cta">
          <span className="header-pill">
            <span className="dot"></span>
            Coming soon · iOS &amp; Android
          </span>
          <PageLink className="btn btn-primary btn-sm header-cta-btn" href="Trust Trade Landing.html#waitlist">
            Get early access
          </PageLink>
          <MobileNavMenu current={current} />
        </div>
      </div>
    </header>
  );
}

/**
 * Bevel-style centered page hero. Every sub-page uses this as the opener.
 * Big centered eyebrow-pill + huge italic-accented headline + centered
 * subhead + optional CTA row. Meta rows still supported (used by old
 * dark theme; on cream they render as a subtle 4-up strip below the
 * subhead).
 */
export function PageHero({
  eyebrow,
  title,
  italicWord,
  lede,
  meta,
  ctaLabel,
  ctaHref = "Trust Trade Landing.html#waitlist",
  secondaryLabel,
  secondaryHref,
}) {
  return (
    <section className="page-hero page-hero-centered">
      <div className="page-hero-decor" aria-hidden="true" />
      <div className="container">
        <div className="page-hero-centered-inner">
          {eyebrow && (
            <div className="page-hero-eyebrow">
              <span className="dot" aria-hidden="true" />
              {eyebrow}
            </div>
          )}
          <h1 className="page-hero-title-xl">
            {title} {italicWord && <span className="it">{italicWord}</span>}
          </h1>
          {lede && <p className="page-hero-subhead">{lede}</p>}
          {(ctaLabel || secondaryLabel) && (
            <div className="page-hero-cta-row">
              {ctaLabel && (
                <PageLink href={ctaHref} className="btn btn-primary btn-lg">
                  {ctaLabel}
                </PageLink>
              )}
              {secondaryLabel && (
                <PageLink href={secondaryHref} className="btn btn-ghost btn-lg">
                  {secondaryLabel}
                </PageLink>
              )}
            </div>
          )}
          {meta && (
            <div className="page-hero-meta-strip">
              {meta.map((m, i) => (
                <div key={i} className="page-hero-meta-strip-item">
                  <div className="k">{m.k}</div>
                  <div className="v">{m.v}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export function PageWaitlistFooterCTA({
  headline = "Be first in.",
  subhead = "Lock in early.",
  secondaryLabel = "I'm a tradie",
  secondaryHref = "For Tradies.html",
}) {
  return (
    <section className="page-cta-block">
      <div className="container">
        <div className="page-cta-inner">
          <div className="page-cta-text">
            <div className="eyebrow accent">— Pre-register</div>
            <h2 className="h-1">
              {headline} <span className="it">{subhead}</span>
            </h2>
            <p className="lede">
              Web access opens for waitlist members before public launch. Founding-member pricing,
              verified badge on day one, no spam.
            </p>
          </div>
          <div className="page-cta-actions">
            <PageLink href="Trust Trade Landing.html#waitlist" className="btn btn-primary btn-lg">
              Get on the list →
            </PageLink>
            <PageLink href={secondaryHref} className="btn btn-ghost btn-lg">
              {secondaryLabel}
            </PageLink>
          </div>
        </div>
      </div>
    </section>
  );
}

// Download end-CTA card ("Get it done proper.") — the closing section on the
// How It Works page, matching the design. Dark card + App Store button + QR.
export function PageDownloadCTA({
  eyebrow = "Ready when you are",
  title = "Get it",
  italic = "done proper.",
  lede = "Verified, insured, recommended local tradies — landing on your phone soon. Download Trust Trade and find the right human, first time.",
  photoNote = "Photo · tradie ute + toolbox, warm dusk",
}) {
  return (
    <section className="final" id="download">
      <div className="container">
        <div className="final-card reveal reveal-scale">
          <div className="final-photo" data-note={photoNote} aria-hidden="true" />
          <div className="final-inner">
            <div className="eyebrow dot">{eyebrow}</div>
            <h2 className="h-1">
              {title} <span className="it">{italic}</span>
            </h2>
            <p className="lede">{lede}</p>
            <div className="final-actions">
              <PageLink className="appstore-btn" href="Trust Trade Landing.html#waitlist">
                <span className="glyph" aria-hidden="true">
                  <svg width="22" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.05 12.94c.02-2.34 1.92-3.47 2-3.52-1.09-1.6-2.79-1.82-3.4-1.85-1.43-.15-2.81.86-3.54.86-.74 0-1.86-.84-3.06-.82-1.57.02-3.03.92-3.84 2.33-1.65 2.86-.42 7.08 1.18 9.4.78 1.13 1.71 2.4 2.93 2.35 1.18-.05 1.63-.76 3.05-.76 1.42 0 1.82.76 3.06.74 1.27-.02 2.07-1.15 2.84-2.29.9-1.31 1.27-2.59 1.29-2.65-.03-.01-2.47-.95-2.51-3.79zM14.74 5.72c.66-.8 1.1-1.91.98-3.02-.95.04-2.09.63-2.77 1.43-.61.71-1.14 1.84-1 2.94 1.06.08 2.13-.54 2.79-1.35z" />
                  </svg>
                </span>
                <span className="as-txt">
                  <span className="small">Download on the</span>
                  <span className="big">App Store</span>
                </span>
              </PageLink>
              <div className="final-qr" aria-hidden="true">
                <div className="qr" />
                <div className="qr-txt">Scan to download when we launch in the App Store.</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function PageFooter() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-top">
          <div className="footer-brand">
            <div className="brand">
              <img className="brand-mascot" src="/assets/mascot-toolbox.png" alt="" aria-hidden="true" />
              Trust Trade<span className="reg">®</span>
            </div>
            <p>
              Verified. Insured. Done proper. Built in Melbourne for Aussie homes and Aussie
              trades.
            </p>
            <div className="footer-app">
              <div className="app-badge" aria-label="App Store · Coming Q4 2026">
                <span className="glyph" aria-hidden="true">
                  <svg width="18" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.05 12.94c.02-2.34 1.92-3.47 2-3.52-1.09-1.6-2.79-1.82-3.4-1.85-1.43-.15-2.81.86-3.54.86-.74 0-1.86-.84-3.06-.82-1.57.02-3.03.92-3.84 2.33-1.65 2.86-.42 7.08 1.18 9.4.78 1.13 1.71 2.4 2.93 2.35 1.18-.05 1.63-.76 3.05-.76 1.42 0 1.82.76 3.06.74 1.27-.02 2.07-1.15 2.84-2.29.9-1.31 1.27-2.59 1.29-2.65-.03-.01-2.47-.95-2.51-3.79zM14.74 5.72c.66-.8 1.1-1.91.98-3.02-.95.04-2.09.63-2.77 1.43-.61.71-1.14 1.84-1 2.94 1.06.08 2.13-.54 2.79-1.35z" />
                  </svg>
                </span>
                <div>
                  <strong>App Store</strong>
                  <span style={{ color: "var(--text-dim)" }}>
                    Coming Q4 2026 <span className="soon">SOON</span>
                  </span>
                </div>
              </div>
              <div className="app-badge" aria-label="Google Play · Coming Q4 2026">
                <span className="glyph" aria-hidden="true">
                  <svg width="18" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3.6 2.3c-.4.4-.6.9-.6 1.7v16c0 .8.2 1.3.6 1.7L13 12 3.6 2.3zM14 13l2.6 2.6-9.4 5.5c-.4.2-.7.3-1 .3l7.8-8.4zm0-2L6.2 2.6c.3 0 .6.1 1 .3l9.4 5.5L14 11zm6.8 2.6L17.6 15 15 12.4l2.6-2.6 3.2 1.7c.9.5.9 1.9 0 2.1z" />
                  </svg>
                </span>
                <div>
                  <strong>Google Play</strong>
                  <span style={{ color: "var(--text-dim)" }}>
                    Coming Q4 2026 <span className="soon">SOON</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="footer-col">
            <h5>Product</h5>
            <ul>
              <li><PageLink href="How it works.html">How it works</PageLink></li>
              <li><PageLink href="How we verify.html">How we verify</PageLink></li>
              <li><PageLink href="Trades we cover.html">Trades we cover</PageLink></li>
              <li><PageLink href="FAQ.html">FAQ</PageLink></li>
            </ul>
          </div>
          <div className="footer-col">
            <h5>For Tradies</h5>
            <ul>
              <li><PageLink href="For Tradies.html">Why join</PageLink></li>
              <li><PageLink href="Trust Trade Landing.html#waitlist">Apply</PageLink></li>
              <li><PageLink href="FAQ.html#tradies">Tradie FAQ</PageLink></li>
              <li><a href="mailto:jake@trusttrade.au">Contact</a></li>
            </ul>
          </div>
          <div className="footer-col">
            <h5>Company</h5>
            <ul>
              <li><PageLink href="About.html">About</PageLink></li>
              <li><a href="mailto:jake@trusttrade.au">Support</a></li>
              <li><a href="mailto:jake@trusttrade.au?subject=Privacy%20question">Privacy</a></li>
              <li><a href="mailto:jake@trusttrade.au?subject=Terms%20question">Terms</a></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <div>© 2026 Trust Trade® · ABN 40 873 784 535</div>
          <div>Made in Melbourne · Australia</div>
        </div>
      </div>
    </footer>
  );
}
