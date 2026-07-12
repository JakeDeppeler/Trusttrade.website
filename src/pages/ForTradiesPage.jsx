import {
  PageDownloadCTA,
  PageFooter,
  PageHeader,
} from "../components/PageChrome.jsx";
import PageLink from "../components/PageLink.jsx";
import { usePageReveal, DevRow, Marquee, FaqAccordion } from "../components/RedesignSections.jsx";
import "../styles/hiw-redesign.css";

const FTR_MARQUEE = [
  ["0", "lead fees, ever"],
  ["You", "set the call-out"],
  ["No", "lock-in"],
  ["Verified", "customers only"],
  ["One", "inbox, one thread"],
  ["100%", "of every job is yours"],
];

const TRADIE_FAQ_GROUPS = [
  {
    name: "Joining & pricing",
    items: [
      { q: "What does it cost to join as a tradie?", a: "Free to apply, free to be listed at launch. Founding members (the first 100 verified tradies) lock in lifetime founding-member pricing on any future paid tiers. Standard fees come in after public launch in 2027." },
      { q: "Do you take a cut of my job?", a: "No. Trust Trade doesn't sit between you and your customer's money. You invoice them direct, you get paid direct. We're the paper trail and the routing layer — not a middleman." },
      { q: "How do I get verified?", a: "Apply via the waitlist, upload your licence, insurance certificate of currency, ABN, and ID. We check with the relevant state regulator and confirm the documents. Two reference jobs (two past customers willing to vouch in writing). Usually 48-72 hours end to end." },
      { q: "Can I set my own call-out fee?", a: "Yes — per job, every job. Your default rate is saved, but you can override it on any specific job before sending. No platform-set minimums, no algorithmic discount." },
      { q: "What if I want to take a few weeks off?", a: "Switch yourself to Unavailable in the app. No jobs route to you. Switch back on whenever. No lock-in, no penalty, no clawback." },
      { q: "Can I be on multiple lead-gen platforms at once?", a: "Yeah, that's your call. We don't ask for exclusivity. Most tradies in our beta run us alongside one other platform during launch and drop the other once we've ramped." },
      { q: "What trades do you cover?", a: "Thirty-five trades across six categories at launch — wet trades, electrical, building/carpentry, surfaces, outside work, and specialists. Full list on the Trades we cover page. If your trade isn't there, email Jake — we add by request." },
    ],
  },
  {
    name: "About the business",
    items: [
      { q: "Who's behind Trust Trade?", a: "Jake — a tradie's son, ex-software — running Trust Trade solo for now. ABN 40 873 784 535, registered in Victoria, no outside investment yet (and I like it that way for now)." },
      { q: "Are you regulated by anyone?", a: "Trust Trade itself is a platform, not a trade. The tradies we list are regulated by their state authority (VBA, ESV, etc.) and we verify against those regulators. Consumer Affairs Victoria oversees us as an Australian Consumer Law-bound business like any other marketplace." },
      { q: "Can I invest / partner / sell into Trust Trade?", a: "We're not raising at the moment. For partnerships — insurance, regulator integrations, trade associations — email jake@trusttrade.au with a one-pager." },
      { q: "Is the name actually trademarked?", a: "Yep — Trust Trade® is a registered Australian trademark in classes 9, 35 and 42 (software, marketplace services, app development). Use of the mark for anything else needs our written nod." },
    ],
  },
];

const ELIGIBILITY = [
  { h: "A current trade licence", p: "Checked with the state regulator — VBA, ESV, VBPRB. Apprentices under a qualified holder.", s: "Regulator check" },
  { h: "Public liability + workers' comp", p: "Minimum $10m PL, workers' comp if you employ. Certificate of currency on file.", s: "Insurance verified" },
  { h: "An active ABN", p: "Sole trader, partnership or Pty Ltd. We check the ABR — suspended means no listing.", s: "ABR-checked" },
  { h: "A Victoria work address", p: "VIC-only at launch. NSW, QLD, SA from mid-2027 — pop your ABN in for the wait.", s: "VIC at launch" },
  { h: "A clean disciplinary record", p: "No active suspensions or consumer-affairs orders. Checked at apply, re-checked quarterly.", s: "Quarterly re-check" },
  { h: "A phone with a camera", p: "That's the hardware list. Any iPhone or Android from the last five years works.", s: "iOS 16+ / Android 10+" },
];

