import { Fragment, useEffect, useState } from "react";
import { SiteHeader, SiteFooter, AppleGlyph, AppStoreButton, Phone } from "./SiteChrome.jsx";
import PageLink from "./PageLink.jsx";
import { APP_STORE_URL } from "../routes.js";

// Shared building blocks for every page in the new site design (src/styles/site.css).

export function Check({ s = 14 }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  );
}

// Splits a heading into words so they can rise in one after another. Lines are
// separate strings; the full text stays readable to screen readers via aria-label.
export function Words({ lines }) {
  let n = 0;
  return (
    <span aria-label={lines.join(" ")}>
      {lines.map((line, li) => (
        <span key={li} aria-hidden="true">
          {li > 0 && <br />}
          {line.split(" ").map((w, wi) => (
            <Fragment key={wi}>
              <span className="w" style={{ "--w": n++ }}>{w}</span>{" "}
            </Fragment>
          ))}
        </span>
      ))}
    </span>
  );
}

export function DownloadPill({ big = false }) {
  return (
    <a className={"s-dl" + (big ? " big" : "")} href={APP_STORE_URL} target="_blank" rel="noopener">
      <AppleGlyph size={big ? 17 : 15} />
      Download app
    </a>
  );
}

// Scroll-in reveal. Content is visible by default (SSR + no-JS); the class is
// only armed once JS runs, and only for elements still below the fold, so nothing
// above the fold ever starts hidden (that would kill LCP).
export function useReveal() {
  useEffect(() => {
    if (!("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver(
      (ents) =>
        ents.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        }),
      { rootMargin: "0px 0px -10% 0px" }
    );
    document.querySelectorAll(".site .rv").forEach((el) => {
      if (el.getBoundingClientRect().top > window.innerHeight) {
        el.classList.add("arm");
        io.observe(el);
      }
    });
    return () => io.disconnect();
  }, []);
}

export function AndroidForm() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState("idle");
  const submit = async (e) => {
    e.preventDefault();
    if (!email.trim() || state === "busy") return;
    setState("busy");
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ email: email.trim(), role: "homeowner", name: "", postcode: "", businessName: "", phone: "", source: "/#android" }),
      });
      const data = await res.json().catch(() => ({}));
      setState(res.ok && data.ok ? "done" : "error");
    } catch {
      setState("error");
    }
  };
  if (state === "done") return <p className="s-android-done">Thanks. We'll email you once, the day it's on Android.</p>;
  return (
    <form className="s-android" onSubmit={submit} id="android">
      <label htmlFor="s-android-email">On Android? Get one email when it lands.</label>
      <div>
        <input id="s-android-email" type="email" required placeholder="you@email.com" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <button type="submit" disabled={state === "busy"}>{state === "busy" ? "Sending…" : "Notify me"}</button>
      </div>
      {state === "error" && <small className="s-err">That didn't go through. Try again in a moment.</small>}
    </form>
  );
}

export function Final() {
  return (
    <section className="s-final-sec">
      <div className="s-wrap">
        <div className="s-endcard rv">
          <div className="s-endcard-copy">
            <span className="s-mono"><i /> Ready when you are</span>
            <h2 className="s-end-h">
              Get it <em>done</em>
              <br />
              <em>proper.</em>
            </h2>
            <p>Licence-checked local tradies, fixed-price quotes and every job in one place, on your iPhone.</p>
            <div className="s-end-cta">
              <AppStoreButton light />
              <div className="s-end-qr" aria-hidden="true">
                <img src="/assets/qr-appstore.svg" alt="" width={84} height={84} loading="lazy" />
                <span>Scan to download Trust Trade from the App Store.</span>
              </div>
            </div>
            <AndroidForm />
          </div>
          <div className="s-endcard-vis" aria-hidden="true">
            <Phone name="profile" className="l" />
            <Phone name="find" className="c" />
          </div>
        </div>
      </div>
    </section>
  );
}

// Desktop-only floating QR card (bottom right). Appears after the hero, closable.
export function QrCard() {
  const [show, setShow] = useState(false);
  const [closed, setClosed] = useState(false);
  useEffect(() => {
    const f = () => setShow(window.scrollY > window.innerHeight * 0.6);
    f();
    window.addEventListener("scroll", f, { passive: true });
    return () => window.removeEventListener("scroll", f);
  }, []);
  if (closed) return null;
  return (
    <aside className={"s-qrcard" + (show ? " show" : "")} aria-hidden={!show}>
      <img src="/assets/qr-appstore.svg" alt="" width={64} height={64} loading="lazy" />
      <div>
        <b>Get Trust Trade</b>
        <small>Scan with your iPhone camera</small>
      </div>
      <button type="button" aria-label="Close" tabIndex={show ? 0 : -1} onClick={() => setClosed(true)}>×</button>
    </aside>
  );
}

