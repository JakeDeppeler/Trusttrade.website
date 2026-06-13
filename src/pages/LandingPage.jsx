import { useEffect, useState } from "react";
import { MobileNavMenu, PAGE_LINKS, PageFooter } from "../components/PageChrome.jsx";
import PageLink from "../components/PageLink.jsx";

function scrollToWaitlist() {
  const el = document.getElementById("waitlist");
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "start" });
}

function LandingHeader({ onJoin }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const f = () => setScrolled(window.scrollY > 16);
    f();
    window.addEventListener("scroll", f, { passive: true });
    return () => window.removeEventListener("scroll", f);
  }, []);
  return (
    <header className={"header " + (scrolled ? "scrolled" : "")}>
      <div className="container">
        <a href="#top" className="brand">
          Trust Trade<span className="reg">®</span>
        </a>
        <nav className="nav-links">
          {PAGE_LINKS.map((l) => (
            <PageLink key={l.href} href={l.href}>
              {l.label}
            </PageLink>
          ))}
        </nav>
        <div className="header-cta">
          <span className="header-pill">
            <span className="dot"></span>
            Coming soon · iOS &amp; Android
          </span>
          <button className="btn btn-primary btn-sm header-cta-btn" onClick={onJoin}>
            Get early access
          </button>
          <MobileNavMenu />
        </div>
      </div>
    </header>
  );
}