const FOUNDING_LOCKS = [
  { h: "Lifetime founding pricing.", p: "Whatever premium routing costs in 2028 or 2032, you pay 2026 rates. Forever, on the same ABN.", s: "Lock 01" },
  { h: "Founding badge on your profile.", p: "Customers see the mark. We surface founding members first in your trade + radius until 2027.", s: "Lock 02" },
  { h: "Direct line to the team.", p: "A real human on a real phone — Jake's mobile — for your first 12 months. No ticket queue.", s: "Lock 03" },
  { h: "Free to apply, free to list.", p: "No card, no commitment. Get verified, get listed, take jobs — all at zero cost at launch.", s: "Lock 04" },
];

export default function ForTradiesPage() {
  usePageReveal();

  return (
    <>
      <PageHeader current="For Tradies.html" />

      {/* ===== Hero ===== */}
      <section className="page-hero page-hero-centered">
        <div className="page-hero-decor" aria-hidden="true" />
        <div className="container">
          <div className="page-hero-centered-inner">
            <div className="page-hero-eyebrow">
              <span className="dot" aria-hidden="true" />
              For tradies
            </div>
            <h1 className="page-hero-title-xl">
              More jobs. <span className="it">Less mucking around.</span>
            </h1>
            <p className="page-hero-subhead">
              Real homeowners. Real jobs. Routed to you by trade and postcode — on your terms. Skip
              the lead-gen rort and the race-to-the-bottom bidding.
            </p>
            <div className="page-hero-cta-row">
              <PageLink href="Trust Trade Landing.html#download" className="btn btn-primary btn-lg">
                Apply to join →
              </PageLink>
              <a href="#tradie-faq" className="btn btn-ghost btn-lg">
                Read the tradie FAQ
              </a>
            </div>
            <div className="ftr-hero-ticks">
              <span><span className="tk">✓</span> Free to apply</span>
              <span><span className="tk">✓</span> Founding-100 perks</span>
              <span><span className="tk">✓</span> No lock-in</span>
            </div>
          </div>
        </div>
      </section>

      <Marquee items={FTR_MARQUEE} />

      {/* ===== The problem — big editorial pull ===== */}
      <section className="page-section">
        <div className="container">
          <div className="reveal">
            <div className="eyebrow accent" style={{ marginBottom: 22 }}>The rort</div>
            <h2 className="pull-statement">
              You're paying to <span className="it">bid</span> on jobs<br />
              <span className="dim">you'll probably never win.</span>
            </h2>
            <p className="pull-sub">
              Cold leads at $20–80 a pop. The same job sold to four other tradies. A race to the
              cheapest quote that shrinks your margin every year. You didn't get your licence to
              feed a bidding machine.
            </p>
          </div>

          <div className="stat-band reveal" style={{ marginTop: 56, "--rd": "80ms" }}>
            <div className="stat-cell">
              <div className="n">$20<span className="sm">–80</span></div>
              <div className="k">Per cold lead on the usual platforms — paid whether you win it or not.</div>
            </div>
            <div className="stat-cell">
              <div className="n">4<span className="sm">–5</span></div>
              <div className="k">Tradies sold the exact same lead. First to the phone, cheapest to the quote.</div>
            </div>
            <div className="stat-cell">
              <div className="n"><span className="it">½</span></div>
              <div className="k">Of those leads ghost you — free-email tyre-kickers with no intent.</div>
            </div>
            <div className="stat-cell">
              <div className="n">6</div>
              <div className="k">Places the job lives — SMS, email, Facebook, Gumtree. One of them's a Sarah.</div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== The fix — vs split ===== */}
      <section className="page-section bordered">
        <div className="container">
          <div className="mid-head reveal">
            <div className="eyebrow accent">The fix</div>
            <h2 className="h-1">We built the <span className="it">opposite.</span></h2>
            <p className="lede">Same trade, same postcode — a completely different deal. Here's the side-by-side.</p>
          </div>

          <div className="vs reveal" style={{ "--rd": "60ms" }}>
            <div className="vs-col them">
              <div className="vs-tag">The usual lead-gen</div>
              <h3>The old way</h3>
              <div className="vs-list">
                {[
                  "Pay per lead — $20–80 a click for tyre-kickers",
                  "Your lead resold to 4–5 other tradies",
                  "Bidding war. Lowest quote wins, margins bleed",
                  "Anyone with a free email can request",
                  "Six inboxes, one Sarah, no paper trail",
                  "Anonymous review drive-bys, no right of reply",
                ].map((t, i) => (
                  <div className="vs-line" key={i}><span className="vs-mark">✕</span><span>{t}</span></div>
                ))}
              </div>
            </div>
            <div className="vs-badge">vs</div>
            <div className="vs-col us">
              <div className="vs-tag">Trust Trade</div>
              <h3>Your way</h3>
              <div className="vs-list">
                {[
                  "No lead fees. Free to be listed. Founding-100 locked in for life",
                  "One tradie at a time. They pick you — or it moves on",
                  "You set the call-out, per job. They approve before you roll",
                  "Verified, mobile-confirmed accounts with a brief on file",
                  "One inbox. One thread per job. Receipts baked in",
                  "Only verified bookings can review. Disputes mediated in 48h",
                ].map((t, i) => (
                  <div className="vs-line" key={i}><span className="vs-mark">✓</span><span>{t}</span></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== How it helps — image-forward alternating rows ===== */}
      <section className="page-section bordered" style={{ paddingBottom: 40 }}>
        <div className="container">
          <div className="mid-head reveal">
            <div className="eyebrow accent">On the tools</div>
            <h2 className="h-1">What the app actually <span className="it">does for you.</span></h2>
            <p className="lede">No dashboard homework. Open it between jobs — it's already sorted your day.</p>
          </div>

          <DevRow
            idx="01"
            kicker="Every job, one inbox"
            title="The whole day"
            italic="in one screen."
            body="New enquiries, quoted work, booked jobs and finished receipts — all in one list. Emergencies pin themselves to the top. No scrolling six apps to find which Sarah had the laundry tap."
            img="/assets/app-jobs.png"
            facts={[
              "Routed by trade + postcode — never blasted to a mailing list",
              "Emergencies auto-pin to the top of your day",
              "Customer name and ABN-verified mobile attached to every brief",
            ]}
            chips={[
              { lbl: "New enquiry", big: "Hot water leak", sub: "Pakenham · Emergency" },
              { lbl: "Today", big: "3 new jobs", sub: "1 emergency pinned" },
            ]}
          />

          <DevRow
            flip
            idx="02"
            kicker="You set the price"
            title="One number."
            italic="They approve."
            body="Send your call-out fee — your standard rate or a job-specific one. The customer approves it on their phone before you roll. No tendering, no haggling, no undercutting. If they ghost the quote, it auto-releases."
            img="/assets/app-booking.png"
            facts={[
              "Your default rate is saved — override it per job in a tap",
              "Ghosted quotes auto-release in 30 min. No wasted morning",
              "Booking logged with your ABN, their address and the fee",
            ]}
            chips={[
              { lbl: "Call-out fee", big: "$200 ex GST", sub: "Your standard rate" },
              { lbl: "Approved", big: "On site 8–10am", sub: "Confirmed in writing" },
            ]}
          />

          <DevRow
            idx="03"
            kicker="One thread per job"
            title="No more"
            italic="phone tag."
            body="Every job gets its own conversation — the brief, the photos, the location, the chat. ETA pings send as you drive. Mark it complete and a receipt emails both sides instantly. The paper trail writes itself."
            img="/assets/app-messages.png"
            facts={[
              "In-app chat scoped to THIS job — no Facebook DM archaeology",
              "ETA pings to the customer as you drive",
              "Mark complete → receipt + review request, both sides, instantly",
            ]}
            chips={[
              { lbl: "On my way", big: "20 min ETA", sub: "Customer notified" },
              { lbl: "Complete", big: "Receipt sent", sub: "Both sides · 7-yr archive" },
            ]}
          />

          <DevRow
            flip
            idx="04"
            kicker="Your rules, in the app"
            title="On your"
            italic="terms."
            body="Set your radius, your hours, your availability. On-call, business-hours, weekends-only, after-hours premium — flick it in the app and we route around it. Taking a few weeks off? Switch to Unavailable. No lock-in, no penalty."
            img="/assets/app-account.png"
            facts={[
              "Radius: 5km, 25km, whole metro — we won't send what you can't reach",
              "Hours + availability toggle per day, per week",
              "Pause or leave anytime. No cancellation fee, no clawback",
            ]}
            chips={[
              { lbl: "Radius", big: "25 km", sub: "Pakenham + Gippsland" },
              { lbl: "Status", big: "Available", sub: "Business hours" },
            ]}
          />
        </div>
      </section>

      {/* ===== Job Calculator add-on ===== */}
      <section className="page-section bordered">
        <div className="container">
          <div className="mid-head reveal">
            <div className="eyebrow accent">A free add-on</div>
            <h2 className="h-1">Know what an hour <span className="it">actually costs you.</span></h2>
            <p className="lede">
              Every listed tradie gets the Trust Trade Job Calculator — free. Put your real numbers
              in and it tells you your break-even rate, prices every job off that number, and builds
              a customer-ready price list you can publish straight to your listing. Built to help you
              make a living, not just win work.
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginTop: 26 }}>
              <a href="/job-calculator.html" className="btn btn-primary btn-lg">
                Open the calculator →
              </a>
              <a href="/job-calculator.html" className="btn btn-ghost btn-lg">
                Try it with sample numbers
              </a>
            </div>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-faint)", letterSpacing: "0.1em", textTransform: "uppercase", marginTop: 18 }}>
              Free for a month · Free forever once you're listed
            </p>
          </div>
        </div>
      </section>

      {/* ===== Founder note ===== */}
      <section className="quote-block page-section bordered" style={{ paddingTop: "clamp(60px,8vw,110px)" }}>
        <div className="container">
          <div className="two-col reveal">
            <div className="col-label">A note from us</div>
            <div>
              <blockquote>
                "I'm a tradie's son. The lead-gen rort cost my old man four years of work he should
                have been billing.
                <span className="accent"> Trust Trade is the platform he should've had.</span>"
              </blockquote>
              <div className="quote-attr">
                <div className="avatar">J</div>
                <div className="who">
                  <strong>Jake</strong>
                  Founder, Trust Trade®
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== Founding 100 — progress meter ===== */}
      <section className="page-section bordered">
        <div className="container">
          <div className="mid-head reveal">
            <div className="eyebrow accent">Founding 100</div>
            <h2 className="h-1">First 100 in are <span className="it">locked in for life.</span></h2>
            <p className="lede">No paid tier exists yet. When it does — premium routing and analytics — the first 100 verified tradies pay founding rates. Forever. The moment we're full, the badge is gone.</p>
          </div>

          <div className="meter reveal" style={{ "--pct": "50%" }}>
            <div className="meter-top">
              <div className="meter-big"><span className="it">50</span> <span className="of">of 100 spots left</span></div>
              <div className="meter-note">Victoria · closing at launch</div>
            </div>
            <div className="meter-bar"><div className="meter-fill"></div></div>

            <div className="checklist" style={{ marginTop: 40, borderTop: "1px solid var(--line)" }}>
              {FOUNDING_LOCKS.map((c, i) => (
                <div className="check-row" key={i} style={i >= 2 ? { borderBottom: 0 } : undefined}>
                  <div className="tick">✓</div>
                  <div className="ctext"><h4>{c.h}</h4><p>{c.p}</p></div>
                  <div className="cstamp">{c.s}</div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 36, display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
              <PageLink href="Trust Trade Landing.html#download" className="btn btn-primary btn-lg">
                Claim a founding spot →
              </PageLink>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-faint)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                Applications reviewed in 48–72h
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ===== Eligibility — tight checklist ===== */}
      <section className="page-section bordered">
        <div className="container">
          <div className="mid-head reveal">
            <div className="eyebrow accent">What we need from you</div>
            <h2 className="h-1">To get listed, <span className="it">you'll need…</span></h2>
            <p className="lede">Six things. We check every one against the source — the regulator, the ABR, the insurer — before you take a single job.</p>
          </div>

          <div className="checklist reveal" style={{ "--rd": "60ms" }}>
            {ELIGIBILITY.map((c, i) => (
              <div className="check-row" key={i} style={i >= 4 ? { borderBottom: 0 } : undefined}>
                <div className="tick">✓</div>
                <div className="ctext"><h4>{c.h}</h4><p>{c.p}</p></div>
                <div className="cstamp">{c.s}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Tradie FAQ ===== */}
      <section className="page-section bordered" id="tradie-faq">
        <div className="container">
          <div className="mid-head reveal">
            <div className="eyebrow accent">Tradie FAQ</div>
            <h2 className="h-1">The questions <span className="it">every tradie asks.</span></h2>
            <p className="lede">Cost, cuts, verification, lock-in — plus the honest word on who's behind Trust Trade. Something we haven't covered? Email jake@trusttrade.au.</p>
          </div>
          <div className="reveal"><FaqAccordion groups={TRADIE_FAQ_GROUPS} idPrefix="tradie-faq" /></div>
        </div>
      </section>

      <PageDownloadCTA />
      <PageFooter />
    </>
  );
}
