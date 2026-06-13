import {
  PageFooter,
  PageHeader,
  PageWaitlistFooterCTA,
} from "../components/PageChrome.jsx";
import PageLink from "../components/PageLink.jsx";

const COMPARE_ROWS = [
  {
    label: "The request flow",
    them: "Fill out a 12-field form, get five SMSes by lunch",
    us: "Describe it in plain English. AI works out the trade. You browse from there.",
  },
  {
    label: "Who you hear from",
    them: "Whoever pays the platform first. Could be 25km away.",
    us: "Whoever you pick. Browse verified locals, contact them direct.",
  },
  {
    label: "The quote",
    them: "\"We'll have a look on the day\" — then a $480 surprise",
    us: "Quotes go through the app in writing — nothing left to memory.",
  },
  {
    label: "Verification",
    them: "They filled in their licence number. Maybe it's real.",
    us: "We check with the state regulator. Re-checked quarterly.",
  },
  {
    label: "Reviews",
    them: "Anonymous, possibly bots, possibly the tradie's mate Dave",
    us: "Only people who actually booked through us can review.",
  },
  {
    label: "The paper trail",
    them: "SMS thread you can't search. Email lost in promotions.",
    us: "One thread, one receipt, your inbox. Logged for 7 years.",
  },
  {
    label: "If it goes sideways",
    them: "You're on your own. The platform \"facilitates introductions\".",
    us: "48-hour mediation on disputes. Both sides have the record.",
  },
];

const PROMISES = [
  { num: "01", title: "Every tradie is checked.", body: "Licence, insurance, ABN, conduct — four hard checks before they're listed. None of them are honour-system." },
  { num: "02", title: "Quotes live in the app.", body: "Anything a tradie quotes you sits in writing in the app, so you've always got a record. No hand-shake guessing, no \"I think they said $200.\"" },
  { num: "03", title: "Your address is private.", body: "Tradies see the suburb and the brief — never your street — until you've approved their fee. Then they see what they need to." },
  { num: "04", title: "One thread per job.", body: "No \"which Sarah was the laundry tap one\". Every job has its own conversation with ETA pings and a real receipt at the end." },
  { num: "05", title: "We mediate disputes.", body: "If something goes wrong, tap the help button. Human on it within an hour, decision within 48 if it can't be resolved on the day." },
  { num: "06", title: "Free, no surcharge, ever.", body: "Using Trust Trade is free for homeowners. We never add a fee to the tradie's quote. What they charge is what you pay." },
];

const TUESDAY_STEPS = [
  {
    time: "Step 01",
    title: "You notice something's wrong.",
    body: "Hot water's cold. Fuse keeps tripping. Whatever it is, you open the app and describe it in your own words. Photo if you've got one.",
    details: [
      "Type, dictate, or upload a photo",
      "AI confirms which trade you actually need",
      "Mark urgency: emergency, this week, planning a reno",
    ],
    img: "/assets/app-home.png",
  },
  {
    time: "Step 02",
    title: "You pick the tradie.",
    body: "Browse verified locals in your area. See their profile — licence, insurance, reviews — tap to contact who you want. They reply with their call-out fee, and you say yes or look at the next one.",
    details: [
      "You're in control. No job posting, no bidding war",
      "Profile shows verification receipts, not just a star count",
      "Contact who you want, when you want",
    ],
    img: "/assets/app-browse.png",
  },
  {
    time: "Step 03",
    title: "The job's on the record.",
    body: "Whenever the tradie shows up, the in-app chat thread for that job stays open — gate code, dogs to watch for, anything you need to tell them. When they mark complete, both sides get a receipt.",
    details: [
      "One chat thread for this job — no scrolling for the right SMS",
      "Tradie marks the job complete in the app",
      "Receipt + 14-day review window auto-triggered on completion",
    ],
    img: "/assets/app-quote.png",
  },
];

