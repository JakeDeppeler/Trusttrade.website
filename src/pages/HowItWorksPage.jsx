import {
  PageFooter,
  PageHeader,
  PageHero,
  PageWaitlistFooterCTA,
} from "../components/PageChrome.jsx";
import PageLink from "../components/PageLink.jsx";
import { usePageReveal, DevRow, Marquee, FaqAccordion } from "../components/RedesignSections.jsx";
import "../styles/hiw-redesign.css";

const HIW_MARQUEE = [
  ["3 min", "to a price in writing"],
  ["0", "Trust Trade surcharge"],
  ["100%", "licence-verified tradies"],
  ["Free", "for homeowners"],
  ["1 tap", "to approve & book"],
  ["Every job", "leaves a receipt"],
];

const HIW_FAQ = [
  {
    name: "General",
    items: [
      { q: "When does Trust Trade launch?", a: "We're rolling out invites fortnightly from Q4 2026, starting with Victoria. iOS first, Android close behind. Web access opens for waitlist members before the public launch." },
      { q: "Is Trust Trade free for homeowners?", a: "Yes — finding, requesting and booking a tradie is free. You only ever pay the tradie's quoted call-out fee, and only once you've approved it in writing. There's no Trust Trade surcharge on top." },
      { q: "Where are you operating?", a: "Starting in Victoria — Melbourne metro, Geelong, and Gippsland (yes, including Pakenham). NSW, QLD and SA in the months after launch. If you're outside these, join the waitlist and we'll email you when your state opens." },
      { q: "Why 'Trust Trade'?", a: "Because the two biggest things missing from finding a tradie online were trust and a clear paper trail. We picked a name that put both up front. The ® is registered in Australia." },
      { q: "How is this different from existing platforms?", a: "Three big differences: tradies are verified before they're listed (not just signed up); we don't sell leads (no race-to-the-bottom bidding); and every job leaves a real receipt. We charge tradies nothing to be listed at launch." },
    ],
  },
  {
    name: "Homeowners",
    items: [
      { q: "How do you verify tradies?", a: "Four checks at apply: licence number verified with the state regulator, public liability + workers' comp on file, ABN active and not on hold, no active disciplinary action. Plus photo-ID-to-licence match and two reference jobs we phone. Full breakdown up the top of this page." },
      { q: "What if it goes wrong on the day?", a: "Tap the help button in the job. A human reads the thread and gets back to both sides within an hour (business hours). For real disputes — wrong work, no-show, billing problems — we mediate within 48 hours between verified accounts." },
      { q: "Do I pay through the app?", a: "No, you pay your tradie direct. Trust Trade isn't an escrow. But the booking record — call-out fee, ETA, address, ABN — is logged in the app and emailed to both sides as a receipt." },
      { q: "Does the AI replace talking to a real tradie?", a: "Nope. The AI's job is to work out which trade you actually need from a plain-English description — then point you at verified humans. The fix-it bit is still done by a real, insured person on site." },
      { q: "Can I cancel a booking?", a: "Yes — reschedule or cancel free up to 1 hour before the agreed ETA. Inside that window, a small cancellation fee may apply to cover the tradie's travel and time. The fee is set by the tradie and disclosed before you book." },
      { q: "What if I get quoted more on the day?", a: "Call-out fee is locked. Any work beyond the call-out — replacement parts, additional jobs uncovered on site — must be quoted again in the app before it starts. You approve it; only then can they proceed." },
      { q: "I left a review I regret. Can I edit it?", a: "You can edit within 24 hours of posting. After that, it's locked, but tradies can post a public reply underneath. We don't delete reviews on request — the integrity of the system depends on them sticking." },
    ],
  },
  {
    name: "Trust & safety",
    items: [
      { q: "What if a tradie's licence lapses while they're listed?", a: "Our system tracks expiry on every licence and insurance cert. Seven days before expiry we ping them. The day it lapses, they can't take new jobs until they've uploaded a renewed cert. No 'maybe verified' — it's binary." },
      { q: "Are reviews moderated?", a: "Lightly — we strip out personal contact info, slurs, and obvious fakes. We don't pay-to-bury and we don't delete on request. Tradies get a public right of reply. Disputed reviews go to 48-hour mediation." },
      { q: "What data do you collect about me?", a: "What you need an account for: name, mobile, suburb, the brief on your job. We don't sell it, we don't share it with insurers or banks, we don't on-sell to a third-party CRM. Full breakdown in the Privacy policy." },
      { q: "Is my address shared before I book?", a: "No. Tradies see the suburb and the brief — never your street address — until you've approved their call-out fee. After that, they see the address (because they're showing up). Address is never visible to anyone you didn't approve." },
    ],
  },
];

