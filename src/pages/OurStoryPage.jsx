import {
  PageDownloadCTA,
  PageFooter,
  PageHeader,
  PageHero,
} from "../components/PageChrome.jsx";
import { usePageReveal } from "../components/RedesignSections.jsx";
import "../styles/hiw-redesign.css";

const BELIEFS = [
  { n: "01", h: "Verification is binary.", p: "Either we've checked it with the regulator, or we haven't. No \"trust score\", no traffic-light fudge." },
  { n: "02", h: "One tradie, one job.", p: "We will never sell the same lead twice. The day we do, we've become the thing we set out to replace." },
  { n: "03", h: "Prices live in writing.", p: "If it's not in the app, it's not the price. No verbal quotes, no day-of upcharges, no surprises." },
  { n: "04", h: "Tradies keep 100%.", p: "We don't take a cut of the work. Subscription if anything, when the time comes. Never a slice of the job." },
  { n: "05", h: "Receipts are sacred.", p: "Every booking, every quote, every change, every dispute — logged, immutable, available to both parties on request." },
  { n: "06", h: "Boring, Australian, profitable.", p: "We're building a small, sustainable, AU-owned business. Not a unicorn. Not a marketplace land-grab. A useful tool." },
];

const TIMELINE = [
  { when: "Apr 2024", h: "The hot water heater.", p: "My old man pays $480 for a \"lead\" that ghosted him. We do the back-of-the-envelope maths on his year of lead-fees. The number is rude. The idea for Trust Trade starts here." },
  { when: "Sep 2024", h: "First prototype.", p: "Three Pakenham tradies and a Google Form. We route fifteen test jobs by hand for a month. Twelve get done, on time, on quote. The other three teach us a lot." },
  { when: "Mar 2025", h: "Trademark + ABN.", p: "Trust Trade® is registered with IP Australia in three classes. Company structure goes in. We start writing the verification stack." },
  { when: "Oct 2025", h: "Closed beta — 40 tradies, 200 homes.", p: "Six suburbs in Melbourne's south-east. We get reviews, we get bugs, we get a lot of strong opinions. Most of them make the product better." },
  { when: "May 2026", h: "Public waitlist opens.", p: "Where we are now. 1,247 mates on the list. Founding 500 spots filling. iOS build in TestFlight with a small alpha cohort." },
  { when: "Q4 2026", h: "Launch.", p: "Web access opens for the waitlist. iOS shortly after, Android close behind. Victoria-wide from day one." },
  { when: "2027", h: "NSW, QLD, SA.", p: "We open the next three states in the months after launch — verification stack ported state by state, founding-member program continues." },
];

