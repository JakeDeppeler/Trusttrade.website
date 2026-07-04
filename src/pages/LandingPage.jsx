import { useEffect, useState } from "react";
import { PageFooter, PageHeader } from "../components/PageChrome.jsx";
import PageLink from "../components/PageLink.jsx";
import {
  FeatureStories,
  BehindTheScenes,
  AdditionalFeatures,
  PrivacyBreak,
  VoiceCards,
} from "../components/BevelSections.jsx";

function scrollToWaitlist() {
  const el = document.getElementById("waitlist");
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
        Get early access →
      </button>
    </div>
  );
}

// ===== Hero (grid) — design landing hero =====
function HeroGrid() {
  const [email, setEmail] = useState("");
  const submit = (e) => {
    e.preventDefault();
    scrollToWaitlist();
  };
  return (
    <section className="hero" id="top">
      <div className="container">
        <div className="hero-grid">
          <div>
            <div className="hero-eyebrow-row">
              <span className="hero-pill">
                <span className="dot" />
                Pre-register · Drops Q4 2026
              </span>
            </div>
            <h1 className="h-display">
              Find a tradie.
              <br />
              <span className="glow-wrap">
                <span className="it">Done proper.</span>
              </span>
            </h1>
            <p className="lede" style={{ marginTop: 32 }}>
              Verified, insured, recommended local tradies — landing on your phone soon. Hop on the
              list to lock in early web access and founding-member perks.
            </p>
            <form className="waitlist-form" onSubmit={submit}>
              <input
                type="email"
                placeholder="your@email.com.au"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-label="Email address"
              />
              <button className="btn btn-primary" type="submit">
                Get on the list →
              </button>
            </form>
            <div className="hero-trust-row">
              <div className="avatars">
                <span>J</span><span>A</span><span>M</span><span>K</span>
              </div>
              <div>1,247 mates already in line · No spam, ever.</div>
            </div>
          </div>
          <div className="phone-stage">
            <div className="phone-tag tag-1"><span className="swatch" />Verified, insured</div>
            <div className="phone-tag tag-2"><span className="swatch" />3 min response</div>
            <div className="phone-tag tag-3"><span className="swatch" />Fixed call-out fee</div>
            <div className="phone">
              <div className="phone-screen">
                <img src="/assets/app-home.png" alt="Trust Trade app home screen" />
              </div>
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

export default function LandingPage() {
  return (
    <>
      <PageHeader current="Trust Trade Landing.html" />
      <HeroGrid />
      <TrustStrip />
      <HowItWorksSteps />
      <FeaturesBento />
      <ForTradiesSplit />
      <WaitlistMoment />
      <FAQSection />
      <PageFooter />
      <MobileStickyCTA onJoin={scrollToWaitlist} />
    </>
  );
}
