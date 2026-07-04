import { useEffect, useState } from "react";
import { PageDownloadCTA, PageFooter, PageHeader } from "../components/PageChrome.jsx";
import PageLink from "../components/PageLink.jsx";
import { usePageReveal } from "../components/RedesignSections.jsx";
import "../styles/hiw-redesign.css";
import "../styles/landing-sections.css";

function scrollToWaitlist() {
  const el = document.getElementById("download");
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "start" });
}

function Hero({ onJoin }) {
  return (
    <section className="hero hero-centered" id="top">
      <div className="hero-aurora" aria-hidden="true" />
      <div className="container">
        <div className="hero-centered-inner">
          <div className="hero-eyebrow-pill">
            <span className="dot" aria-hidden="true" />
            The Australian tradie standard
          </div>
          <h1 className="hero-title-xl">
            Find a tradie.
            <br />
            <span className="glow-wrap">
              <span className="it">Done proper.</span>
            </span>
          </h1>
          <p className="hero-subhead">
            Verified, insured local tradies. Fixed call-out fees in writing. Every job on the record.
          </p>
          <div className="hero-cta-row centered">
            <button
              type="button"
              className="btn btn-primary btn-lg"
              onClick={onJoin}
            >
              Join the waitlist →
            </button>
          </div>
          <div className="hero-trust-row centered">
            <div className="hero-trust-dot" aria-hidden="true"></div>
            <div>Founding 50 spots open · No spam, ever</div>
          </div>
          <div className="hero-devices">
            <div className="hero-phone-container">
              <div className="hero-float-card float-tl">
                <div className="float-icon" aria-hidden="true">✓</div>
                <div>
                  <strong>Licence verified</strong>
                  <span>VBA · re-checked quarterly</span>
                </div>
              </div>
              <div className="hero-float-card float-tr">
                <div className="float-badge" aria-hidden="true">$200</div>
                <div>
                  <strong>Call-out approved</strong>
                  <span>In writing · both sides</span>
                </div>
              </div>
              <div className="hero-float-card float-br">
                <div className="float-dot" aria-hidden="true"><span /></div>
                <div>
                  <strong>0.4 km away</strong>
                  <span>Available today · 4.9 ★ (12)</span>
                </div>
              </div>
              <div className="phone">
                <div className="phone-screen">
                  <img
                    src="/assets/app-home.png"
                    alt="Trust Trade app home screen"
                    width={1284}
                    height={2778}
                    fetchPriority="high"
                    decoding="async"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

const REGULATORS = [
  { short: "VBA", full: "Victorian Building Authority", tag: "Licence · builders + plumbers" },
  { short: "ESV", full: "Energy Safe Victoria", tag: "Licence · electrical + gas" },
  { short: "ASIC", full: "ABN Register", tag: "Business status" },
  { short: "IP Australia", full: "Trademarks Register", tag: "Trading name" },
];

function IntegrationsRow() {
  return (
    <section className="integrations-row" aria-label="Regulators we verify against">
      <div className="container">
        <div className="integrations-head">
          <div className="eyebrow accent">— Verified against</div>
          <p>Every licence, insurance certificate and ABN is checked at the source before a tradie is listed. Not honour-system.</p>
        </div>
        <ul className="integrations-list">
          {REGULATORS.map((r) => (
            <li key={r.short} className="integration-pill">
              <span className="integration-short">{r.short}</span>
              <span className="integration-body">
                <span className="integration-full">{r.full}</span>
                <span className="integration-tag">{r.tag}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* -----------------------------------------------------------------
 * Feature stories — bevel's core feature-block pattern. All left-text
 * right-phone (no alternation, matches bevel exactly). One short
 * eyebrow, one big headline, one line of body. No bullets, no chips.
 * -----------------------------------------------------------------*/
/* Content for the shared BevelSections components on the homepage. */
const HOMEPAGE_STORIES = [
  {
    eyebrow: "Verified profile",
    headline: "See who you're actually hiring.",
    body: "Every tradie's licence is checked at the state regulator before they're listed. What you see is the receipt.",
    screenshot: "/assets/app-profile.png",
    alt: "A verified tradie's public profile in the Trust Trade app",
    overlayCards: [
      {
        position: "tl",
        icon: "✓",
        title: "Licence verified",
        sub: "VBA · re-checked quarterly",
      },
    ],
  },
  {
    eyebrow: "Fixed quote",
    headline: "The price is the price.",
    body: "Call-out fees are quoted in writing, in the chat, before anyone rolls. You approve or you don't.",
    screenshot: "/assets/app-quote.png",
    alt: "A chat thread with a fixed call-out fee approved in writing",
    overlayCards: [
      {
        position: "br",
        badge: "$120",
        badgeStyle: "float-badge-approved",
        title: "Call-out approved",
        sub: "In writing · both sides",
      },
    ],
  },
  {
    eyebrow: "One inbox",
    headline: "Every job in one place.",
    body: "New enquiries, quoted work, and completed jobs live in a single inbox. Emergencies pin to the top.",
    screenshot: "/assets/app-inbox.png",
    alt: "The tradie inbox in the Trust Trade app",
    overlayCards: [
      {
        position: "tr",
        icon: "!",
        title: "Emergency pinned",
        sub: "Hot water · Pakenham",
      },
    ],
  },
  {
    eyebrow: "Real numbers",
    headline: "Numbers behind your listing.",
    body: "Profile views, enquiries, first-reply time — plus a health score that tells you what to fix next.",
    screenshot: "/assets/app-insights.png",
    alt: "The tradie insights dashboard",
    overlayCards: [
      {
        position: "tl",
        icon: "↗",
        title: "+18% this week",
        sub: "Profile views vs last 7d",
      },
    ],
  },
];

const HOMEPAGE_BEHIND_SCENES = [
  {
    eyebrow: "Trade routing",
    headline: "Describe it in plain English.",
    body: "Type or dictate what's wrong. We work out which trade you actually need before you're routed anywhere.",
  },
  {
    eyebrow: "Checked at source",
    headline: "Verified at the regulator.",
    body: "Licence numbers cross-checked with VBA, ESV, ASIC, IP Australia. Re-checked quarterly on every listed tradie.",
  },
  {
    eyebrow: "On the record",
    headline: "Every job leaves a paper trail.",
    body: "Name, ABN, address, time, price. Auto-logged on both accounts the moment a job is marked complete.",
  },
];

const HOMEPAGE_ADDITIONAL = [
  { title: "Nearest first", body: "Sort verified locals by distance. No 25 km commute quotes." },
  { title: "Emergency filter", body: "Filter by who can be there today — verified and available." },
  { title: "Reviews from real jobs", body: "Only confirmed bookings can leave a review. No bot armies." },
  { title: "In-app chat", body: "One thread per job. ETA pings, photos, receipts — one place." },
  { title: "Fixed call-out fees", body: "Every tradie sets their own. In writing, approved up front." },
  { title: "Multi-postcode reach", body: "Tradies choose their radius. 5 km, 25 km, or the whole metro." },
  { title: "Founding 50 pricing", body: "First 50 tradies in lock in lifetime founding rates." },
  { title: "Human dispute mediation", body: "Both sides have the record. We mediate within 48 hours." },
];

const HOMEPAGE_VOICES = [
  {
    title: "The problem",
    quote:
      "I've quoted jobs where the customer showed me a competitor's estimate and I could tell it was a chancer with no licence, no insurance, hoping to be gone before it fell over. That's who Trust Trade exists to route around.",
    when: "Founder's note · May 2026",
  },
  {
    title: "Why cheap costs more",
    quote:
      "You save $200 up front on a dodgy tiler. You lose $2,000 fixing the waterproofing eighteen months later. Cheap tradies aren't cheap. They're just the first bill.",
    when: "Founder's note · June 2026",
  },
  {
    title: "What we're not",
    quote:
      "We're not a job-posting site. We don't sell your details to five people who then hound you at 7am. You browse, you pick, you contact. That's the whole model.",
    when: "Founder's note · June 2026",
  },
];

function ForTradiesSection({ onJoin }) {
  return (
    <section className="block tradies-section" id="tradies">
      <div className="container">
        <div className="tradies-grid">
          <div>
            <div className="eyebrow" style={{ marginBottom: 24 }}>
              — For tradies
            </div>
            <h2 className="h-1">
              More jobs. <span className="it">Less mucking around.</span>
            </h2>
            <p className="lede" style={{ marginTop: 24, marginBottom: 40 }}>
              Skip the lead-gen rort. Real homeowners, real jobs, routed to you by trade and
              postcode — on your terms.
            </p>
            <div className="tradies-list">
              <div className="item">
                <div className="n">01</div>
                <div className="body">
                  <h4>Customers who care about the work.</h4>
                  <p>
                    Verified accounts only. People who picked you because they want the job done
                    right — not because you're the cheapest bid.
                  </p>
                </div>
              </div>
              <div className="item">
                <div className="n">02</div>
                <div className="body">
                  <h4>You set the call-out fee. Per job.</h4>
                  <p>
                    No race-to-the-bottom bidding. Quote what the job's worth; they say yes or
                    they don't.
                  </p>
                </div>
              </div>
              <div className="item">
                <div className="n">03</div>
                <div className="body">
                  <h4>One inbox. One thread per job.</h4>
                  <p>
                    No more "which Sarah was the laundry tap one?" Every job lives in its own
                    conversation.
                  </p>
                </div>
              </div>
              <div className="item">
                <div className="n">04</div>
                <div className="body">
                  <h4>Reviews from real bookings.</h4>
                  <p>
                    Only verified customers can review you. Build a profile homeowners actually
                    trust — no fake stars, no drive-by sniping.
                  </p>
                </div>
              </div>
            </div>
            <div style={{ marginTop: 32, display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button className="btn btn-dark" onClick={onJoin}>
                Apply to join as a tradie →
              </button>
              <a
                href="#faq"
                className="btn btn-ghost"
                style={{ borderColor: "rgba(41,33,26,0.18)", color: "var(--on-accent)" }}
              >
                Tradie FAQ
              </a>
            </div>
          </div>
          <div className="tradies-visual">
            <div className="floater top-right">
              <div className="label">New enquiry</div>
              <strong>Hot water system isn't working</strong>
              <div style={{ color: "var(--text-dim)", marginTop: 4, fontSize: 12 }}>
                Pakenham · Emergency
              </div>
            </div>
            <div className="phone">
              <div className="phone-screen">
                <img
                  src="/assets/app-inbox.png"
                  alt="Tradie inbox: every job in one place"
                  loading="lazy"
                  decoding="async"
                  width={1284}
                  height={2778}
                />
              </div>
            </div>
            <div className="floater bottom-left">
              <div className="label">Approved</div>
              <strong>$200 ex GST</strong>
              <div style={{ color: "var(--text-dim)", marginTop: 4, fontSize: 12 }}>
                Logged on the record
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function WaitlistMoment() {
  const [role, setRole] = useState("homeowner");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [postcode, setPostcode] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [phone, setPhone] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [alreadyOnList, setAlreadyOnList] = useState(false);
  const [submittedRole, setSubmittedRole] = useState("homeowner");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const isTradie = role === "tradie";

  const submit = async (e) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    if (!cleanEmail || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        email: cleanEmail,
        role,
        name: name.trim(),
        postcode: postcode.trim(),
        businessName: isTradie ? businessName.trim() : "",
        phone: phone.trim(),
        source: window.location.pathname + window.location.hash,
      };
      console.log("[waitlist] submitting", payload);
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload),
      });
      const text = await res.text();
      let data = {};
      try { data = JSON.parse(text); } catch (_) {
        console.error("[waitlist] non-JSON response", { status: res.status, text: text.slice(0, 200) });
      }
      console.log("[waitlist] response", { status: res.status, ok: res.ok, data });
      if (!res.ok || !data.ok) {
        const apiError = data?.error || (res.status === 404 ? "API not found (404)." : `Server error (${res.status})`);
        setError(apiError);
        return;
      }
      setAlreadyOnList(Boolean(data.alreadyOnList));
      setSubmittedRole(role);
      setSubmitted(true);
    } catch (err) {
      console.error("[waitlist] fetch failed", err);
      setError("Couldn't reach the server. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="waitlist-block" id="waitlist">
      <div className="container">
        <div className="waitlist-inner">
          <div>
            <div className="eyebrow" style={{ marginBottom: 24 }}>
              — The waitlist
            </div>
            <h2 className="h-1">
              Be first in.
              <br />
              <span className="it">Lock in early.</span>
            </h2>
            <p
              className="lede"
              style={{ marginTop: 28, fontSize: "clamp(17px, 1.5vw, 21px)" }}
            >
              Waitlist members get web access before public launch, founding-member pricing, and a
              verified badge on their tradie profile. We open the gates fortnightly.
            </p>
            <div className="waitlist-meta">
              <div>
                <span className="check">✓</span> Early web access
              </div>
              <div>
                <span className="check">✓</span> Founding-member pricing
              </div>
              <div>
                <span className="check">✓</span> Verified badge
              </div>
              <div>
                <span className="check">✓</span> No spam, ever
              </div>
            </div>
          </div>
          {submitted ? (
            <div className="waitlist-success">
              <div className="tick">✓</div>
              <h3>{alreadyOnList ? "Already on the list." : "You're in, mate."}</h3>
              <p>
                {alreadyOnList
                  ? "Good news — you signed up earlier. We'll email you the day before access opens."
                  : submittedRole === "tradie"
                  ? "We'll email you a temporary password and a link to download the app the day before verification opens. Check your inbox for a confirmation."
                  : "We'll email you the day before web access opens. Check your inbox for a confirmation."}
              </p>
            </div>
          ) : (
            <form className="waitlist-card" onSubmit={submit}>
              <label>I am a…</label>
              <div className="role-toggle">
                <button
                  type="button"
                  className={role === "homeowner" ? "active" : ""}
                  onClick={() => setRole("homeowner")}
                >
                  Homeowner
                </button>
                <button
                  type="button"
                  className={role === "tradie" ? "active" : ""}
                  onClick={() => setRole("tradie")}
                >
                  Tradie
                </button>
              </div>

              {isTradie && (
                <>
                  <label>Business name</label>
                  <input
                    type="text"
                    placeholder="Your business name"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    required={isTradie}
                    maxLength={120}
                  />
                </>
              )}

              <label>Name (optional)</label>
              <input
                type="text"
                placeholder={isTradie ? "Your name" : "First name"}
                autoComplete="given-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={80}
              />

              <label>Email</label>
              <input
                type="email"
                placeholder="your@email.com.au"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <label>{isTradie ? "Mobile" : "Mobile (optional)"}</label>
              <input
                type="tel"
                placeholder="0412 345 678"
                inputMode="tel"
                autoComplete="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required={isTradie}
                maxLength={20}
              />

              <label>Postcode (optional)</label>
              <input
                type="text"
                placeholder="3810"
                inputMode="numeric"
                maxLength="4"
                value={postcode}
                onChange={(e) => setPostcode(e.target.value)}
              />

              <button
                className="btn btn-primary btn-lg"
                type="submit"
                disabled={submitting}
              >
                {submitting ? "Saving…" : "Get my spot →"}
              </button>
              {error && (
                <div className="small" style={{ color: "var(--emergency)", marginTop: 8 }}>
                  {error}
                </div>
              )}
              <div className="small">
                {isTradie
                  ? "We'll email you a temp password and download link when verification opens. By joining you agree to our Terms & Privacy."
                  : "By joining you agree to our Terms & Privacy. Unsubscribe with one tap."}
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}

const LANDING_FAQS = [
  { q: "When does the app launch?", a: "We're rolling out invites fortnightly from Q4 2026, starting with Victoria. iOS first, Android close behind. Web access opens for waitlist members before public launch." },
  { q: "Is Trust Trade free for homeowners?", a: "Yeah — finding and booking a tradie is free. You only ever pay the tradie's quoted call-out fee, and only after you've approved it in writing." },
  { q: "How do you verify tradies?", a: "We check licence numbers with the relevant state regulator (e.g. VBA for builders, ESV for sparkies), confirm public liability and workers' comp insurance, and only show reviews from confirmed bookings on the platform." },
  { q: "Which trades are covered?", a: "At launch: electricians, plumbers, HVAC, carpenters, builders, painters, tilers, roofers, plasterers, landscapers, concreters, fencers, handymen, bricklayers and floorers. More on request." },
  { q: "Does the AI replace talking to a real tradie?", a: "Nope. The AI's job is to work out which trade you actually need from a plain-English description — then point you at verified humans. The fix-it bit is still done by a real, insured person, on site." },
  { q: "I'm a tradie — what does it cost to join?", a: "Free to apply and free to be listed. Founding members (the first 50 in) get lifetime founding-member pricing on any future paid tiers. Standard fees kick in after public launch." },
  { q: "Where are you operating?", a: "Starting in Victoria — Melbourne metro, Geelong, and Gippsland (yes, including Pakenham). NSW, QLD and SA in the months after launch." },
  { q: "What if it goes wrong on the day?", a: "Every booking has a receipt: name, address, time, price, the lot. If something's off, both sides have the record. We mediate disputes between verified accounts within 48 hours." },
];

function FAQSection() {
  const [open, setOpen] = useState(0);
  return (
    <section className="block" id="faq">
      <div className="container">
        <div className="section-head">
          <div className="eyebrow accent">— Questions</div>
          <div>
            <h2 className="h-1">
              You ask. <span className="it">We answer.</span>
            </h2>
          </div>
        </div>
        <div className="faq-grid">
          {LANDING_FAQS.map((item, i) => {
            const isOpen = open === i;
            const panelId = `landing-faq-a-${i}`;
            const buttonId = `landing-faq-q-${i}`;
            return (
              <div key={i} className={"faq-item " + (isOpen ? "open" : "")}>
                <button
                  type="button"
                  className="faq-q"
                  id={buttonId}
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => setOpen(isOpen ? -1 : i)}
                >
                  <span>{item.q}</span>
                  <span className="plus" aria-hidden="true">
                    +
                  </span>
                </button>
                <div
                  id={panelId}
                  role="region"
                  aria-labelledby={buttonId}
                  className="faq-a"
                >
                  <div className="faq-a-inner">
                    <div className="faq-a-text">{item.a}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function MobileStickyCTA({ onJoin }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const f = () => setVisible(window.scrollY > 400);
    f();
    window.addEventListener("scroll", f, { passive: true });
    return () => window.removeEventListener("scroll", f);
  }, []);
  return (
    <div className={"mobile-sticky " + (visible ? "visible" : "")}>
      <button className="btn btn-primary" onClick={onJoin}>
        Download the app →
      </button>
    </div>
  );
}

// ===== Hero — centered "Done proper." design hero =====
function BevelHero() {
  return (
    <section className="hero bevel-hero" id="top">
      <div className="hero-sky" aria-hidden="true" />
      <div className="container">
        <div className="eyebrow accent dot hero-eyebrow" style={{ justifyContent: "center" }}>
          Australia's honest trade app
        </div>
        <h1 className="h-display">
          Find a tradie.
          <br />
          <span className="it">Done proper.</span>
        </h1>
        <p className="lede">
          Trust Trade makes sense of your job — from a leaking tap to a full reno — and routes you
          to a verified, insured local who can actually fix it.
        </p>
        <div className="hero-actions">
          <a
            className="appstore-btn"
            href="#download"
            onClick={(e) => {
              e.preventDefault();
              scrollToWaitlist();
            }}
          >
            <span className="glyph" aria-hidden="true">
              <svg width="22" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.05 12.94c.02-2.34 1.92-3.47 2-3.52-1.09-1.6-2.79-1.82-3.4-1.85-1.43-.15-2.81.86-3.54.86-.74 0-1.86-.84-3.06-.82-1.57.02-3.03.92-3.84 2.33-1.65 2.86-.42 7.08 1.18 9.4.78 1.13 1.71 2.4 2.93 2.35 1.18-.05 1.63-.76 3.05-.76 1.42 0 1.82.76 3.06.74 1.27-.02 2.07-1.15 2.84-2.29.9-1.31 1.27-2.59 1.29-2.65-.03-.01-2.47-.95-2.51-3.79zM14.74 5.72c.66-.8 1.1-1.91.98-3.02-.95.04-2.09.63-2.77 1.43-.61.71-1.14 1.84-1 2.94 1.06.08 2.13-.54 2.79-1.35z" />
              </svg>
            </span>
            <span className="as-txt">
              <span className="small">Download on the</span>
              <span className="big">App Store</span>
            </span>
          </a>
        </div>
        <div className="hero-rating">
          <span className="stars">★★★★★</span>
          <span>1,247 mates already in line</span>
        </div>

        <div className="hero-trio">
          <div className="phone side left">
            <div className="phone-screen">
              <img src="/assets/app-browse.png" alt="Browse verified tradies" />
            </div>
          </div>
          <div className="phone center">
            <div className="phone-screen">
              <img src="/assets/app-home.png" alt="Trust Trade app home screen" />
            </div>
          </div>
          <div className="phone side right">
            <div className="phone-screen">
              <img src="/assets/app-booking.png" alt="Booking confirmation" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ===== Trust strip =====
function TrustStrip() {
  return (
    <section className="trust-strip">
      <div className="container">
        <div className="trust-strip-grid">
          <div className="trust-item">
            <div className="num">100<span className="sm">%</span></div>
            <div className="lbl">Tradies verified before they land in front of you.</div>
          </div>
          <div className="trust-item">
            <div className="num"><span className="it">0</span></div>
            <div className="lbl">Cold leads. Tradies get matched, not auctioned off.</div>
          </div>
          <div className="trust-item">
            <div className="num">3<span className="sm">min</span></div>
            <div className="lbl">Average time from "I need help" to a quote in writing.</div>
          </div>
          <div className="trust-item">
            <div className="num"><span className="it">AU</span></div>
            <div className="lbl">Built in Naarm/Melbourne. For Aussie homes, Aussie trades.</div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ===== How it works (3 steps) =====
function HowItWorksSteps() {
  return (
    <section className="block" id="how">
      <div className="container">
        <div className="section-head">
          <div className="eyebrow accent">— Homeowners</div>
          <div>
            <h2 className="h-1">
              Three taps. Real humans. <span className="it">Done proper.</span>
            </h2>
            <p className="lede" style={{ marginTop: 18 }}>
              No quote-form rodeo. No five tradies SMS-blasting you at 7am. Tell us what's broken;
              we'll route you to someone who can fix it today.
            </p>
          </div>
        </div>
        <div className="steps">
          <div className="step">
            <div className="step-num">01</div>
            <h3 className="h-3">Tell us what's gone wrong.</h3>
            <p>Leaking tap. Tripping fuse. Planning a reno. Plain English — our AI works out which trade you actually need.</p>
            <div className="step-visual"><img src="/assets/app-askai.png" alt="Ask AI screen" /></div>
          </div>
          <div className="step">
            <div className="step-num">02</div>
            <h3 className="h-3">We route to vetted locals.</h3>
            <p>Insured, licenced, reviewed. Nearest first. No marketplace mosh-pit — just a shortlist of mates who can do the job.</p>
            <div className="step-visual"><img src="/assets/app-browse.png" alt="Browse tradies screen" /></div>
          </div>
          <div className="step">
            <div className="step-num">03</div>
            <h3 className="h-3">Approve the price. Book it in.</h3>
            <p>Fixed call-out fee, in writing, up front. Tap Approve and you've got a booking confirmation — name, time, address, all logged.</p>
            <div className="step-visual"><img src="/assets/app-booking.png" alt="Booking confirmation screen" /></div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ===== Features bento =====
function FeaturesBento() {
  return (
    <section className="block" id="features" style={{ paddingTop: 0 }}>
      <div className="container">
        <div className="section-head">
          <div className="eyebrow accent">— Why Trust Trade</div>
          <div>
            <h2 className="h-1">
              Built like the trades you'd <span className="it">actually recommend.</span>
            </h2>
          </div>
        </div>
        <div className="bento">
          <div className="feat feat-1 feat-verified">
            <div className="feat-eyebrow">Verified · Step 0</div>
            <h3 className="h-big">Every tradie checked before they're listed.</h3>
            <p>Licence numbers verified with the regulator. Public liability and workers' comp on file. Reviews from real, confirmed jobs — not rideshare-style spam.</p>
            <div className="feat-visual">
              <div className="verified-stack">
                <div className="verified-card">
                  <div className="badge">✓ VERIFIED</div>
                  Advanced Gas &amp; Aircon
                  <div className="meta">HVAC · 3.2 km</div>
                </div>
                <div className="verified-card dark">
                  <div className="badge">✓ VERIFIED</div>
                  JT Valley Electrics
                  <div className="meta">Electrician · 28.6 km</div>
                </div>
              </div>
            </div>
          </div>

          <div className="feat feat-2 feat-ai">
            <div className="feat-eyebrow">Ask AI</div>
            <h3>Describe it in plain English.</h3>
            <p>We work out the trade — and route you to the right one.</p>
            <div className="ai-bubble">
              "Hot water's running cold and there's a hissing noise from the cylinder."
              <br /><br />
              <span style={{ color: "var(--accent)", fontWeight: 600 }}>Sounds like a plumber — gas hot water specialist.</span>
              <span className="typing"><span /><span /><span /></span>
            </div>
          </div>

          <div className="feat feat-3 feat-price">
            <div className="feat-eyebrow">Fixed quotes</div>
            <h3>Call-out fees in writing. Approved up front.</h3>
            <div className="price-card">
              <div>
                <div className="label">Call-out fee</div>
                <div className="amount">$200 <span className="ex">ex GST</span></div>
                <div className="approved">✓ APPROVED · 3 hr ETA</div>
              </div>
            </div>
          </div>

          <div className="feat feat-4 feat-msg">
            <div className="feat-eyebrow">In-app chat</div>
            <h3>One thread per job.</h3>
            <div className="msg-thread">
              <div className="bubble in">On my way — 20 min ETA</div>
              <div className="bubble out">Sweet, gate's unlocked</div>
              <div className="bubble in">Done. Receipt emailed.</div>
            </div>
          </div>

          <div className="feat feat-5 feat-near">
            <div className="feat-eyebrow">Nearest first</div>
            <h3>See who's around the corner.</h3>
            <div className="near-card">
              <div className="avatar">A</div>
              <div>
                <div className="name">Advanced Gas &amp; Aircon</div>
                <div className="trade">HVAC · ★ 5.0 (4)</div>
              </div>
              <div className="km">3.2 km</div>
            </div>
          </div>

          <div className="feat feat-6">
            <div className="feat-eyebrow">Receipts</div>
            <h3>Both sides protected.</h3>
            <p>Name, address, time, price — all logged in your inbox. If something goes sideways, the record's there.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

// ===== For tradies (split) =====
function ForTradiesSplit() {
  return (
    <section className="block tradies-section" id="tradies">
      <div className="container">
        <div className="tradies-grid">
          <div>
            <div className="eyebrow" style={{ marginBottom: 24 }}>— For tradies</div>
            <h2 className="h-1">
              More jobs. <span className="it">Less mucking around.</span>
            </h2>
            <p className="lede" style={{ marginTop: 24, marginBottom: 40 }}>
              Skip the lead-gen rort. Real homeowners, real jobs, routed to you by trade and postcode
              — on your terms.
            </p>
            <div className="tradies-list">
              <div className="item">
                <div className="n">01</div>
                <div className="body">
                  <h4>Real customers, not tyre-kickers.</h4>
                  <p>Verified accounts only. They've told us what they need before you ever see the job.</p>
                </div>
              </div>
              <div className="item">
                <div className="n">02</div>
                <div className="body">
                  <h4>You set the call-out fee. Per job.</h4>
                  <p>No race-to-the-bottom bidding. Quote what the job's worth; they approve before you roll.</p>
                </div>
              </div>
              <div className="item">
                <div className="n">03</div>
                <div className="body">
                  <h4>One inbox. One thread per job.</h4>
                  <p>No more "which Sarah was the laundry tap one?" Every job lives in its own conversation.</p>
                </div>
              </div>
              <div className="item">
                <div className="n">04</div>
                <div className="body">
                  <h4>Get paid faster.</h4>
                  <p>Receipts, bookings and confirmations baked in. Disputes drop, payments speed up.</p>
                </div>
              </div>
            </div>
            <div style={{ marginTop: 40, display: "flex", gap: 12, flexWrap: "wrap" }}>
              <button className="btn btn-dark btn-lg" onClick={scrollToWaitlist}>
                Apply to join as a tradie →
              </button>
              <PageLink
                href="For Tradies.html"
                className="btn btn-ghost btn-lg"
                style={{ borderColor: "rgba(12,9,7,0.15)", color: "var(--on-accent)" }}
              >
                For tradies
              </PageLink>
            </div>
          </div>
          <div className="tradies-visual">
            <div className="floater top-right">
              <div className="label">New enquiry</div>
              <strong>Hot water system isn't working</strong>
              <div style={{ color: "var(--text-dim)", marginTop: 4, fontSize: 12 }}>Pakenham · Emergency</div>
            </div>
            <div className="phone">
              <div className="phone-screen">
                <img src="/assets/app-jobs.png" alt="My Jobs screen" />
              </div>
            </div>
            <div className="floater bottom-left">
              <div className="label">Approved</div>
              <strong>$200 ex GST</strong>
              <div style={{ color: "var(--text-dim)", marginTop: 4, fontSize: 12 }}>On site within 3 hrs</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ===== App-screen showcase (phone marquee) ===== */
const SHOWCASE_SHOTS = [
  "app-home", "app-askai", "app-browse", "app-booking",
  "app-jobs", "app-messages", "app-filters", "app-account",
];
function Showcase() {
  const loop = [...SHOWCASE_SHOTS, ...SHOWCASE_SHOTS];
  return (
    <section className="showcase">
      <div className="container showcase-head reveal">
        <div className="eyebrow accent dot" style={{ justifyContent: "center", marginBottom: 16 }}>
          The whole app
        </div>
        <h2 className="h-2">See exactly how it works — before you download.</h2>
      </div>
      <div className="showcase-marquee">
        <div className="showcase-track">
          {loop.map((src, i) => (
            <div className="phone sm" key={i}>
              <div className="phone-screen">
                <img src={`/assets/${src}.png`} alt="Trust Trade app screen" loading="lazy" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ===== Works with (verification bodies) ===== */
const LOGOS = [
  { mark: "VBA", name: "Victorian Building Authority", sub: "Licence check" },
  { mark: "ESV", name: "Energy Safe Victoria", sub: "Sparkies verified" },
  { mark: "VBA", name: "Plumbing Industry", sub: "Registration check" },
  { mark: "WS", name: "WorkSafe", sub: "Workers' comp" },
  { mark: "PL", name: "Public Liability", sub: "Insurance on file" },
  { mark: "ABN", name: "ABN Lookup", sub: "Business verified" },
  { mark: "MP", name: "Master Plumbers", sub: "Association member" },
  { mark: "NECA", name: "Electrical Assoc.", sub: "Trade body" },
];
function WorksWith() {
  const loop = [...LOGOS, ...LOGOS];
  return (
    <section className="works">
      <div className="container works-head reveal">
        <div className="eyebrow accent" style={{ justifyContent: "center", marginBottom: 14 }}>
          Verified against
        </div>
        <div className="h-3">Every tradie checked with the bodies that actually matter.</div>
      </div>
      <div className="logo-marquee">
        <div className="logo-track">
          {loop.map((l, i) => (
            <div className="logo-chip" key={i}>
              <div className="lc-mark">{l.mark}</div>
              <div className="lc-txt">
                <span className="lc-name">{l.name}</span>
                <span className="lc-sub">{l.sub}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ===== Live "Ask AI" chat demo ===== */
function AskAiDemo() {
  const GREETING = "G'day — tell me what's gone wrong at home (leaking tap, tripping fuse, planning a reno) and I'll work out which trade you need.";
  const [thread, setThread] = useState([{ role: "assistant", content: GREETING }]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);

  const send = async (e) => {
    e.preventDefault();
    const msg = input.trim();
    if (!msg || busy) return;
    const next = [...thread, { role: "user", content: msg }];
    setThread(next);
    setInput("");
    setBusy(true);
    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      const data = await res.json().catch(() => ({}));
      const reply =
        data && data.ok && data.reply
          ? data.reply
          : "Hmm, I couldn't reach the assistant just now — give it another go.";
      setThread((t) => [...t, { role: "assistant", content: reply }]);
    } catch {
      setThread((t) => [
        ...t,
        { role: "assistant", content: "Couldn't reach the assistant — check your connection and try again." },
      ]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="askai">
      <div className="askai-head">
        <span className="askai-dot" aria-hidden="true" />
        Trust Trade Assistant
        <span className="askai-live">● LIVE</span>
      </div>
      <div className="askai-thread">
        {thread.map((m, i) => (
          <div className={"askai-msg " + m.role} key={i}>
            {m.content}
          </div>
        ))}
        {busy && (
          <div className="askai-msg assistant askai-typing" aria-label="Assistant is typing">
            <span /><span /><span />
          </div>
        )}
      </div>
      <form className="askai-input" onSubmit={send}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="What's broken at home?"
          aria-label="Describe your problem"
          maxLength={500}
        />
        <button type="submit" disabled={busy || !input.trim()} aria-label="Send">→</button>
      </form>
    </div>
  );
}

/* ===== Feature breakdown rows ===== */
function FeatureRow({ eyebrow, title, body, points, img, flip, cards, glow, visual }) {
  return (
    <div className={"feature-row reveal " + (flip ? "flip" : "")}>
      <div className="fr-copy">
        <div className="eyebrow accent dot">{eyebrow}</div>
        <h3 className="h-2">{title}</h3>
        <p>{body}</p>
        {points && (
          <div className="fr-points">
            {points.map((p, i) => (
              <div className="fr-point" key={i}>
                <span className="tick">✓</span>
                <span>{p}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="fr-visual">
        {visual || (
          <>
            {glow !== false && <div className="glow" />}
            <div className="phone">
              <div className="phone-screen">
                <img src={img} alt={title} loading="lazy" />
              </div>
            </div>
            {cards}
          </>
        )}
      </div>
    </div>
  );
}
function FeatureBreakdowns() {
  return (
    <section className="block" id="how">
      <div className="container">
        <div className="sec-intro reveal">
          <div className="eyebrow accent dot" style={{ justifyContent: "center" }}>For homeowners</div>
          <h2 className="h-1" style={{ marginTop: 18 }}>
            Right tradie. <span className="it">First time.</span>
          </h2>
          <p className="lede">
            No quote-form rodeo. No five tradies SMS-blasting you at 7am. Tell us what's broken and
            Trust Trade routes you to a verified local who can fix it.
          </p>
        </div>

        <FeatureRow
          visual={<AskAiDemo />}
          eyebrow="Ask AI"
          title="Describe it in plain English."
          body="Leaking tap, tripping fuse, planning a reno — say it how you'd say it to a mate. Our assistant works out which trade you actually need and points you at the verified pros nearby."
          points={["No guessing which trade to call", "Understands emergencies vs routine jobs", "Suggests the right local, first time"]}
          img="/assets/app-askai.png"
          cards={
            <div className="fcard pos-tr">
              <div className="ai-line">
                <span className="q">"Hot water's gone cold and there's a hissing from the cylinder."</span>
                <span className="a">
                  Sounds like a plumber — gas hot water specialist.
                  <span className="typing"><span /><span /><span /></span>
                </span>
              </div>
            </div>
          }
        />
        <FeatureRow
          flip
          eyebrow="Verified · Step 0"
          title="Every tradie checked before they're listed."
          body="Licence numbers verified with the regulator. Public liability and workers' comp on file. Reviews only from real, confirmed jobs — never rideshare-style spam."
          points={["Licence + insurance confirmed", "Nearest-first, so help's close by", "Real reviews from booked jobs only"]}
          img="/assets/app-browse.png"
          cards={
            <>
              <div className="fcard amber pos-tl">
                <div className="fc-badge">✓ VERIFIED</div>
                <div className="fc-title">Advanced Gas &amp; Aircon</div>
                <div className="fc-sub" style={{ color: "rgba(23,17,10,0.6)" }}>HVAC · ★ 5.0 (4) · 3.2 km</div>
              </div>
              <div className="fcard pos-br">
                <div className="fc-eyebrow">Nearest first</div>
                <div className="fc-title">10 verified locals</div>
                <div className="fc-sub">near Pakenham, VIC 3810</div>
              </div>
            </>
          }
        />
        <FeatureRow
          eyebrow="Fixed quotes"
          title="Call-out fees in writing. Approved up front."
          body="The tradie quotes the job before they roll. You see the fee and ETA, tap Approve, and it's locked in. No surprise invoices, no cash-job awkwardness."
          points={["Price agreed before anyone turns up", "One-tap approve, in the app", "GST-clear and on the record"]}
          img="/assets/app-booking.png"
          cards={
            <>
              <div className="fcard pos-tl">
                <div className="fc-eyebrow">Call-out fee</div>
                <div className="fc-price">$200 <span className="ex">ex GST</span></div>
                <div className="fc-approved">✓ APPROVED · 3 HR ETA</div>
              </div>
              <div className="fcard dark pos-br">
                <div className="fc-eyebrow">Booking confirmed</div>
                <div className="fc-title" style={{ color: "#F3ECDD" }}>Mon 18 May · 8:39pm</div>
                <div className="fc-sub">Name, address &amp; price all logged</div>
              </div>
            </>
          }
        />
        <FeatureRow
          flip
          eyebrow="In-app chat"
          title="One thread per job. Nothing lost."
          body="Every enquiry gets its own conversation — quote, ETA, photos, booking receipt, all in one place. No more scrolling texts trying to find which Sarah had the laundry tap."
          points={["Quote, chat and receipt in one thread", "Share photos of the problem", "Both sides keep the full record"]}
          img="/assets/app-messages.png"
          cards={
            <div className="fcard pos-tr">
              <div className="fc-eyebrow">On the way</div>
              <div className="fc-title">20 min ETA</div>
              <div className="fc-sub">Demo Trades Co. · Plumber</div>
            </div>
          }
        />
      </div>
    </section>
  );
}

/* ===== For tradies band ===== */
function ForTradiesBand() {
  const items = [
    ["01", "Real customers, not tyre-kickers.", "Verified accounts only. They've told us what they need before you ever see the job."],
    ["02", "You set the call-out fee. Per job.", "No race-to-the-bottom bidding. Quote what the job's worth; they approve before you roll."],
    ["03", "One inbox. One thread per job.", "Every job lives in its own conversation. Quote, chat, receipt — sorted."],
    ["04", "Get paid faster.", "Receipts, bookings and confirmations baked in. Disputes drop, payments speed up."],
  ];
  return (
    <section className="block tradies" id="tradies">
      <div className="container">
        <div className="tradies-grid">
          <div className="reveal">
            <div className="eyebrow dot">On the tools</div>
            <h2 className="h-1" style={{ marginTop: 16 }}>
              More jobs. <span className="it">Less mucking around.</span>
            </h2>
            <p className="lede" style={{ marginTop: 20 }}>
              Skip the lead-gen rort. Real homeowners, real jobs, routed to you by trade and postcode
              — on your terms.
            </p>
            <div className="tradies-list">
              {items.map(([n, h, p]) => (
                <div className="ti" key={n}>
                  <div className="n">{n}</div>
                  <div>
                    <h4>{h}</h4>
                    <p>{p}</p>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 34, display: "flex", gap: 12, flexWrap: "wrap" }}>
              <button className="btn btn-primary btn-lg" onClick={scrollToWaitlist}>
                Apply to join as a tradie →
              </button>
            </div>
          </div>
          <div className="tradies-visual reveal">
            <div className="glow" />
            <div className="phone">
              <div className="phone-screen">
                <img src="/assets/app-jobs.png" alt="Tradie jobs screen" loading="lazy" />
              </div>
            </div>
            <div className="fcard pos-tr">
              <div className="fc-eyebrow">New enquiry</div>
              <div className="fc-title">Hot water system down</div>
              <div className="fc-sub">Pakenham · Emergency</div>
            </div>
            <div className="fcard amber pos-bl">
              <div className="fc-eyebrow">Approved</div>
              <div className="fc-price">$200 <span className="ex">ex GST</span></div>
              <div className="fc-sub" style={{ color: "rgba(23,17,10,0.6)" }}>On site within 3 hrs</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ===== Feature grid ===== */
const GRID = [
  ["◎", "Nearest-first matching", "See who's genuinely around the corner — sorted by distance, not who paid the most."],
  ["✦", "Insurance on file", "Public liability and workers' comp confirmed before a tradie ever lands in your feed."],
  ["◈", "Booking receipts", "Name, address, time and price logged for every job. Protection for both sides."],
  ["✱", "Emergency call-outs", "Flag it urgent and we prioritise tradies who can be on site today."],
  ["✧", "Real reviews only", "Ratings come from confirmed bookings on the platform — no fake five-stars."],
  ["◇", "No cold leads", "Homeowners get matched, not auctioned. Tradies get jobs, not spam."],
  ["⬡", "Postcode routing", "Type your suburb once; we keep everything local from then on."],
  ["◐", "Fixed quotes", "Call-out fees agreed in writing and approved before anyone turns up."],
  ["✚", "Built for AU", "Made for Aussie homes and Aussie trades. GST-clear throughout."],
];
function FeatureGrid() {
  return (
    <section className="block" id="features">
      <div className="container">
        <div className="sec-intro reveal">
          <div className="eyebrow accent dot" style={{ justifyContent: "center" }}>And that's not all</div>
          <h2 className="h-1" style={{ marginTop: 18 }}>
            Little things that make it <span className="it">actually work.</span>
          </h2>
        </div>
        <div className="fgrid">
          {GRID.map(([ic, h, p], i) => (
            <div className="fg-card reveal" key={i} style={{ transitionDelay: (i % 3) * 60 + "ms" }}>
              <div className="fg-icon">{ic}</div>
              <h4>{h}</h4>
              <p>{p}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ===== Reviews wall ===== */
const REVIEWS = [
  { s: 5, t: "Sparkie was here same arvo", r: "Fuse kept tripping, described it in the app and had a verified sparkie booked within the hour. Fixed price up front, no dramas.", who: "Bianca R.", loc: "Berwick, VIC", tag: "Homeowner", av: "B" },
  { s: 5, t: "No more tyre-kickers", r: "Every lead's a real job now. Homeowner's already told the app what they need before I even reply. Massive time saver.", who: "Dave — DK Plumbing", loc: "Pakenham, VIC", tag: "Tradie", av: "D" },
  { s: 5, t: "Finally, a quote in writing", r: "Loved seeing the call-out fee before he came out. Tapped approve and got a booking confirmation with everything logged.", who: "Marcus T.", loc: "Officer, VIC", tag: "Homeowner", av: "M" },
  { s: 5, t: "Reckon it's the future", r: "Being verified against my licence and insurance actually means something. Customers trust the badge, so they book quicker.", who: "Jess — Valley Electrics", loc: "Yarra Valley, VIC", tag: "Tradie", av: "J" },
  { s: 5, t: "Knew who I was dealing with", r: "The verified tick and real reviews gave me the confidence to book someone I'd never heard of. Turned up on time, did it proper.", who: "Priya S.", loc: "Cranbourne, VIC", tag: "Homeowner", av: "P" },
  { s: 5, t: "One thread, no chaos", r: "Everything for the job lives in one chat — quote, photos, the lot. Way better than losing texts across three numbers.", who: "Tom H.", loc: "Narre Warren, VIC", tag: "Homeowner", av: "T" },
  { s: 5, t: "Set my own price", r: "No racing to the bottom on price. I quote what the job's worth and they approve it. That's how it should be.", who: "Sam — Ace Carpentry", loc: "Gippsland, VIC", tag: "Tradie", av: "S" },
  { s: 5, t: "Emergency sorted fast", r: "Flagged a burst pipe as urgent at 6pm and had someone on site by 8. Genuinely saved the kitchen ceiling.", who: "Lauren M.", loc: "Melbourne, VIC", tag: "Homeowner", av: "L" },
  { s: 5, t: "Payments come quicker", r: "Booking receipts mean no arguing about what was agreed. Invoices get paid without the usual chasing.", who: "Nick — Metro HVAC", loc: "Dandenong, VIC", tag: "Tradie", av: "N" },
];
function RevCard({ rv }) {
  return (
    <div className="rev-card">
      <div className="stars">{"★".repeat(rv.s)}</div>
      <h5>{rv.t}</h5>
      <p>"{rv.r}"</p>
      <div className="rev-meta">
        <div className="av">{rv.av}</div>
        <div className="who"><strong>{rv.who}</strong>{rv.loc}</div>
        <div className="rev-tag">{rv.tag}</div>
      </div>
    </div>
  );
}
function Reviews() {
  const cols = [
    [REVIEWS[0], REVIEWS[3], REVIEWS[6]],
    [REVIEWS[1], REVIEWS[4], REVIEWS[7]],
    [REVIEWS[2], REVIEWS[5], REVIEWS[8]],
  ];
  const clsFor = (i) => ["", "b", "c"][i];
  return (
    <section className="block reviews" id="reviews">
      <div className="container">
        <div className="sec-intro reveal">
          <div className="eyebrow accent dot" style={{ justifyContent: "center" }}>Loved on both sides</div>
          <h2 className="h-1" style={{ marginTop: 18 }}>
            Homeowners and tradies, <span className="it">on the same team.</span>
          </h2>
          <p className="lede">
            Early access members are already sorting jobs the honest way. Here's what they reckon.
          </p>
        </div>
        <div className="reviews-cols reveal">
          {cols.map((col, ci) => (
            <div className={"rev-col " + clsFor(ci)} key={ci}>
              {[...col, ...col].map((rv, i) => (
                <RevCard rv={rv} key={i} />
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function LandingPage() {
  usePageReveal();
  return (
    <>
      <PageHeader current="Trust Trade Landing.html" />
      <div className="tt-home">
        <BevelHero />
        <Showcase />
        <WorksWith />
        <FeatureBreakdowns />
        <ForTradiesBand />
        <FeatureGrid />
        <Reviews />
      </div>
      <PageDownloadCTA />
      <PageFooter />
      <MobileStickyCTA onJoin={scrollToWaitlist} />
    </>
  );
}