export default function OurStoryPage() {
  usePageReveal();

  return (
    <>
      <PageHeader current="Our Story.html" />

      <PageHero
        eyebrow="Our story"
        title="One-person shop."
        italicWord="For Aussie homes."
        lede="Trust Trade is one person trying to fix one specific problem: finding a tradie shouldn't be the worst part of owning a house. Here's why I'm building it, and how it got here."
        meta={[
          { k: "Founded", v: "2024" },
          { k: "Team", v: "Just me" },
          { k: "ABN", v: "40 873 784 535" },
          { k: "Status", v: "Pre-launch, Q4 2026" },
        ]}
      />

      {/* ===== Founder story ===== */}
      <section className="page-section">
        <div className="container">
          <div className="about-grid reveal">
            <div>
              <div className="eyebrow accent" style={{ marginBottom: 14 }}>— The why</div>
              <h2 className="h-1">
                A tradie's son <span className="it">with a software problem.</span>
              </h2>
            </div>
            <div>
              <p className="lead">
                My dad's been a sparky for thirty-eight years. He's brilliant at his job and
                absolutely cooked at finding new work online.
              </p>
              <p>
                Every lead-gen platform he tried did the same thing: sell his email to four other
                sparkies for the same job, then ghost him when the customer chose someone cheaper.
                He'd spend the morning ringing tyre-kickers; he'd lose the afternoon to admin; he'd
                lose the evening telling me about it.
              </p>
              <p>
                The platforms wanted scale. The customers wanted certainty. The tradies wanted to be
                paid for actual work and not glorified market research. <strong>None of it lined up.</strong>
              </p>
              <p>
                Trust Trade is the platform my old man should have had: verified, fixed-price,
                one-tradie-at-a-time, no lead fees. It's the one I'd want if my hot water packed up
                next week. It's the one I'm building.
              </p>
              <p style={{ marginTop: 32 }}>— Jake, founder</p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== What we believe ===== */}
      <section className="page-section cream">
        <div className="container">
          <div className="mid-head reveal">
            <div className="eyebrow accent">— What we believe</div>
            <h2 className="h-1">
              Five rules we won't <span className="it">trade away.</span>
            </h2>
            <p className="lede">
              Every product decision goes through these. When we're tempted to fudge one, we go back
              and read them out loud.
            </p>
          </div>

          <div className="tradie-perks reveal">
            {BELIEFS.map((b) => (
              <div className="tradie-perk" key={b.n}>
                <div className="num">{b.n}</div>
                <h4>{b.h}</h4>
                <p>{b.p}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== The team ===== */}
      <section className="page-section bordered">
        <div className="container">
          <div className="mid-head reveal">
            <div className="eyebrow accent">— The team</div>
            <h2 className="h-1">
              Just me. <span className="it">One inbox.</span>
            </h2>
            <p className="lede">
              No support-ticket queue, no call centre. It's one person reading every message — and
              that's exactly how I want it while we're getting this right.
            </p>
          </div>

          <div
            className="team-row reveal"
            style={{ gridTemplateColumns: "1fr", maxWidth: 460, marginLeft: "auto", marginRight: "auto" }}
          >
            <div className="team-card">
              <div className="ph"><span>Founder portrait placeholder</span></div>
              <h5>Jake</h5>
              <div className="role">Founder · Everything</div>
              <p>
                Tradie's son, ex-software. I build the app, run the verification checks, call your
                references, and answer the inbox. The mobile number behind the "direct line" perk for
                Founding 500 is mine.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== Timeline ===== */}
      <section className="page-section bordered">
        <div className="container">
          <div className="mid-head reveal">
            <div className="eyebrow accent">— How we got here</div>
            <h2 className="h-1">
              The road <span className="it">so far.</span>
            </h2>
          </div>

          <div className="timeline reveal">
            {TIMELINE.map((t) => (
              <div className="timeline-row" key={t.when}>
                <div className="when">{t.when}</div>
                <div>
                  <h4>{t.h}</h4>
                  <p>{t.p}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Press / contact ===== */}
      <section className="page-section bordered">
        <div className="container">
          <div className="mid-head reveal">
            <div className="eyebrow accent">— Press & contact</div>
            <h2 className="h-1">Want to talk?</h2>
          </div>

          <div className="proof-grid reveal">
            <div className="proof-card">
              <div className="ticker">— General</div>
              <h4>Email Jake.</h4>
              <p>Anything that doesn't fit the other boxes. Founder's inbox, no filter.</p>
              <a className="stamp" href="mailto:jake@trusttrade.au">jake@trusttrade.au</a>
            </div>
            <div className="proof-card">
              <div className="ticker">— Press</div>
              <h4>Media + story requests.</h4>
              <p>Founder availability for interviews about the lead-gen economy and what's broken with finding tradies online.</p>
              <a className="stamp" href="mailto:press@trusttrade.au">press@trusttrade.au</a>
            </div>
            <div className="proof-card">
              <div className="ticker">— Trade associations</div>
              <h4>Partnerships.</h4>
              <p>If you represent a master-builders chapter or trade association and want a member rate, we want to hear from you.</p>
              <a className="stamp" href="mailto:partners@trusttrade.au">partners@trusttrade.au</a>
            </div>
          </div>
        </div>
      </section>

      <PageDownloadCTA />
      <PageFooter />
    </>
  );
}
