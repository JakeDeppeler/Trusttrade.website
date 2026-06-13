import {
  PageFooter,
  PageHeader,
  PageWaitlistFooterCTA,
} from "../components/PageChrome.jsx";
import PageLink from "../components/PageLink.jsx";

const COMPARE_ROWS = [
  {
    label: "Pricing model",
    them: "Pay per lead. $20-$80 every time a homeowner clicks your name — even when they never call back",
    us: "One flat listing fee. No per-lead charges, no commission on jobs. Founding 50 lock in lifetime founding pricing",
  },
  {
    label: "How customers find you",
    them: "Your job posted to 4-5 tradies. Whoever replies first wins",
    us: "No job posting. Customers browse verified tradies and contact you direct",
  },
  {
    label: "Quoting",
    them: "Bidding war. Lowest quote wins. You earn less every year",
    us: "You set the call-out, per job, every job. They say yes or they don't",
  },
  {
    label: "Customer quality",
    them: "Anyone with a free email can request. Half the leads ghost you",
    us: "Verified accounts only. People who want quality, not the cheapest bid",
  },
  {
    label: "Job admin",
    them: "SMS, email, Facebook DM, Gumtree messages. Six places, one Sarah",
    us: "One inbox. One thread per job. Receipt, booking, location, all in one place",
  },
  {
    label: "Reviews",
    them: "Anonymous drive-bys. Competitor sniping. No path to remove rubbish",
    us: "Only verified bookings can review. Disputes mediated within 48 hours",
  },
];

const PERKS = [
  { num: "01", title: "You set the price.", body: "Every job. No bidding, no auction, no algorithm undercutting you. Your call-out fee, in writing, every time." },
  { num: "02", title: "You set your radius.", body: "5km, 25km, the whole metro. We won't send you a job you can't physically be at by lunchtime." },
  { num: "03", title: "You set your hours.", body: "On-call, business hours, weekends-only, after-hours premium — switch in the app. We route around it." },
  { num: "04", title: "You see the brief before you commit.", body: "Trade, urgency, photos, postcode, customer name. Take the job or pass — you've got 60 seconds." },
  { num: "05", title: "You keep 100% of every job.", body: "Trust Trade doesn't sit between you and the customer's money. Invoice them direct. We're not a middleman." },
  { num: "06", title: "You can leave anytime.", body: "No lock-in, no cancellation fee, no subscription clawback. Pause, leave, come back — your call." },
];

const ELIGIBILITY = [
  { ticker: "— 01", title: "A current trade licence.", body: "We check it with the relevant state regulator — VBA, ESV, VBPRB, the lot. Apprentices welcome, but listed under a qualified licence-holder.", stamp: "State regulator check" },
  { ticker: "— 02", title: "Public liability + workers' comp.", body: "Minimum $10m PL. Workers' comp if you employ. Certificate of currency on file before you take a job.", stamp: "Insurance verified" },
  { ticker: "— 03", title: "An ABN. Active. Not on hold.", body: "Sole traders, partnerships, Pty Ltds — all welcome. We check the ABR; if it's suspended, no listing.", stamp: "ABR-checked" },
  { ticker: "— 04", title: "A working in Victoria address.", body: "At launch, we're Victoria-only. NSW, QLD and SA from mid-2027. Pop your ABN in and we'll let you know when your state's live.", stamp: "VIC at launch" },
  { ticker: "— 05", title: "A clean disciplinary record.", body: "No active suspensions, no current consumer-affairs orders. We check at apply and re-check quarterly.", stamp: "Quarterly re-check" },
  { ticker: "— 06", title: "A phone with a camera.", body: "That's it. No special hardware, no tablet, no install — works on any iPhone or Android from the last 5 years.", stamp: "iOS 16+ / Android 10+" },
];

const FOUNDING_LOCKS = [
  { ticker: "— Lock 01", title: "Lifetime founding-member pricing.", body: "Whatever premium routing costs in 2028 or 2032, you pay 2026 founding rates. Forever, on the same ABN." },
  { ticker: "— Lock 02", title: "Founding-badge on your profile.", body: "Customers see the founding mark. We surface founding members first in your trade + radius until 2027." },
  { ticker: "— Lock 03", title: "Direct line to the team.", body: "You get a real human on a real phone — Jake's mobile, in fact — for the first 12 months. No ticket queue." },
];