export function StickyCta() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const f = () => setShow(window.scrollY > window.innerHeight * 0.9);
    f();
    window.addEventListener("scroll", f, { passive: true });
    return () => window.removeEventListener("scroll", f);
  }, []);
  return (
    <a className={"s-sticky" + (show ? " show" : "")} href={APP_STORE_URL} target="_blank" rel="noopener" tabIndex={show ? 0 : -1} aria-hidden={!show}>
      <AppleGlyph size={15} /> Download Trust Trade
    </a>
  );
}


// Every page: header, main, the dark download card, footer, floating QR + sticky CTA.
export function PageShell({ children, end = true }) {
  useReveal();
  return (
    <div className="site">
      <SiteHeader />
      <main>
        {children}
        {end && <Final />}
      </main>
      <SiteFooter />
      <QrCard />
      <StickyCta />
    </div>
  );
}

// Centred page hero: kicker chip, two-line title (second line in the warm
// gradient), one-sentence lede, optional actions and visual.
export function PageHero({ kicker, title, accent, lede, children, visual }) {
  return (
    <section className="s-phero">
      <div className="s-wrap s-hero-copy">
        {kicker && <span className="s-chip s-blur"><span className="s-dot" /> {kicker}</span>}
        <h1 className="s-h1 s-h1-page">
          <span className="s-blur d1">{title}</span>
          {accent && (
            <>
              <br />
              <span className="s-blur d2 s-grad">{accent}</span>
            </>
          )}
        </h1>
        {lede && <p className="s-lede s-blur d3">{lede}</p>}
        {children && <div className="s-hero-cta s-blur d4">{children}</div>}
      </div>
      {visual}
    </section>
  );
}

export function HeadC({ kicker, lines, sub, light = false, sm = false }) {
  return (
    <div className="s-head-c rv">
      {kicker && <span className={"s-kicker" + (light ? " light" : "")}>{kicker}</span>}
      <h2 className={"s-h2" + (sm ? " sm" : "")}><Words lines={lines} /></h2>
      {sub && <p className="s-sub">{sub}</p>}
    </div>
  );
}

// Grid of soft cards: [{t, d, tone?}] with a numbered or ticked badge.
export function CardGrid({ items, cols = 3, numbered = false }) {
  return (
    <div className={"s-grid c" + cols}>
      {items.map((it, i) => (
        <article key={it.t} className={"s-gcard rv" + (it.tone ? " tone-" + it.tone : "")} style={{ "--d": (i % cols) * 80 + "ms" }}>
          <span className="s-gcard-ic">{numbered ? String(i + 1).padStart(2, "0") : <Check s={15} />}</span>
          <h3>{it.t}</h3>
          <p>{it.d}</p>
        </article>
      ))}
    </div>
  );
}

// Vertical numbered steps with a connecting line.
export function Steps({ items }) {
  return (
    <ol className="s-steps">
      {items.map((it, i) => (
        <li key={it.t} className="rv" style={{ "--d": i * 70 + "ms" }}>
          <span className="s-steps-n">{i + 1}</span>
          <div>
            <h3>{it.t}</h3>
            <p>{it.d}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

// Two-column feature row: copy + phone, alternating sides.
export function Feature({ kicker, title, body, points, shot, tone = "sky", flip = false }) {
  return (
    <div className={"s-feat rv" + (flip ? " flip" : "")}>
      <div className="s-feat-copy">
        {kicker && <span className="s-kicker">{kicker}</span>}
        <h3>{title}</h3>
        <p>{body}</p>
        {points && (
          <ul className="s-tlist">
            {points.map((p) => (
              <li key={p}><Check /> {p}</li>
            ))}
          </ul>
        )}
      </div>
      <div className={"s-feat-vis tone-" + tone} aria-hidden="true">
        <Phone name={shot} />
      </div>
    </div>
  );
}

export function FaqList({ items, id }) {
  return (
    <div className="s-faq-list rv" id={id}>
      {items.map(([q, a], i) => (
        <details key={q} className="s-qa" style={{ "--q": i }}>
          <summary>{q}</summary>
          <p>{a}</p>
        </details>
      ))}
    </div>
  );
}

export { AppleGlyph, AppStoreButton, Phone, PageLink, APP_STORE_URL, Fragment };
