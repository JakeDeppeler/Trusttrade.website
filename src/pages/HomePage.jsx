import { Fragment, useEffect, useRef, useState } from "react";
import PageLink from "../components/PageLink.jsx";
import { SiteHeader, SiteFooter, Phone } from "../components/SiteChrome.jsx";
import { Check, Words, DownloadPill, useReveal, Final, QrCard, StickyCta } from "../components/SiteKit.jsx";
import { APP_STORE_URL } from "../routes.js";

// trusttrade.au homepage: the shop window for the app. Quiet, high-end layout
// (centred hero over a soft colour horizon, generous space, pastel feature
// cards, one dark band) built from REAL app screenshots (public/assets/app/).
// Copy only claims what the live app does: licence, ABN and photo ID checks (we
// do NOT verify insurance), enquiries go to one tradie, fixed-price quotes with
// GST, accepting books the job, chat per job, reviews from booked jobs.

// Writes the hero's scroll progress (0 → 1) to --hp, which the CSS uses to
// spread the side phones and lift the main one. rAF-throttled, transform-only,
// skipped for reduced motion.
function useHeroScroll(ref) {
  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const tick = () => {
      raf = 0;
      const p = Math.min(1, Math.max(0, window.scrollY / (el.offsetHeight * 0.8)));
      el.style.setProperty("--hp", p.toFixed(3));
    };
    const on = () => raf || (raf = requestAnimationFrame(tick));
    tick();
    window.addEventListener("scroll", on, { passive: true });
    return () => {
      window.removeEventListener("scroll", on);
      cancelAnimationFrame(raf);
    };
  }, [ref]);
}

function Hero() {
  const ref = useRef(null);
  useHeroScroll(ref);
  return (
    <section className="s-hero" ref={ref}>
      <div className="s-wrap s-hero-copy">
        <a className="s-chip s-blur" href={APP_STORE_URL} target="_blank" rel="noopener">
          <span className="s-dot" /> Now on the App Store
        </a>
        <h1 className="s-h1">
          <span aria-label="Find a tradie.">
            {["Find", "a", "tradie."].map((w, i) => (
              <Fragment key={w}>
                <span aria-hidden="true" className="s-blur hw" style={{ "--w": i }}>{w}</span>{i < 2 ? " " : ""}
              </Fragment>
            ))}
          </span>
          <br />
          <span className="s-blur d2 s-grad">Done proper.</span>
        </h1>
        <p className="s-lede s-blur d3">
          Licence-checked local tradies, fixed-price quotes and every job in one place. Made in Melbourne.
        </p>
        <div className="s-hero-cta s-blur d4">
          <DownloadPill big />
        </div>
        <p className="s-hero-note s-blur d4">Free for homeowners · iPhone</p>
      </div>
      <div className="s-stage" aria-hidden="true">
        <div className="s-aurora" />
        <Phone name="profile" className="s-st-side l" />
        <Phone name="quote" className="s-st-side r" />
        <Phone name="find" className="s-st-main" eager />
        <div className="s-pop s-pop-a">
          <span className="s-pop-ic green"><Check /></span>
          <div><b>Licence checked</b><small>By a person, on the register</small></div>
        </div>
        <div className="s-pop s-pop-b">
          <span className="s-pop-ic amber">$</span>
          <div><b>$680 quote accepted</b><small>Booked · GST included</small></div>
        </div>
      </div>
    </section>
  );
}

const CHECKED = ["Trade licence, on the regulator's register", "Active ABN", "Photo ID"];

function CheckedRow() {
  return (
    <section className="s-checked" aria-label="What every tradie is checked for">
      <p>3 checks, by a person, before any tradie is listed</p>
      <ul>
        {CHECKED.map((c) => (
          <li key={c}><Check s={15} /> {c}</li>
        ))}
      </ul>
    </section>
  );
}

const TRIO = [
  { t: "Find", d: "Checked tradies near you, nearest first, on a list or a map.", shot: "map", tone: "sky" },
  { t: "Ask", d: "Not sure what you need? Describe it and get pointed to the right trade.", shot: "ask", tone: "peach" },
  { t: "Book", d: "Accept a fixed-price quote and the job is booked. Track it from start to done.", shot: "jobs", tone: "mint" },
];