function Hero({ onJoin }) {
  return (
    <section className="hero" id="top">
      <div className="container">
        <div className="hero-grid">
          <div>
            <h1 className="h-display">
              Find a tradie.
              <br />
              <span className="glow-wrap">
                <span className="it">Done proper.</span>
              </span>
            </h1>
            <p className="lede" style={{ marginTop: 32 }}>
              Built by a mechanical plumber who started at the bottom and now sees both sides —
              on the tools and quoting the work. The same problem keeps showing up: people don't
              know who to trust. Verified, insured, recommended local tradies — landing on your
              phone soon.
            </p>
            <div className="hero-cta-row">
              <button
                type="button"
                className="btn btn-primary btn-lg"
                onClick={onJoin}
              >
                Get on the list →
              </button>
            </div>
            <div className="hero-trust-row">
              <div className="avatars">
                <span>J</span>
                <span>A</span>
                <span>M</span>
                <span>K</span>
              </div>
              <div>Just getting started · No spam, ever.</div>
            </div>
          </div>
          <div className="phone-stage">
            <div className="phone-tag tag-1">
              <span className="swatch"></span>Verified, insured
            </div>
            <div className="phone-tag tag-2">
              <span className="swatch"></span>3 min response
            </div>
            <div className="phone-tag tag-3">
              <span className="swatch"></span>Fixed call-out fee
            </div>
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

function TrustStrip() {
  return (
    <section className="trust-strip">
      <div className="container">
        <div className="trust-strip-grid">
          <PageLink href="About.html" className="trust-item">
            <div className="num">
              100<span className="sm">%</span>
            </div>
            <div className="lbl">Tradies verified before they land in front of you.</div>
          </PageLink>
          <PageLink href="About.html" className="trust-item">
            <div className="num">
              4
            </div>
            <div className="lbl">Hard checks before a tradie's listed. Licence, insurance, ABN, conduct.</div>
          </PageLink>
          <PageLink href="About.html" className="trust-item">
            <div className="num">
              $0
            </div>
            <div className="lbl">Surcharge for homeowners. Free to use, no commission on tradies.</div>
          </PageLink>
          <PageLink href="About.html" className="trust-item">
            <div className="num">
              <span className="it">20<span className="sm">+</span></span>
            </div>
            <div className="lbl">
              Verification points we check on every tradie. So you actually know who to trust.
            </div>
          </PageLink>
        </div>
      </div>
    </section>
  );
}

const DIFFERENTIATOR_HOOKS = [
  {
    ticker: "Hook 01",
    title: "Verified at the regulator.",
    body: "Every tradie's licence is checked at the source — VBA, ESV, VBPRB. Not honour-system. Not self-reported. Re-checked quarterly.",
  },
  {
    ticker: "Hook 02",
    title: "No job posting. No bidding wars.",
    body: "We don't auction your job to a queue of tradies. You browse verified locals, pick the one you trust, and contact them direct. They quote a fixed call-out fee — you say yes or you don't.",
  },
  {
    ticker: "Hook 03",
    title: "Built by a mech plumber.",
    body: "Started at the bottom, now I see both sides — on the tools and on the quotes. Same problem every time: people don't know who to trust. So I built one place where they can.",
  },
  {
    ticker: "Hook 04",
    title: "Receipts, not promises.",
    body: "Every booking is logged. Quote, ETA, address, fee, chat — all on the record. If something goes sideways, both sides have the receipts.",
  },
];

function Hooks() {
  return (
    <section className="hooks-section">
      <div className="container">
        <div className="hooks-head">
          <div className="eyebrow accent">— What's different</div>
          <h2 className="h-1">
            Four things <span className="it">we won't trade away.</span>
          </h2>
        </div>
        <div className="hooks-grid">
          {DIFFERENTIATOR_HOOKS.map((h) => (
            <div className="hook" key={h.ticker}>
              <div className="hook-ticker">— {h.ticker}</div>
              <h3 className="hook-title">{h.title}</h3>
              <p className="hook-body">{h.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
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
            <h3 className="h-3">Tell us what's wrong.</h3>
            <p>
              Leaking tap. Tripping fuse. Planning a reno. Plain English. Our AI works out which
              trade you actually need.
            </p>
            <div className="step-visual">
              <img src="/assets/app-home.png" alt="Trust Trade homeowner home screen" />
            </div>
          </div>
          <div className="step">
            <div className="step-num">02</div>
            <h3 className="h-3">Routed to vetted locals.</h3>
            <p>
              Insured, licenced, reviewed. Nearest first. No marketplace mosh-pit. Just a shortlist
              of mates who can do the job.
            </p>
            <div className="step-visual">
              <img src="/assets/app-browse.png" alt="Browse tradies screen" />
            </div>
          </div>
          <div className="step">
            <div className="step-num">03</div>
            <h3 className="h-3">Approve. Book it in.</h3>
            <p>
              Fixed call-out fee, in writing, up front. Tap Approve and you've got a booking
              confirmation. Name, time, address, all logged.
            </p>
            <div className="step-visual">
              <img src="/assets/app-quote.png" alt="Call-out fee approved in chat" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function LightBreaker() {
  return (
    <section className="light-breaker">
      <div className="container">
        <div className="light-breaker-inner">
          <div className="eyebrow accent">— From the founder</div>
          <blockquote className="light-breaker-quote">
            "I'm a mechanical plumber. Started at the bottom — apprentice, on the tools. Now I
            see both sides: still doing the work, and running the quoting side. Same problem
            every time:{" "}<span className="it">people don't know who to trust.</span> That's
            what I built Trust Trade to fix."
          </blockquote>
          <div className="light-breaker-attr">
            <div className="avatar">J</div>
            <div className="who">
              <strong>Jake</strong>
              <span>Mech plumber · Founder</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Features() {
  return (
    <section className="block" id="features">
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
            <h3>Every tradie checked before they're listed.</h3>
            <p>
              Licence numbers verified with the regulator. Public liability and workers' comp on
              file. Reviews from real, confirmed jobs — not rideshare-style spam.
            </p>
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
              <br />
              <br />
              <span style={{ color: "var(--accent)", fontWeight: 600 }}>
                Sounds like a plumber — gas hot water specialist.
              </span>
              <span className="typing">
                <span></span>
                <span></span>
                <span></span>
              </span>
            </div>
          </div>

          <div className="feat feat-3 feat-price">
            <div className="feat-eyebrow">Fixed quotes</div>
            <h3>Call-out fees in writing. Approved up front.</h3>
            <p>
              The tradie sets a fixed call-out fee per job. You approve it before they roll. No
              surprise upcharges on the day.
            </p>
            <div className="price-card">
              <div>
                <div className="label">Call-out fee</div>
                <div className="amount">
                  $200 <span className="ex">ex GST</span>
                </div>
                <div className="approved">✓ APPROVED · 3 hr ETA</div>
              </div>
            </div>
          </div>

          <div className="feat feat-4 feat-msg">
            <div className="feat-eyebrow">In-app chat</div>
            <h3>One thread per job.</h3>
            <p>
              Every booking has its own conversation. ETA pings, photos, receipts. All in one place
              instead of six different SMS threads.
            </p>
            <div className="msg-thread">
              <div className="bubble in">On my way — 20 min ETA</div>
              <div className="bubble out">Sweet, gate's unlocked</div>
              <div className="bubble in">Done. Receipt emailed.</div>
            </div>
          </div>

          <div className="feat feat-5 feat-near">
            <div className="feat-eyebrow">Nearest first</div>
            <h3>See who's around the corner.</h3>
            <p>
              Filter by trade, distance and availability. Verified locals appear first so you're not
              chasing someone 25km away.
            </p>
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
            <p>
              Name, address, time, price. All logged in your inbox. If something goes sideways,
              the record's there for both sides.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

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
                <img src="/assets/app-inbox.png" alt="Tradie inbox: every job in one place" />
              </div>
            </div>
            <div className="floater bottom-left">
              <div className="label">Approved</div>
              <strong>$200 ex GST</strong>
              <div style={{ color: "var(--text-dim)", marginTop: 4, fontSize: 12 }}>
                On site within 3 hrs
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
            <h2 className="h-1" style={{ fontSize: "clamp(44px, 6.5vw, 92px)" }}>
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
          {LANDING_FAQS.map((item, i) => (
            <div key={i} className={"faq-item " + (open === i ? "open" : "")}>
              <button className="faq-q" onClick={() => setOpen(open === i ? -1 : i)}>
                <span>{item.q}</span>
                <span className="plus">+</span>
              </button>
              <div className="faq-a">{item.a}</div>
            </div>
          ))}
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

export default function LandingPage() {
  return (
    <>
      <LandingHeader onJoin={scrollToWaitlist} />
      <Hero onJoin={scrollToWaitlist} />
      <TrustStrip />
      <Hooks />
      <HowItWorks />
      <LightBreaker />
      <Features />
      <ForTradiesSection onJoin={scrollToWaitlist} />
      <WaitlistMoment />
      <FAQSection />
      <PageFooter />
    </>
  );
}
