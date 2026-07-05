import {
  PageFooter,
  PageHeader,
  PageHero,
} from "../components/PageChrome.jsx";
import PageLink from "../components/PageLink.jsx";
import { usePageReveal } from "../components/RedesignSections.jsx";
import "../styles/hiw-redesign.css";

const STATS = [
  { n: "$0", k: "Per-lead fees. Ever." },
  { n: "0%", k: "Commission on your work." },
  { n: "$5M", k: "Minimum public liability, verified." },
  { n: "100%", k: "Of tradies checked by a real tradesperson." },
];

const VALUES = [
  {
    n: "01",
    h: "Verified by a tradie",
    p: "Every application is checked personally: ABN, licence with state regulators, $5M insurance, photo ID. I've been on the tools — I can spot real work from BS.",
  },
  {
    n: "02",
    h: "Never pay per lead",
    p: "Your enquiry goes to one tradie: the one you chose. Never auctioned off to five. No commission, no per-click fees, ever.",
  },
  {
    n: "03",
    h: "Capped per area",
    p: "We don't accept everyone. Limited tradies per trade, per area — so every tradie gets real work and every customer gets someone who wants the job.",
  },
  {
    n: "04",
    h: "Reviews you can trust",
    p: "Every review is tied to a real enquiry through the app. Fakes get caught before they go up.",
  },
  {
    n: "05",
    h: "Quality over quantity",
    p: "A tight, vetted list beats a directory of anyone with a ute. Every tradie here wants to do the job right, not just win the click.",
  },
  {
    n: "06",
    h: "A real person answers",
    p: "Questions go straight to Jake, not a ticket queue. Founder's inbox, no bots — and usually a same-day reply.",
  },
];

const JOURNEY = [
  { when: "The problem", p: "Years on the tools watching lead-gen platforms burn tradies and mislead customers." },
  { when: "The decision", p: "Enough. Started building Trust Trade: verification-first, no per-lead fees, capped regions." },
  { when: "The build", p: "Verification framework, review policy, codes of conduct for both sides. Done properly before launch, not after." },
  { when: "Now", p: "Founding tradies joining across Victoria. Verified one at a time, by hand." },
];

export default function OurStoryPage() {
  usePageReveal();

  return (
    <>
      <PageHeader current="Our Story.html" />

      <PageHero
        eyebrow="Our story"
        title="Finding a good tradie"
        italicWord="shouldn't be this hard."
        lede="It came from years on the tools — watching customers get ripped off with no idea who to trust, and good tradies get lost in the noise. Trust Trade is here to fix both: connect people who want a quality job done with the tradies who take pride in doing it right."
      />

      {/* ===== Stats bar (promises, not vanity metrics) ===== */}
      <section className="page-section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="stat-band reveal">
            {STATS.map((s, i) => (
              <div className="stat-cell" key={i}>
                <div className="n">{s.n}</div>
                <div className="k">{s.k}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Mission ===== */}
      <section className="page-section bordered">
        <div className="container">
          <div className="mid-head reveal">
            <div className="eyebrow accent">Why Trust Trade exists</div>
            <h2 className="h-1">
              The hardest part isn't the repair. <span className="it">It's who to trust.</span>
            </h2>
          </div>
          <div className="story-prose reveal">
            <p>
              I'm Jake — a licensed plumber and gas-fitter in Melbourne, still on the tools. The
              hardest part of owning a home was never the repair. It's working out who to trust to
              do it right. Recommendations run out, reviews can't be trusted, and you've no idea if
              the person at the door is even licensed or insured.
            </p>
            <p>
              Meanwhile the good tradies — the ones who take real pride in their work — get lost in
              the noise, while the ones who game the system get the calls. That's a broken industry,
              and it's bad for everyone.
            </p>
            <p>
              Trust Trade exists to fix it: help people find someone who'll actually do a good job,
              and give honest, vetted tradies a fair shot at the customers who want quality work.
              Not leads. Not auctions. Just the right people, matched properly.
            </p>
          </div>
        </div>
      </section>

      {/* ===== Values ===== */}
      <section className="page-section bordered">
        <div className="container">
          <div className="mid-head reveal">
            <div className="eyebrow accent">What we stand on</div>
            <h2 className="h-1">Six things we <span className="it">won't budge on.</span></h2>
          </div>
          <div className="tradie-perks reveal">
            {VALUES.map((v) => (
              <div className="tradie-perk" key={v.n}>
                <div className="num">{v.n}</div>
                <h4>{v.h}</h4>
                <p>{v.p}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Journey ===== */}
      <section className="page-section bordered">
        <div className="container">
          <div className="mid-head reveal">
            <div className="eyebrow accent">How we got here</div>
            <h2 className="h-1">Honest about being <span className="it">new.</span></h2>
          </div>
          <div className="timeline reveal">
            {JOURNEY.map((t) => (
              <div className="timeline-row" key={t.when}>
                <div className="when">{t.when}</div>
                <div>
                  <p>{t.p}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Team ===== */}
      <section className="page-section bordered">
        <div className="container">
          <div className="mid-head reveal">
            <div className="eyebrow accent">Who's behind it</div>
            <h2 className="h-1">A small Aussie team <span className="it">of two.</span></h2>
            <p className="lede">
              No investors pushing us to squeeze anyone. No plans to sell out.
            </p>
          </div>
          <div className="team-row reveal" style={{ maxWidth: 820, marginLeft: "auto", marginRight: "auto" }}>
            <div className="team-card">
              <div className="ph"><span>Jake</span></div>
              <h5>Jake</h5>
              <div className="role">Founder · Operations &amp; Verification</div>
              <p>Licensed plumber and gas-fitter. Reviews every tradie application personally.</p>
            </div>
            <div className="team-card">
              <div className="ph"><span>Verification partner</span></div>
              <h5>Verification partner</h5>
              <div className="role">Tradie Outreach &amp; Verification</div>
              <p>Handles tradie outreach and on-the-ground verification. (Name and blurb to come — send them through and I'll add them.)</p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== Closing CTA ===== */}
      <section className="page-section bordered">
        <div className="container">
          <div className="mid-head reveal">
            <h2 className="h-1">For the ones who show up and <span className="it">do the job right.</span></h2>
            <p className="lede">
              Questions? Email me directly — <a href="mailto:jake@trusttrade.au">jake@trusttrade.au</a>.
              A real person answers. Usually me.
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginTop: 26 }}>
              <PageLink href="Trust Trade Landing.html#download" className="btn btn-primary btn-lg">
                Find a tradie
              </PageLink>
              <PageLink href="For Tradies.html" className="btn btn-ghost btn-lg">
                Join as a tradie
              </PageLink>
            </div>
          </div>
        </div>
      </section>

      <PageFooter />
    </>
  );
}