function Trio() {
  return (
    <section className="s-sec" id="how">
      <div className="s-wrap">
        <div className="s-head-c rv">
          <h2 className="s-h2"><Words lines={["From \"it's broken\"", "to booked, in one app."]} /></h2>
          <p className="s-sub">No quote forms, no five tradies calling you at 7am. Just the right one.</p>
        </div>
        <div className="s-trio">
          {TRIO.map((c, i) => (
            <article key={c.t} className={"s-tcard rv tone-" + c.tone} style={{ "--d": i * 90 + "ms" }}>
              <h3>{c.t}</h3>
              <p>{c.d}</p>
              <Phone name={c.shot} className="s-tcard-phone" />
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

const STACK = [
  {
    k: "Know who's turning up",
    t: "A profile that shows its working.",
    d: "Licence and checks, real photos of their work, services and prices, the area they cover, and reviews from booked jobs only.",
    shot: "profile-checks",
    tone: "mint",
  },
  {
    k: "One enquiry, one tradie",
    t: "Your job goes to them. Nobody else.",
    d: "Say what's wrong, how urgent it is and add photos. It isn't auctioned off or blasted to a list of businesses.",
    shot: "enquiry",
    tone: "peach",
  },
  {
    k: "A price before anyone turns up",
    t: "Accept the quote. It's booked.",
    d: "Your tradie sends a fixed-price quote with GST shown. One tap to accept, and the price is on record for both of you.",
    shot: "quote",
    tone: "amber",
  },
  {
    k: "Everything kept together",
    t: "Every job, in one place.",
    d: "Chat, photos, the quote and the booking live together for each job. When it's done, leave a review other homeowners can trust.",
    shot: "chat",
    tone: "sky",
  },
];

function Stack() {
  return (
    <section className="s-sec s-stack-sec">
      <div className="s-wrap">
        <div className="s-stack">
          {STACK.map((c, i) => (
            <article key={c.k} className={"s-scard tone-" + c.tone} style={{ "--i": i }}>
              <div className="s-scard-copy rv">
                <span className="s-kicker">{c.k}</span>
                <h3>{c.t}</h3>
                <p>{c.d}</p>
              </div>
              <div className="s-scard-vis rv" style={{ "--d": "140ms" }} aria-hidden="true">
                <Phone name={c.shot} />
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function AskBand() {
  return (
    <section className="s-dark-sec">
      <div className="s-dark">
        <div className="s-orbs" aria-hidden="true">
          <span className="o1" />
          <span className="o2" />
          <span className="o3" />
        </div>
        <div className="s-wrap s-ask">
          <div className="s-head-c rv">
            <span className="s-kicker light">Ask Trust Trade</span>
            <h2 className="s-h2"><Words lines={["Not sure who to call?", "Just ask."]} /></h2>
            <p className="s-sub">
              Describe it the way you'd tell a mate. The assistant works out the trade you need, how urgent it is, and
              points you to checked tradies nearby.
            </p>
          </div>
          <div className="s-ask-chat rv" aria-hidden="true">
            <div className="s-bub me">The power keeps cutting out in the kitchen when the kettle and toaster are on.</div>
            <div className="s-typing"><i /><i /><i /></div>
            <div className="s-bub ans">
              Sounds like an overloaded circuit or a faulty safety switch. That's one for a licensed <b>electrician</b>.
              Not an emergency unless you smell burning.
            </div>
            <div className="s-result res">
              <div className="s-result-top">
                <span className="s-result-ic">✦</span>
                <span>Electricians near you · nearest first</span>
              </div>
              <div className="s-result-card">
                <picture>
                  <source srcSet="/assets/app/thumb-electrician.avif" type="image/avif" />
                  <img src="/assets/app/thumb-electrician.webp" alt="" width={720} height={330} loading="lazy" />
                </picture>
                <div className="s-result-body">
                  <div className="s-result-row">
                    <div>
                      <b>Pratz Electrical</b>
                      <small>Electrician · Greensborough</small>
                    </div>
                    <span className="s-tag"><Check s={12} /> Verified</span>
                  </div>
                  <div className="s-result-chips">
                    <span>Licence checked</span>
                    <span>ABN checked</span>
                    <span>Photo ID</span>
                  </div>
                  <div className="s-result-cta">
                    <span className="s-result-btn">Send an enquiry</span>
                    <span className="s-result-chat" aria-hidden="true">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z" /></svg>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

const MORE = [
  { t: "Search by name or job", d: "Type the problem or the business. Checked tradies, nearest first.", shot: "find" },
  { t: "Where they work", d: "Each profile shows the area they travel to, so you know they'll come to you.", shot: "profile-area" },
  { t: "Their work, in photos", d: "Real photos of real jobs, plus services, prices and reviews from booked work.", shot: "profile" },
];

function More() {
  const [on, setOn] = useState(0);
  return (
    <section className="s-sec">
      <div className="s-wrap s-more">
        <div className="s-more-list rv">
          <h2 className="s-h2 sm"><Words lines={["And that's not all."]} /></h2>
          <p className="s-sub left">The little things that make it work properly.</p>
          <div className="s-more-items">
            {MORE.map((m, i) => (
              <button
                key={m.t}
                type="button"
                aria-pressed={i === on}
                className={"s-more-item" + (i === on ? " on" : "")}
                onClick={() => setOn(i)}
                onMouseEnter={() => setOn(i)}
              >
                <b>{m.t}</b>
                <span>{m.d}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="s-more-phone rv" aria-hidden="true">
          {MORE.map((m, i) => (
            <Phone key={m.shot} name={m.shot} className={i === on ? "on" : ""} />
          ))}
        </div>
      </div>
    </section>
  );
}

function Tradies() {
  return (
    <section className="s-sec" id="tradies">
      <div className="s-wrap">
        <div className="s-tradie rv">
          <div className="s-tradie-copy">
            <span className="s-kicker">For tradies</span>
            <h2 className="s-h2 sm"><Words lines={["Run your jobs from your pocket."]} /></h2>
            <ul className="s-tlist">
              <li><Check /> Enquiries from homeowners who picked you, not cold leads</li>
              <li><Check /> Fixed-price quotes with GST in under a minute</li>
              <li><Check /> New, booked and done jobs, with the chat on each</li>
              <li><Check /> Profile views, calls and emails, plus a desktop dashboard</li>
            </ul>
            <div className="s-row">
              <a className="s-dl" href="/apply">Apply to join</a>
              <PageLink className="s-textlink" href="For Tradies.html">Why join →</PageLink>
            </div>
            <p className="s-fine">Free to apply. You'll need your licence, ABN and photo ID.</p>
          </div>
          <div className="s-tradie-vis" aria-hidden="true">
            <Phone name="trade-dashboard" className="a" />
            <Phone name="trade-quote" className="b" />
          </div>
        </div>
      </div>
    </section>
  );
}

const FAQ = [
  ["Is it free?", "Yes. Finding a tradie, sending enquiries, getting quotes and booking are free for homeowners."],
  ["Who sees my enquiry?", "Only the tradie you sent it to. We don't sell or share your details, and you won't hear from businesses you didn't contact."],
  ["What do you check?", "Every tradie's trade licence on the regulator's register, their ABN and their photo ID, by a person, before they're listed. We don't check insurance, so ask your tradie for a certificate if the job needs one."],
  ["Where does it work?", "Across Australia, starting in Melbourne and Victoria. It's on iPhone now, with Android on the way."],
];

function Faq() {
  return (
    <section className="s-sec">
      <div className="s-wrap s-faq">
        <div className="s-head-c rv">
          <h2 className="s-h2 sm"><Words lines={["Questions, answered."]} /></h2>
        </div>
        <div className="s-faq-list rv">
          {FAQ.map(([q, a], i) => (
            <details key={q} className="s-qa" style={{ "--q": i }}>
              <summary>{q}</summary>
              <p>{a}</p>
            </details>
          ))}
          <PageLink className="s-textlink center" href="FAQ.html">All questions →</PageLink>
        </div>
      </div>
    </section>
  );
}

export default function HomePage() {
  useReveal();
  return (
    <div className="site">
      <SiteHeader />
      <main>
        <Hero />
        <CheckedRow />
        <Trio />
        <Stack />
        <AskBand />
        <More />
        <Tradies />
        <Faq />
        <Final />
      </main>
      <SiteFooter />
      <QrCard />
      <StickyCta />
    </div>
  );
}
