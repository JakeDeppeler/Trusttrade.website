import { PageShell, PageHero, HeadC, CardGrid } from "../components/SiteKit.jsx";

// /about (also where /our-story now points). Only verifiable facts: Jake is a
// Melbourne mechanical plumber who founded it, reviews applications, and the app
// went live on the App Store in Sept 2026. No invented timeline, team or numbers.

const BELIEFS = [
  { t: "One enquiry, one tradie.", d: "Your job goes to the tradie you chose. We will never sell the same job to five businesses." },
  { t: "Checked by a person.", d: "Every tradie's licence, ABN and photo ID is checked by a real person before they're listed." },
  { t: "Prices in writing.", d: "A fixed-price quote, with GST shown, agreed in the app before the job is booked." },
  { t: "No commission.", d: "Tradies keep the full amount of every job. We don't take a slice of the work." },
  { t: "You can't pay to rank.", d: "Tradies rank on reviews, reply speed and the work they've done. Never on what they spend." },
  { t: "A real person answers.", d: "Questions come to the founder's inbox, not a ticket queue." },
];

export default function AboutPage() {
  return (
    <PageShell>
      <PageHero
        kicker="About Trust Trade"
        title="Finding a good tradie"
        accent="shouldn't be this hard."
        lede="Trust Trade was started by a Melbourne mechanical plumber who kept hearing the same story: people don't know who to trust, and good tradies get lost in the noise."
      />

      <section className="s-sec tight">
        <div className="s-wrap">
          <div className="s-prose rv">
            <p>
              I'm Jake, a mechanical plumber in Melbourne, still on the tools. The hardest part of getting work done on a
              home is rarely the repair. It's working out <strong>who to trust to do it right.</strong> Recommendations run
              out, reviews are easy to fake, and you've no idea whether the person at the door is even licensed.
            </p>
            <p>
              On the other side, the tradies who take real pride in their work get buried, while lead-gen sites sell the
              same job to five businesses and let them fight over price. It's bad for homeowners and it's bad for good
              tradies.
            </p>
            <p>
              Trust Trade is the app I wanted at both ends. Every tradie is checked before they're listed. Your enquiry goes
              to the one you pick. The price is agreed in writing before anyone turns up. And tradies keep every dollar of
              the job.
            </p>
            <div className="s-sign">
              <picture>
                <source srcSet="/assets/mascot-toolbox-sm.avif" type="image/avif" />
                <img src="/assets/mascot-toolbox-sm.webp" alt="" width={56} height={56} loading="lazy" />
              </picture>
              <div>
                <b>Jake</b>
                <small>Founder, Trust Trade</small>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="s-sec">
        <div className="s-wrap">
          <HeadC kicker="What we stand on" lines={["Six things we", "won't trade away."]} />
          <CardGrid items={BELIEFS} cols={3} numbered />
        </div>
      </section>

      <section className="s-sec tight">
        <div className="s-wrap">
          <HeadC kicker="Where we are" lines={["Live on iPhone,", "starting in Victoria."]} sm sub="Trust Trade launched on the App Store in September 2026. We're growing state by state, and Android is on the way." />
        </div>
      </section>

      <section className="s-sec tight">
        <div className="s-wrap">
          <HeadC kicker="Get in touch" lines={["Talk to us."]} sm />
          <div className="s-contact">
            <a className="rv" href="mailto:jake@trusttrade.au">
              <small>General</small>
              <b>Email Jake</b>
              <span>jake@trusttrade.au</span>
            </a>
            <a className="rv" href="mailto:jake@trusttrade.au?subject=Media%20enquiry" style={{ "--d": "80ms" }}>
              <small>Press</small>
              <b>Media and story requests</b>
              <span>Email with "Media" in the subject</span>
            </a>
            <a className="rv" href="mailto:jake@trusttrade.au?subject=Partnership" style={{ "--d": "160ms" }}>
              <small>Partners</small>
              <b>Trade associations and partners</b>
              <span>Email with "Partnership" in the subject</span>
            </a>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
