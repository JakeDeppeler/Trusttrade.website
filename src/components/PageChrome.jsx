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
    const f = () => setScrolled(window.scrollY > 16);
    f();
    window.addEventListener("scroll", f, { passive: true });
    return () => window.removeEventListener("scroll", f);
  }, []);
  const currentRoute = current ? resolveHref(current) : null;
  return (
    <header className={"header " + (scrolled ? "scrolled" : "")}>
      <div className="container">
        <PageLink href="Trust Trade Landing.html" className="brand">
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

export function PageHero({ eyebrow, title, italicWord, lede, meta }) {
  return (
    <section className="page-hero">
      <div className="container">
        <div className="page-hero-grid">
          <div>
            <div className="eyebrow accent">— {eyebrow}</div>
            <h1 className="h-display page-hero-title">
              {title} {italicWord && <span className="it">{italicWord}</span>}
            </h1>
          </div>
          <div className="page-hero-side">
            {lede && <p className="lede">{lede}</p>}
            {meta && (
              <div className="page-hero-meta">
                {meta.map((m, i) => (
                  <div key={i} className="page-hero-meta-row">
                    <div className="k">{m.k}</div>
                    <div className="v">{m.v}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
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
          <div>
            <div className="eyebrow accent">— Pre-register</div>
            <h2 className="h-1" style={{ marginTop: 14 }}>
              {headline} <span className="it">{subhead}</span>
            </h2>
            <p className="lede" style={{ marginTop: 20, maxWidth: "44ch" }}>
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

export function PageFooter() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-top">
          <div className="footer-brand">
            <div className="brand">
              Trust Trade<span className="reg">®</span>
            </div>
            <p>
              Verified. Insured. Done proper. Built in Melbourne for Aussie homes and Aussie
              trades.
            </p>
            <div className="footer-app">
              <div className="app-badge">
                <span className="glyph"></span>
                <div>
                  <strong>App Store</strong>
                  <span style={{ color: "var(--text-dim)" }}>
                    Coming Q4 2026 <span className="soon">SOON</span>
                  </span>
                </div>
              </div>
              <div className="app-badge">
                <span className="glyph">▶</span>
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
              <li><a href="#">Privacy</a></li>
              <li><a href="#">Terms</a></li>
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
