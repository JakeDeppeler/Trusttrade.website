import {
  PageFooter,
  PageHeader,
  PageHero,
  PageWaitlistFooterCTA,
} from "../components/PageChrome.jsx";
import PageLink from "../components/PageLink.jsx";

const CHECKS = [
  {
    ticker: "— Check 01",
    title: "Trade licence verified with the state regulator.",
    body: "We check the licence number directly with the relevant authority — VBA for builders, ESV for sparkies, VBPRB for plumbers — and surface the licence class to you.",
    stamp: "Direct regulator API where possible, manual lookup otherwise",
  },
  {
    ticker: "— Check 02",
    title: "Insurance certificate on file.",
    body: "Minimum $10m public liability. Workers' comp if they employ. Certificate of currency uploaded, expiry tracked — they can't take a job past the expiry date.",
    stamp: "Cert expiry auto-tracked",
  },
  {
    ticker: "— Check 03",
    title: "ABN active, not on hold.",
    body: "We check the Australian Business Register. If the ABN is cancelled, suspended, or doesn't match the named business, we don't list them.",
    stamp: "ABR-checked",
  },
  {
    ticker: "— Check 04",
    title: "No active disciplinary action.",
    body: "Consumer Affairs Victoria, the regulator, court records for trade-related judgements. Active suspension or order? No listing. Re-checked quarterly.",
    stamp: "CAV + regulator + court records",
  },
  {
    ticker: "— Plus",
    title: "Photo ID matched to the licence-holder.",
    body: "Selfie + drivers licence matched to the trade licence. Stops someone listing under a mate's licence.",
    stamp: "Liveness check",
  },
  {
    ticker: "— Plus",
    title: "Two reference jobs.",
    body: "Two past customers who'll vouch in writing. We call them. If we can't reach both, the application stalls until we can.",
    stamp: "Phone-confirmed references",
  },
];

const REVIEW_RULES = [
  {
    title: "Only confirmed bookings leave reviews.",
    body: "You can't review a tradie you didn't book through us. No anonymous internet drive-bys, no SEO farms, no Glassdoor-style sniping.",
  },
  {
    title: "14-day review window.",
    body: "Review within two weeks of the job marked complete. After that, it's locked. No retroactive 1-star tantrums six months later.",
  },
  {
    title: "The tradie sees and can respond.",
    body: "Every review is public to both sides. The tradie gets one reply, posted underneath. No deleting, no hiding, no pay-to-bury.",
  },
  {
    title: "Disputed reviews go to mediation.",
    body: "If a tradie thinks a review's fake or in bad faith, they flag it. Both parties get heard. We decide within 48 hours, and the reasoning is on the public record.",
  },
];

const DISPUTE_STEPS = [
  {
    ticker: "— On the record",
    title: "Booking, ETA, fee, chat — all logged.",
    body: "Every job has a logged timeline. You said yes at 9:14. They said on-site at 10:23. Receipt issued at 12:08. Both sides see the same record.",
  },
  {
    ticker: "— On the day",
    title: "Tap the help button. We're in within an hour.",
    body: "If the tradie no-shows, or the work's clearly wrong, you tap one button. A human reads the thread and gets back to both sides within 60 minutes (business hours).",
  },
  {
    ticker: "— Resolution",
    title: "48 hours, both sides, in writing.",
    body: "Most disputes are misunderstandings. The few that aren't, we resolve within 48 hours of you flagging it. The decision is logged on both accounts.",
  },
];

const DOC_ROWS = [
  { k: "Business", v: <>Advanced Gas &amp; Aircon Pty Ltd</> },
  {
    k: "ABN",
    v: (
      <>
        12 345 678 901 <span className="v muted">· Active</span>
      </>
    ),
  },
  { k: "Trade licence", v: "PIC-119283 (Plumbing — Gas)" },
  { k: "Issuer", v: "VBA · checked 12 May 2026" },
  { k: "Public liability", v: "$20m · WFI Insurance" },
  { k: "PL expiry", v: "17 Sep 2026" },
  { k: "Workers' comp", v: "Active · 3 employees" },
  { k: "Identity check", v: "Matched · Apr 2026" },
  { k: "Disciplinary", v: "No active orders" },
  { k: "Last re-check", v: "Q2 2026 · Next: Q3 2026" },
];

const CREAM_CALLOUT_STYLE = {
  background: "rgba(12,9,7,0.04)",
  borderColor: "var(--line-cream)",
};
const CREAM_CALLOUT_BODY_STYLE = { color: "rgba(12,9,7,0.6)" };