const TUESDAY_STEPS = [
  {
    time: "Step 01",
    title: "A customer contacts you direct.",
    body: "Verified homeowner taps your profile and reaches out. \"Hot water's gone cold, hissing from the cylinder. Pakenham.\" You read it on your phone, decide if you want the work.",
    details: [
      "They picked you. No bidding war, no shared lead",
      "Customer name and verified mobile attached",
      "Photos if they sent them",
    ],
    img: "/assets/app-inbox.png",
  },
  {
    time: "Step 02",
    title: "You send your call-out fee.",
    body: "Whatever you decide — $200, $350, whatever your standard rate is. One number, in writing through the app. They approve, and the job's on the record.",
    details: [
      "No back-and-forth quoting. One number, one approval",
      "Booking confirmation logged with your ABN, their address, the fee",
      "If they don't approve, no harm — your time's your own",
    ],
    img: "/assets/app-quote.png",
  },
  {
    time: "Step 03",
    title: "The job's on the record.",
    body: "Once it's confirmed, the chat thread for that job stays open in the app. No scrolling Facebook DMs to work out which Sarah. Mark the job complete when you're done — receipt goes to both sides.",
    details: [
      "In-app chat for THIS job. No phone tag.",
      "Mark complete → receipt logged on both accounts",
      "Customer gets a 14-day window to leave a verified review",
    ],
    img: "/assets/app-messages-list.png",
  },
];

const MONO_PILL_STYLE = {
  marginTop: 32,
  display: "flex",
  gap: 24,
  flexWrap: "wrap",
  color: "var(--text-dim)",
  fontSize: 13,
  fontFamily: "var(--font-mono)",
  letterSpacing: "0.08em",
  textTransform: "uppercase",
};