const VERIFY_CHECKS = [
  { h: "Trade licence verified with the regulator", p: "Checked directly with the authority — VBA for builders, ESV for sparkies, VBPRB for plumbers — and the class is surfaced to you.", s: "Regulator check" },
  { h: "Insurance certificate on file", p: "Minimum $10m public liability, workers' comp if they employ. Expiry tracked — they can't take a job past it.", s: "Expiry auto-tracked" },
  { h: "ABN active, not on hold", p: "We check the Australian Business Register. Cancelled, suspended or mismatched name — no listing.", s: "ABR-checked" },
  { h: "No active disciplinary action", p: "Consumer Affairs Victoria, the regulator, court records. Active order? No listing. Re-checked quarterly.", s: "CAV + court records" },
  { h: "Photo ID matched to the licence-holder", p: "Selfie + drivers licence matched to the trade licence. Stops anyone listing under a mate's licence.", s: "Liveness check" },
  { h: "Two reference jobs, phone-confirmed", p: "Two past customers who vouch in writing. We call them. Can't reach both, the application stalls until we can.", s: "Phone-confirmed" },
];

export default function HowItWorksPage() {
  usePageReveal();

  return (
    <>
      <PageHeader current="How it works.html" />

      <PageHero
        eyebrow="How it works"
        title="Tap. Match."
        italicWord="Done."
        lede="Three taps from 'something's wrong' to a tradie in the diary with a price in writing. Here's exactly what happens in between, on both sides of the app."
        meta={[
          { k: "Time to quote", v: "~3 minutes" },
          { k: "Steps for you", v: "Three" },
          { k: "Cost to use", v: "Free for homeowners" },
          { k: "Coverage", v: "VIC at launch" },
        ]}
      />

      <Marquee items={HIW_MARQUEE} />

      {/* ===== The homeowner flow — image-forward device rows ===== */}
      <section className="page-section" style={{ paddingBottom: 40 }}>
        <div className="container">
          <div className="mid-head reveal">
            <div className="eyebrow accent">— The homeowner flow</div>
            <h2 className="h-1">
              From mess to <span className="it">mended.</span>
            </h2>
            <p className="lede">
              No quote-form rodeo. No five tradies SMS-blasting you at 7am. You describe what's gone
              wrong; we hand you off to a vetted local who can actually do it.
            </p>
          </div>

          <DevRow
            idx="01"
            kicker="Tell us what's wrong"
            title="Plain English."
            italic="We work out the trade."
            body="Type it, say it, or snap a photo. Our AI reads 'hot water's gone cold and hissing' and works out you need a gas hot-water specialist — then confirms with you before routing anywhere."
            img="/assets/app-askai.png"
            facts={[
              "Type, dictate or upload a photo of the problem",
              "Add urgency — emergency, this week, or scoping a reno",
              "We confirm the trade before we route. Wrong? You say so",
            ]}
            chips={[
              { lbl: "You", big: "“Hot water's gone cold”", sub: "Plain English" },
              { lbl: "Trust Trade AI", big: "Gas plumber", sub: "Confirm before routing" },
            ]}
          />

          <DevRow
            flip
            idx="02"
            kicker="Matched to vetted locals"
            title="A shortlist,"
            italic="not a mosh-pit."
            body="Insured, licenced, reviewed — nearest first, but sort by rating, ETA or price. No marketplace free-for-all. Just a handful of locals who can actually do the job today."
            img="/assets/app-browse.png"
            facts={[
              "Every tradie licence-verified with the state regulator",
              "Reviews come from confirmed bookings — not internet drive-bys",
              "Filter by trade, distance, ETA, or who's available now",
            ]}
            chips={[
              { lbl: "Nearest", big: "3.2 km away", sub: "★ 5.0 · Verified" },
              { lbl: "Available", big: "Today, 2–4pm", sub: "On your street" },
            ]}
          />

          <DevRow
            idx="03"
            kicker="Approve the price"
            title="One tap."
            italic="Booked."
            body="The tradie sends a fixed call-out fee — in writing, up front. Tap Approve and you've got a confirmed booking with a name, an ETA and a paper trail. Reschedule free up to an hour before."
            img="/assets/app-booking.png"
            facts={[
              "Call-out fee locked before they roll out",
              "Any work beyond the call-out is re-quoted before it starts",
              "Booking confirmation lands in your inbox — name, ABN, time, fee",
            ]}
            chips={[
              { lbl: "Call-out fee", big: "$120 ex GST", sub: "Approved in writing" },
              { lbl: "Booked", big: "Tomorrow 8–10am", sub: "Reschedule free" },
            ]}
          />
        </div>
      </section>

      {/* ===== How we verify — tight checklist ===== */}
      <section className="page-section bordered" id="verify">
        <div className="container">
          <div className="mid-head reveal">
            <div className="eyebrow accent">— How we verify</div>
            <h2 className="h-1">
              Vetted four ways <span className="it">before they're listed.</span>
            </h2>
            <p className="lede">
              Every tradie you're matched with is checked before the first job ever lands in front
              of you. Fail any one and it's a hard no — not a "proceed with caution".
            </p>
          </div>

          <div className="checklist reveal" style={{ "--rd": "60ms" }}>
            {VERIFY_CHECKS.map((c, i) => (
              <div className="check-row" key={i} style={i >= 4 ? { borderBottom: 0 } : undefined}>
                <div className="tick">✓</div>
                <div className="ctext">
                  <h4>{c.h}</h4>
                  <p>{c.p}</p>
                </div>
                <div className="cstamp">{c.s}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== The receipt behind a badge ===== */}
      <section className="page-section bordered">
        <div className="container">
          <div className="mid-head reveal">
            <div className="eyebrow accent">— What you see on a profile</div>
            <h2 className="h-1">
              Every claim <span className="it">links to a check.</span>
            </h2>
            <p className="lede">
              If we say "licenced", you can tap it and see which regulator, what class, when we last
              checked. No hand-waving "verified" badges.
            </p>
          </div>

          <div className="verify-row reveal">
            <div className="verify-doc">
              <h5>Advanced Gas &amp; Aircon</h5>
              <div className="doc-row"><div className="k">Business</div><div className="v">Advanced Gas &amp; Aircon Pty Ltd</div></div>
              <div className="doc-row"><div className="k">ABN</div><div className="v">12 345 678 901 <span className="v muted">· Active</span></div></div>
              <div className="doc-row"><div className="k">Trade licence</div><div className="v">PIC-119283 (Plumbing — Gas)</div></div>
              <div className="doc-row"><div className="k">Issuer</div><div className="v">VBA · checked 12 May 2026</div></div>
              <div className="doc-row"><div className="k">Public liability</div><div className="v">$20m · WFI Insurance</div></div>
              <div className="doc-row"><div className="k">PL expiry</div><div className="v">17 Sep 2026</div></div>
              <div className="doc-row"><div className="k">Workers' comp</div><div className="v">Active · 3 employees</div></div>
              <div className="doc-row"><div className="k">Identity check</div><div className="v">Matched · Apr 2026</div></div>
              <div className="doc-row"><div className="k">Disciplinary</div><div className="v">No active orders</div></div>
              <div className="doc-row"><div className="k">Last re-check</div><div className="v">Q2 2026 · Next: Q3 2026</div></div>
            </div>
            <div>
              <h3 className="h-2" style={{ marginBottom: 18 }}>The receipt.</h3>
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

      {/* ===== The tradie side — one device row ===== */}
      <section className="page-section bordered" style={{ paddingBottom: 40 }}>
        <div className="container">
          <div className="mid-head reveal">
            <div className="eyebrow accent">— The tradie side</div>
            <h2 className="h-1">
              A clear job ticket. <span className="it">Not a bidding war.</span>
            </h2>
            <p className="lede">
              On the other end, your job lands as one clean brief — the trade, the suburb, the
              urgency, the photos — with a 60-second window to claim it or pass.
            </p>
          </div>

          <DevRow
            flip
            idx="→"
            kicker="In their inbox"
            title="One brief."
            italic="60 seconds to claim."
            body="Routed by postcode and trade — never blasted to a hundred addresses. They see your brief, quote one call-out fee, and once you approve, the job's in their diary with an ETA ticking to your phone."
            img="/assets/app-jobs.png"
            facts={[
              "Job title, trade, suburb, urgency, photos — one clean ticket",
              "They quote one call-out fee. No tendering, no haggling",
              "You approve → it's in their diary, ETA pings to your phone",
            ]}
            chips={[
              { lbl: "New enquiry", big: "Hot water leak", sub: "Pakenham · Emergency" },
              { lbl: "Claimed", big: "In the diary", sub: "ETA sent to you" },
            ]}
          />
        </div>
      </section>

      {/* ===== After the job ===== */}
      <section className="page-section bordered">
        <div className="container">
          <div className="mid-head reveal">
            <div className="eyebrow accent">— After the job</div>
            <h2 className="h-1">
              Receipts, reviews, <span className="it">repeat.</span>
            </h2>
          </div>

          <div className="checklist reveal" style={{ "--rd": "60ms" }}>
            <div className="check-row">
              <div className="tick">✓</div>
              <div className="ctext">
                <h4>Every job leaves a paper trail.</h4>
                <p>Name, ABN, address, time, price, payment method — emailed to both parties the moment it's marked complete.</p>
              </div>
              <div className="cstamp">7-yr archive</div>
            </div>
            <div className="check-row">
              <div className="tick">✓</div>
              <div className="ctext">
                <h4>Only verified bookings can review.</h4>
                <p>No bot armies, no competitor sniping. You can only rate a tradie you actually booked — and you've got 14 days.</p>
              </div>
              <div className="cstamp">Booking required</div>
            </div>
            <div className="check-row" style={{ borderBottom: 0 }}>
              <div className="tick">✓</div>
              <div className="ctext">
                <h4>If it goes sideways, we step in.</h4>
                <p>Both sides have the record. We mediate verified-account disputes within 48 hours — no he-said-she-said, just the receipts.</p>
              </div>
              <div className="cstamp">48-hr mediation</div>
            </div>
            <div className="check-row" style={{ borderBottom: 0 }}>
              <div className="tick">✓</div>
              <div className="ctext">
                <h4>Your tradie, saved for next time.</h4>
                <p>Found a good one? They're one tap away for the next job. No re-searching, no re-vetting — the trust carries over.</p>
              </div>
              <div className="cstamp">One-tap rebook</div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FAQ (homeowner questions) ===== */}
      <section className="page-section bordered" id="faq">
        <div className="container">
          <div className="mid-head reveal">
            <div className="eyebrow accent">— Questions</div>
            <h2 className="h-1">
              Everything else, <span className="it">answered.</span>
            </h2>
            <p className="lede">
              The questions homeowners ask us most — launch, cost, verification, what happens when a
              job goes sideways. On the tools instead? The tradie questions live on the{" "}
              <PageLink href="FAQ.html#tradies">FAQ</PageLink> page. Still stuck? Email{" "}
              <a href="mailto:jake@trusttrade.au">jake@trusttrade.au</a>.
            </p>
          </div>
          <div className="reveal">
            <FaqAccordion groups={HIW_FAQ} idPrefix="hiw-faq" />
          </div>
        </div>
      </section>

      <section className="page-section bordered">
        <div className="container">
          <div className="page-nav-prevnext">
            <PageLink href="Trust Trade Landing.html">
              <span>← Back to overview</span>
              <strong>Trust Trade home</strong>
            </PageLink>
            <PageLink href="How we verify.html" className="next">
              <span>Next →</span>
              <strong>How we verify tradies</strong>
            </PageLink>
          </div>
        </div>
      </section>

      <PageWaitlistFooterCTA />
      <PageFooter />
    </>
  );
}