export default function VerifyPage() {
  return (
    <>
      <PageHeader current="How we verify.html" />

      <PageHero
        eyebrow="How we verify"
        title="Vetted before"
        italicWord="they're listed."
        lede="Every tradie on Trust Trade gets checked four ways before the first job ever lands in front of you. Licence, insurance, ABN, conduct. We do the boring bit so you don't have to."
        meta={[
          { k: "Checks at apply", v: "Four mandatory" },
          { k: "Re-check cycle", v: "Quarterly" },
          { k: "Rejection rate", v: "~22% (so far)" },
          { k: "Time to verify", v: "48-72 hrs" },
        ]}
      />

      {/* ===== The four checks ===== */}
      <section className="page-section">
        <div className="container">
          <div className="mid-head">
            <div className="eyebrow accent">— The four checks</div>
            <h2 className="h-1">
              Four ticks. <span className="it">Or no listing.</span>
            </h2>
            <p className="lede">
              If a tradie fails any one of these, they don't get on the platform. Not a "yellow flag,
              proceed with caution" — a hard no.
            </p>
          </div>

          <div className="proof-grid">
            {CHECKS.map((c, i) => (
              <div className="proof-card" key={i}>
                <div className="ticker">{c.ticker}</div>
                <h4>{c.title}</h4>
                <p>{c.body}</p>
                <div className="stamp">{c.stamp}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Sample verified profile (visual proof) ===== */}
      <section className="page-section bordered">
        <div className="container">
          <div className="mid-head">
            <div className="eyebrow accent">— What you see on a profile</div>
            <h2 className="h-1">
              Every claim on a profile <span className="it">links to a check.</span>
            </h2>
            <p className="lede">
              If we say "licenced", you can tap it and see which regulator, what class, when we last
              checked. No hand-waving "verified" badges.
            </p>
          </div>

          <div className="verify-row">
            <div className="verify-doc">
              <h5>Advanced Gas &amp; Aircon</h5>
              {DOC_ROWS.map((row, i) => (
                <div className="doc-row" key={i}>
                  <div className="k">{row.k}</div>
                  <div className="v">{row.v}</div>
                </div>
              ))}
            </div>
            <div>
              <h3 className="h-2" style={{ marginBottom: 18 }}>
                The receipt.
              </h3>
              <p className="lede" style={{ marginBottom: 24 }}>
                This is the actual breakdown behind a "Verified" badge in the app. Every tradie has
                one. You can tap any line on their profile to see it.
              </p>
              <ul
                style={{
                  listStyle: "none",
                  padding: 0,
                  margin: 0,
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                  fontSize: 15,
                  color: "var(--text-dim)",
                }}
              >
                <li>→ The licence number is real and current.</li>
                <li>→ The insurance certificate is on file and not expired.</li>
                <li>→ The ABN matches the listed business name.</li>
                <li>→ A human at our office has clapped eyes on every document.</li>
                <li>→ The badge expires if any check lapses — no zombie verifieds.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ===== How reviews work ===== */}
      <section className="page-section cream">
        <div className="container">
          <div className="mid-head">
            <div className="eyebrow accent">— Reviews</div>
            <h2 className="h-1">
              Reviews from <span className="it">verified bookings only.</span>
            </h2>
            <p className="lede">
              The biggest hole in tradie-finder platforms is fake reviews. We close it by only
              letting verified bookings leave one.
            </p>
          </div>

          <div className="two-col">
            <div className="col-label">The rules</div>
            <div style={{ display: "grid", gap: 14 }}>
              {REVIEW_RULES.map((rule, i) => (
                <div className="callout" style={CREAM_CALLOUT_STYLE} key={i}>
                  <div className="glyph">{i + 1}</div>
                  <div>
                    <h5>{rule.title}</h5>
                    <p style={CREAM_CALLOUT_BODY_STYLE}>{rule.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== Dispute handling ===== */}
      <section className="page-section bordered">
        <div className="container">
          <div className="mid-head">
            <div className="eyebrow accent">— When it goes sideways</div>
            <h2 className="h-1">
              Every job leaves <span className="it">a paper trail.</span>
            </h2>
            <p className="lede">
              Because we mediate disputes between verified accounts, both sides have an incentive to
              behave. The receipts are right there.
            </p>
          </div>

          <div className="proof-grid">
            {DISPUTE_STEPS.map((step, i) => (
              <div className="proof-card" key={i}>
                <div className="ticker">{step.ticker}</div>
                <h4>{step.title}</h4>
                <p>{step.body}</p>
              </div>
            ))}
          </div>

          <div className="callout" style={{ marginTop: 48 }}>
            <div className="glyph">!</div>
            <div>
              <h5>One thing we don't do:</h5>
              <p>
                We don't hold or pay-out the tradie's money. Trust Trade isn't an escrow. You pay
                your tradie direct — but every dollar paid is logged in the receipt, and the booking
                record is admissible in any small-claims action either side might take. We're the
                paper trail, not the bank.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="page-section bordered">
        <div className="container">
          <div className="page-nav-prevnext">
            <PageLink href="How it works.html">
              <span>← Previous</span>
              <strong>How it works</strong>
            </PageLink>
            <PageLink href="For Tradies.html" className="next">
              <span>Next →</span>
              <strong>For Tradies</strong>
            </PageLink>
          </div>
        </div>
      </section>

      <PageWaitlistFooterCTA />
      <PageFooter />
    </>
  );
}