export default function ForTradiesPage() {
  return (
    <>
      <PageHeader current="For Tradies.html" />

      {/* Hero */}
      <section className="page-hero">
        <div className="container">
          <div className="tradie-hero-grid">
            <div>
              <div className="eyebrow accent">— For tradies</div>
              <h1 className="h-display page-hero-title">
                More jobs.
                <br />
                <span className="it">Less mucking around.</span>
              </h1>
              <p className="lede" style={{ marginTop: 28, maxWidth: "48ch" }}>
                Built by a mech plumber who started on the tools and now runs the quoting side
                too. I know what good work looks like and I know what the lead-gen rort costs
                you. Real homeowners, real jobs, routed by trade and postcode. On your terms.
              </p>
              <div style={{ marginTop: 32, display: "flex", gap: 12, flexWrap: "wrap" }}>
                <PageLink
                  href="Trust Trade Landing.html#waitlist"
                  className="btn btn-primary btn-lg"
                >
                  Apply to join →
                </PageLink>
                <PageLink href="FAQ.html#tradies" className="btn btn-ghost btn-lg">
                  Read the tradie FAQ
                </PageLink>
              </div>
              <div style={MONO_PILL_STYLE}>
                <span style={{ whiteSpace: "nowrap" }}>
                  <span style={{ color: "var(--accent)" }}>✓</span> Free to apply
                </span>
                <span style={{ whiteSpace: "nowrap" }}>
                  <span style={{ color: "var(--accent)" }}>✓</span> Founding-50 perks
                </span>
                <span style={{ whiteSpace: "nowrap" }}>
                  <span style={{ color: "var(--accent)" }}>✓</span> No lock-in
                </span>
              </div>
            </div>
            <div className="phone-stage">
              <div className="phone-tag tag-1">
                <span className="swatch"></span>New enquiry
              </div>
              <div className="phone-tag tag-2">
                <span className="swatch"></span>$200 approved
              </div>
              <div className="phone-tag tag-3">
                <span className="swatch"></span>One thread per job
              </div>
              <div className="phone">
                <div className="phone-screen">
                  <img
                    src="/assets/app-inbox.png"
                    alt="Tradie inbox: every job in one place"
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
      </section>

      {/* Comparison */}
      <section className="page-section">
        <div className="container">
          <div className="mid-head">
            <div className="eyebrow accent">— Why we're different</div>
            <h2 className="h-1">
              Not another <span className="it">lead&#8209;gen platform.</span>
            </h2>
            <p className="lede">
              You've been burned by them. We have too. So we built the opposite.
            </p>
          </div>

          <table className="compare-table">
            <thead>
              <tr>
                <th></th>
                <th>The usual lead-gen platforms</th>
                <th className="us">Trust Trade</th>
              </tr>
            </thead>
            <tbody>
              {COMPARE_ROWS.map((row) => (
                <tr key={row.label}>
                  <td>{row.label}</td>
                  <td className="them">
                    <span className="cross">✕</span> {row.them}
                  </td>
                  <td className="us">
                    <span className="check">✓</span> {row.us}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Six perks (cream) */}
      <section className="page-section cream">
        <div className="container">
          <div className="mid-head">
            <div className="eyebrow accent">— What you get</div>
            <h2 className="h-1">
              Six things <span className="it">we promise you,</span> in writing.
            </h2>
            <p className="lede">If we ever break one of these, you can quote us back to ourselves.</p>
          </div>

          <div className="tradie-perks">
            {PERKS.map((p) => (
              <div className="tradie-perk" key={p.num}>
                <div className="num">{p.num}</div>
                <h4>{p.title}</h4>
                <p>{p.body}</p>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 48 }}>
            <PageLink
              href="Trust Trade Landing.html#waitlist"
              className="btn btn-dark btn-lg"
            >
              Apply to join as a tradie →
            </PageLink>
          </div>
        </div>
      </section>

      {/* Founder quote */}
      <section className="quote-block page-section bordered">
        <div className="container">
          <div className="two-col">
            <div className="col-label">— A note from us</div>
            <div>
              <blockquote>
                "I'm a mech plumber. I've spent years on the tools and I run the quoting side
                too. Every job, the same thing comes up: people don't know who to trust.
                <span className="accent"> Trust Trade is what I'd want at both ends.</span>"
              </blockquote>
              <div className="quote-attr">
                <div className="avatar">J</div>
                <div className="who">
                  <strong>Jake</strong>
                  Founder, Trust Trade® · Melbourne
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* A normal Tuesday */}
      <section className="page-section bordered">
        <div className="container">
          <div className="mid-head">
            <div className="eyebrow accent">— What it looks like</div>
            <h2 className="h-1">
              What the app does <span className="it">for you.</span>
            </h2>
          </div>

          {TUESDAY_STEPS.map((s, i) => (
            <div
              className="flow-step"
              key={s.time}
              style={i === 0 ? { borderTop: "1px solid var(--line)" } : undefined}
            >
              <div className="flow-num flow-time">{s.time}</div>
              <div className="flow-body">
                <h3>{s.title}</h3>
                <p>{s.body}</p>
                <div className="flow-details">
                  {s.details.map((d, di) => (
                    <div className="flow-detail-row" key={di}>
                      {d}
                    </div>
                  ))}
                </div>
              </div>
              <div className="flow-visual">
                <div className="phone">
                  <div className="phone-screen">
                    <img src={s.img} alt="" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Profile + Insights */}
      <section className="page-section bordered">
        <div className="container">
          <div className="mid-head">
            <div className="eyebrow accent">— Inside the app</div>
            <h2 className="h-1">
              Your storefront. <span className="it">Your numbers.</span>
            </h2>
            <p className="lede">
              The bit homeowners see, and the bit only you see — both built so you can win
              more of the right kind of work.
            </p>
          </div>

          <div className="flow-step" style={{ borderTop: "1px solid var(--line)" }}>
            <div className="flow-num flow-time">Profile</div>
            <div className="flow-body">
              <h3>The profile homeowners actually trust.</h3>
              <p>
                Cover photo, your van, your team, the work you've done — all on one page.
                Verified badges from the regulator, real reviews from real bookings, and your
                trade and radius up top. No five-star anonymous mystery; receipts.
              </p>
              <div className="flow-details">
                <div className="flow-detail-row">Cover photo, trade, suburb, distance — sorted</div>
                <div className="flow-detail-row">Story · Gallery · Reviews · Services tabs</div>
                <div className="flow-detail-row">Verified badge stays on while your licence is current</div>
                <div className="flow-detail-row">One-tap message or call from the bottom of the page</div>
              </div>
            </div>
            <div className="flow-visual">
              <div className="phone">
                <div className="phone-screen">
                  <img
                    src="/assets/app-profile.png"
                    alt="A tradie's public profile in the Trust Trade app"
                    loading="lazy"
                    decoding="async"
                    width={1284}
                    height={2778}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flow-step">
            <div className="flow-num flow-time">Insights</div>
            <div className="flow-body">
              <h3>The numbers behind your listing.</h3>
              <p>
                See how your profile's tracking week-on-week. Profile views, enquiries, taps to
                call, first-reply time, lifetime reviews. We tell you what's helping you win
                work and what's costing you it — not as a vanity dashboard, as a checklist.
              </p>
              <div className="flow-details">
                <div className="flow-detail-row">Profile views and enquiries, last 7 days vs all time</div>
                <div className="flow-detail-row">Listing health score — what to fix to climb the Browse ranking</div>
                <div className="flow-detail-row">What customers tap on most: cover, bio, gallery, services</div>
                <div className="flow-detail-row">Average first-reply time — slower than your trade average? We tell you.</div>
              </div>
            </div>
            <div className="flow-visual">
              <div className="phone">
                <div className="phone-screen">
                  <img
                    src="/assets/app-insights.png"
                    alt="Tradie insights dashboard in the Trust Trade app"
                    loading="lazy"
                    decoding="async"
                    width={1284}
                    height={2778}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Eligibility */}
      <section className="page-section bordered">
        <div className="container">
          <div className="mid-head">
            <div className="eyebrow accent">— What we need from you</div>
            <h2 className="h-1">
              To be listed, <span className="it">you'll need…</span>
            </h2>
          </div>

          <div className="proof-grid">
            {ELIGIBILITY.map((card) => (
              <div className="proof-card" key={card.ticker}>
                <div className="ticker">{card.ticker}</div>
                <h4>{card.title}</h4>
                <p>{card.body}</p>
                <div className="stamp">{card.stamp}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Founding 50 */}
      <section className="page-section bordered">
        <div className="container">
          <div className="mid-head">
            <div className="eyebrow accent">— Founding 50</div>
            <h2 className="h-1">
              First 50 tradies get <span className="it">lifetime founding pricing.</span>
            </h2>
            <p className="lede">
              No paid tier exists yet. When it does — and that's the plan, for premium routing and
              analytics — the first 50 tradies in are locked in at founding rates. Forever. The
              moment we're full, the badge is gone.
            </p>
          </div>

          <div className="proof-grid">
            {FOUNDING_LOCKS.map((card) => (
              <div className="proof-card" key={card.ticker}>
                <div className="ticker">{card.ticker}</div>
                <h4>{card.title}</h4>
                <p>{card.body}</p>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 48, textAlign: "center" }}>
            <PageLink
              href="Trust Trade Landing.html#waitlist"
              className="btn btn-primary btn-lg"
            >
              Apply for Founding 50 →
            </PageLink>
            <div
              style={{
                marginTop: 14,
                fontFamily: "var(--font-mono)",
                fontSize: 12,
                color: "var(--text-faint)",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
              }}
            >
              First 50 in. Then the badge is gone.
            </div>
          </div>
        </div>
      </section>

      <section className="page-section bordered">
        <div className="container">
          <div className="page-nav-prevnext">
            <PageLink href="How we verify.html">
              <span>← Previous</span>
              <strong>How we verify tradies</strong>
            </PageLink>
            <PageLink href="For Homeowners.html" className="next">
              <span>Next →</span>
              <strong>For Homeowners</strong>
            </PageLink>
          </div>
        </div>
      </section>

      <PageWaitlistFooterCTA
        headline="Skip the rort."
        subhead="Get on the list."
        secondaryLabel="I'm a homeowner"
        secondaryHref="For Homeowners.html"
      />
      <PageFooter />
    </>
  );
}
