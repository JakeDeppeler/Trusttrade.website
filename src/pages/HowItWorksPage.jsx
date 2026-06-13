import {
  PageFooter,
  PageHeader,
  PageHero,
  PageWaitlistFooterCTA,
} from "../components/PageChrome.jsx";
import PageLink from "../components/PageLink.jsx";

function FlowStep({ n, title, body, details, screenshot, pull }) {
  return (
    <div className="flow-step">
      <div className="flow-num">{n}</div>
      <div className="flow-body">
        <h3>{title}</h3>
        <p>{body}</p>
        <div className="flow-details">
          {details.map((d, i) => (
            <div key={i} className="flow-detail-row">
              {d}
            </div>
          ))}
        </div>
      </div>
      <div className="flow-visual">
        <div className="phone">
          <div className="phone-screen">
            <img
              src={screenshot}
              alt=""
              loading="lazy"
              decoding="async"
              width={1284}
              height={2778}
            />
          </div>
        </div>
        {pull && <div className="flow-pull">{pull}</div>}
      </div>
    </div>
  );
}

const CREAM_CALLOUT_STYLE = {
  background: "rgba(12,9,7,0.04)",
  borderColor: "var(--line-cream)",
};
const CREAM_BODY_STYLE = { color: "rgba(12,9,7,0.6)" };

export default function HowItWorksPage() {
  return (
    <>
      <PageHeader current="How it works.html" />

      <PageHero
        eyebrow="How it works"
        title="Tap. Match."
        italicWord="Done."
        lede="Three taps from 'something's wrong' to a tradie in the diary with a price in writing. Here's exactly what happens in between, on both sides of the app."
        meta={[
          { k: "Steps for you", v: "Three" },
          { k: "Cost to use", v: "Free for homeowners" },
          { k: "Quote format", v: "Fixed call-out, in writing" },
          { k: "Coverage", v: "VIC at launch" },
        ]}
      />

      <section className="page-section">
        <div className="container">
          <div className="mid-head">
            <div className="eyebrow accent">— The homeowner flow</div>
            <h2 className="h-1">
              From mess to <span className="it">mended.</span>
            </h2>
            <p className="lede">
              No quote-form rodeo. No five tradies SMS-blasting you at 7am. You describe what's gone
              wrong; we hand you off to a vetted local who can actually do it.
            </p>
          </div>

          <FlowStep
            n="01"
            title="Tell us what's gone wrong."
            body="Plain English, in your own words. Our AI works out which trade you actually need — gas plumber vs general, sparky vs solar, structural carpenter vs handyman — and confirms before routing."
            details={[
              "Type, dictate or upload a photo of the problem.",
              "Add urgency (emergency, this week, scoping a reno).",
              "Pin a location — we'll only show tradies in range.",
              "We confirm the trade before we shortlist. If it's wrong, you say so.",
            ]}
            screenshot="/assets/app-home.png"
            pull="Step 01 · Ask AI"
          />

          <FlowStep
            n="02"
            title="Browse verified locals. Pick the one you want."
            body="Insured, licenced, reviewed. Nearest first, but you can sort by rating or availability. No job posting, no bidding war — you scroll the shortlist and tap to contact whoever you trust."
            details={[
              "Every listed tradie is licence-verified with the relevant state regulator.",
              "Public liability and workers' comp on file.",
              "Reviews come from confirmed bookings on the platform — not anonymous internet drive-bys.",
              "Filter by trade, distance, or who's available now.",
            ]}
            screenshot="/assets/app-browse.png"
            pull="Step 02 · Pick"
          />

          <FlowStep
            n="03"
            title="Approve the price. Book it in."
            body="The tradie sends a fixed call-out fee — in writing, up front. Tap Approve and you've got a confirmed booking with a name, an ETA, and a record on file."
            details={[
              "Call-out fee is locked in before they roll out.",
              "Any work beyond the call-out is quoted again before it starts.",
              "Booking confirmation lands in your inbox: name, ABN, time, address, fee.",
              "Reschedule or cancel up to 1 hour before with no penalty.",
            ]}
            screenshot="/assets/app-quote.png"
            pull="Step 03 · Done"
          />
        </div>
      </section>

      <section className="page-section cream">
        <div className="container">
          <div className="mid-head">
            <div className="eyebrow accent">— The tradie side</div>
            <h2 className="h-1">What the tradie sees on their end.</h2>
            <p className="lede">
              A real customer who picked them — not a job blasted to a mailing list. They see who
              reached out, what the job is, and a 60-second window to respond.
            </p>
          </div>

          <div className="two-col">
            <div className="col-label">In their inbox</div>
            <div style={{ display: "grid", gap: 16 }}>
              <div className="callout" style={CREAM_CALLOUT_STYLE}>
                <div className="glyph">1</div>
                <div>
                  <h5>A customer reaches out direct.</h5>
                  <p style={CREAM_BODY_STYLE}>
                    A verified homeowner browsed the shortlist, tapped your profile, and contacted
                    you. Trade, suburb, urgency, photos — all there. No bidding war, no shared
                    leads.
                  </p>
                </div>
              </div>
              <div className="callout" style={CREAM_CALLOUT_STYLE}>
                <div className="glyph">2</div>
                <div>
                  <h5>They send a call-out fee.</h5>
                  <p style={CREAM_BODY_STYLE}>
                    One number, one line. No tendering, no haggling. Their standard rate, or a
                    job-specific fee — they choose.
                  </p>
                </div>
              </div>
              <div className="callout" style={CREAM_CALLOUT_STYLE}>
                <div className="glyph">3</div>
                <div>
                  <h5>They roll out.</h5>
                  <p style={CREAM_BODY_STYLE}>
                    Once you approve, the job lands in their diary. ETA pings to your phone. One
                    thread per job lives in the app.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="page-section bordered">
        <div className="container">
          <div className="mid-head">
            <div className="eyebrow accent">— After the job</div>
            <h2 className="h-1">Receipts, reviews, repeat.</h2>
          </div>

          <div className="proof-grid">
            <div className="proof-card">
              <div className="ticker">— Receipts</div>
              <h4>Every job leaves a paper trail.</h4>
              <p>
                Name, ABN, address, time, price, payment method. Emailed to both parties the moment
                the job's marked complete.
              </p>
              <div className="stamp">Auto-archived for 7 years</div>
            </div>
            <div className="proof-card">
              <div className="ticker">— Reviews</div>
              <h4>Only verified bookings can leave reviews.</h4>
              <p>
                No bot armies, no competitor sniping. You can only rate a tradie you actually booked
                through Trust Trade — and you've got 14 days to do it.
              </p>
              <div className="stamp">Confirmed booking required</div>
            </div>
            <div className="proof-card">
              <div className="ticker">— Disputes</div>
              <h4>If it goes sideways, we step in.</h4>
              <p>
                Both sides have the record. Our team mediates verified-account disputes within 48
                hours — no he-said-she-said, just the receipts.
              </p>
              <div className="stamp">48-hour mediation</div>
            </div>
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