const SITUATIONS = [
  { ticker: "— Urgent", title: "Something's broken and it can't wait.", body: "Burst pipe, no hot water, blown fuse before a dinner party. Filter by who's available right now and contact a verified local direct.", stamp: "Filter by availability" },
  { ticker: "— This week", title: "Annoying but liveable.", body: "Squeaky door, leaking gutter, that hairline crack you keep meaning to call about. Find someone, book a time that suits, get it done.", stamp: "On your time" },
  { ticker: "— Planning", title: "You're scoping a bigger job.", body: "Bathroom reno, deck, new kitchen. Browse verified builders and specialists who do that kind of work, see their reviews, contact who you like.", stamp: "Browse by trade" },
  { ticker: "— First time", title: "You've never hired a tradie before.", body: "You moved out of mum and dad's six months ago and the dishwasher's making a noise. The app walks you through it — what trade you need, what to ask, what good looks like.", stamp: "In-app guidance" },
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

export default function ForHomeownersPage() {
  return (
    <>
      <PageHeader current="For Homeowners.html" />

      {/* Hero */}
      <section className="page-hero">
        <div className="container">
          <div className="tradie-hero-grid">
            <div>
              <div className="eyebrow accent">— For homeowners</div>
              <h1 className="h-display page-hero-title">
                Find a tradie.
                <br />
                <span className="it">Without the drama.</span>
              </h1>
              <p className="lede" style={{ marginTop: 28, maxWidth: "48ch" }}>
                Built by a mech plumber who knows the trade from both sides — on the tools and
                quoting the work. No five-tradies-SMSing-you-at-7am. No "we'll call when we can"
                merry-go-round. Real humans, verified, with a price in writing before they roll.
              </p>
              <div style={{ marginTop: 32, display: "flex", gap: 12, flexWrap: "wrap" }}>
                <PageLink
                  href="Trust Trade Landing.html#waitlist"
                  className="btn btn-primary btn-lg"
                >
                  Get early access →
                </PageLink>
                <PageLink href="How it works.html" className="btn btn-ghost btn-lg">
                  See how it works
                </PageLink>
              </div>
              <div style={MONO_PILL_STYLE}>
                <span style={{ whiteSpace: "nowrap" }}>
                  <span style={{ color: "var(--accent)" }}>✓</span> Free to use
                </span>
                <span style={{ whiteSpace: "nowrap" }}>
                  <span style={{ color: "var(--accent)" }}>✓</span> Verified tradies only
                </span>
                <span style={{ whiteSpace: "nowrap" }}>
                  <span style={{ color: "var(--accent)" }}>✓</span> No surcharge
                </span>
              </div>
            </div>
            <div className="phone-stage">
              <div className="phone-tag tag-1">
                <span className="swatch"></span>Verified, insured
              </div>
              <div className="phone-tag tag-2">
                <span className="swatch"></span>Verified locals
              </div>
              <div className="phone-tag tag-3">
                <span className="swatch"></span>Quote in writing
              </div>
              <div className="phone">
                <div className="phone-screen">
                  <img
                    src="/assets/app-home.png"
                    alt="Trust Trade app home"
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
            <div className="eyebrow accent">— Why it's different</div>
            <h2 className="h-1">
              Not another <span className="it">tradie-finder.</span>
            </h2>
            <p className="lede">You've been here before. So have we. So we changed the rules.</p>
          </div>

          <table className="compare-table">
            <thead>
              <tr>
                <th></th>
                <th>The usual tradie-finder sites</th>
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

      {/* Six promises (cream) */}
      <section className="page-section cream">
        <div className="container">
          <div className="mid-head">
            <div className="eyebrow accent">— What we promise</div>
            <h2 className="h-1">
              Six things <span className="it">we promise you,</span> in writing.
            </h2>
            <p className="lede">If we ever break one of these, quote us back to ourselves.</p>
          </div>

          <div className="tradie-perks">
            {PROMISES.map((p) => (
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
              Get early access →
            </PageLink>
          </div>
        </div>
      </section>

      {/* Normal Tuesday */}
      <section className="page-section bordered">
        <div className="container">
          <div className="mid-head">
            <div className="eyebrow accent">— What it looks like</div>
            <h2 className="h-1">
              What using it <span className="it">actually looks like.</span>
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

      {/* Common situations */}
      <section className="page-section bordered">
        <div className="container">
          <div className="mid-head">
            <div className="eyebrow accent">— Common situations</div>
            <h2 className="h-1">
              It's not just <span className="it">"broken stuff".</span>
            </h2>
            <p className="lede">
              Trust Trade is built for the full range of jobs around a house — from "I need this
              fixed today" to "I'm planning a kitchen reno in spring".
            </p>
          </div>

          <div className="proof-grid">
            {SITUATIONS.map((card) => (
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

      {/* Pull quote */}
      <section className="quote-block page-section bordered">
        <div className="container">
          <div className="two-col">
            <div className="col-label">— Why we built it this way</div>
            <div>
              <blockquote>
                "I built the app I'd want my mum to use.
                <span className="accent"> And I'm the tradie on the other end of it.</span>"
              </blockquote>
              <div className="quote-attr">
                <div className="avatar">J</div>
                <div className="who">
                  <strong>Jake</strong>
                  Mech plumber · Founder, Trust Trade®
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="page-section bordered">
        <div className="container">
          <div className="page-nav-prevnext">
            <PageLink href="For Tradies.html">
              <span>← Previous</span>
              <strong>For Tradies</strong>
            </PageLink>
            <PageLink href="FAQ.html" className="next">
              <span>Next →</span>
              <strong>Full FAQ</strong>
            </PageLink>
          </div>
        </div>
      </section>

      <PageWaitlistFooterCTA headline="No more drama." subhead="Get on the list." />
      <PageFooter />
    </>
  );
}
