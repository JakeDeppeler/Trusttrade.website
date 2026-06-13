import {
  PageFooter,
  PageHeader,
  PageHero,
  PageWaitlistFooterCTA,
} from "../components/PageChrome.jsx";
import PageLink from "../components/PageLink.jsx";

const PRINCIPLES = [
  {
    num: "01",
    title: "Verification is binary.",
    body: "Either we've checked it with the regulator, or we haven't. No \"trust score\", no traffic-light fudge.",
  },
  {
    num: "02",
    title: "One tradie, one job.",
    body: "We will never sell the same lead twice. The day we do, we've become the thing we set out to replace.",
  },
  {
    num: "03",
    title: "Prices live in writing.",
    body: "If it's not in the app, it's not the price. No verbal quotes, no day-of upcharges, no surprises.",
  },
  {
    num: "04",
    title: "Tradies keep 100%.",
    body: "We don't take a cut of the work. Subscription if anything, when the time comes. Never a slice of the job.",
  },
  {
    num: "05",
    title: "Receipts are sacred.",
    body: "Every booking, every quote, every change, every dispute — logged, immutable, available to both parties on request.",
  },
  {
    num: "06",
    title: "Boring, Australian, profitable.",
    body: "We're building a small, sustainable, AU-owned business. Not a unicorn. Not a marketplace land-grab. A useful tool.",
  },
];

const TEAM = [
  {
    name: "Jake",
    role: "Founder · Mech plumber",
    body: "Solo founder. Started as an apprentice, spent years on the tools, now runs the quoting side of the business too. I build the platform, run the verifications, and handle every email myself. The mobile number behind the \"direct line to the team\" perk for Founding 50.",
    placeholder: "Founder portrait placeholder",
  },
];

const TIMELINE = [
  {
    when: "Apr 2024",
    title: "The pattern lands.",
    body: "Quoting a job at a customer's place, they tell me about being burned three times by other tradies. Two weeks later: same story, different house. Then again. I realise this is the pattern, not the exception — people don't know who to trust. The idea for Trust Trade starts here.",
  },
  {
    when: "Sep 2024",
    title: "First prototype.",
    body: "Three Pakenham tradies and a Google Form. We route fifteen test jobs by hand for a month. Twelve get done, on time, on quote. The other three teach us a lot.",
  },
  {
    when: "Mar 2025",
    title: "Trademark + ABN.",
    body: "Trust Trade® is registered with IP Australia in three classes. Company structure goes in. We start writing the verification stack.",
  },
  {
    when: "Oct 2025",
    title: "Closed beta — 40 tradies, 200 homes.",
    body: "Six suburbs in Melbourne's south-east. We get reviews, we get bugs, we get a lot of strong opinions. Most of them make the product better.",
  },
  {
    when: "May 2026",
    title: "Public waitlist opens.",
    body: "Where we are now. Waitlist building, Founding 50 spots filling fast (9 already gone), iOS build in TestFlight with a small alpha cohort.",
  },
  {
    when: "Q4 2026",
    title: "Launch.",
    body: "Web access opens for the waitlist. iOS shortly after, Android close behind. Victoria-wide from day one.",
  },
  {
    when: "2027",
    title: "NSW, QLD, SA.",
    body: "We open the next three states in the months after launch — verification stack ported state by state, founding-member program continues.",
  },
];

const CONTACTS = [
  {
    ticker: "— General",
    title: "Email Jake.",
    body: "Anything that doesn't fit the other boxes. Founder's inbox, no filter.",
    email: "jake@trusttrade.au",
  },
  {
    ticker: "— Press",
    title: "Media + story requests.",
    body: "Founder availability for interviews about the lead-gen economy and what's broken with finding tradies online.",
    email: "press@trusttrade.au",
  },
  {
    ticker: "— Trade associations",
    title: "Partnerships.",
    body: "If you represent a master-builders chapter or trade association and want a member rate, we want to hear from you.",
    email: "partners@trusttrade.au",
  },
];

export default function AboutPage() {
  return (
    <>
      <PageHeader current="About.html" />

      <PageHero
        eyebrow="About"
        title="Built in Melbourne."
        italicWord="For Aussie homes."
        lede="Trust Trade is a one-person shop run by a mechanical plumber trying to fix one specific problem: people don't know who to trust when they need a tradie. Here's why I'm doing it, and how I got here."
        meta={[
          { k: "Founded", v: "Melbourne, 2024" },
          { k: "Team", v: "Solo founder" },
          { k: "ABN", v: "40 873 784 535" },
          { k: "Status", v: "Pre-launch, Q4 2026" },
        ]}
      />

      <section className="page-section">
        <div className="container">
          <div className="about-grid">
            <div>
              <div className="eyebrow accent" style={{ marginBottom: 14 }}>
                — The why
              </div>
              <h2 className="h-1">
                A mech plumber <span className="it">with a software problem.</span>
              </h2>
            </div>
            <div>
              <p className="lead">
                I'm a mechanical plumber. I started at the bottom — apprentice, on the tools.
                Years of doing the work. Now I run the quoting side of the business too. Same
                trade, different chair.
              </p>
              <p>
                From both chairs, the same problem kept showing up. Customers tell me about
                being burned by other tradies — quoted one number, charged another, work that
                fell apart in six months. Tradies tell me about lead-gen platforms selling their
                email to four other sparkies for the same job, then ghosting when the customer
                picks someone cheaper.
              </p>
              <p>
                Two different stories.{" "}
                <strong>Same root problem: people don't know who to trust.</strong>{" "}
                The customer doesn't know which tradie isn't going to take advantage. The tradie
                doesn't know which platform isn't going to take advantage of them.
              </p>
              <p>
                Trust Trade is the platform I'd want at both ends — verified, fixed-price,
                one-tradie-at-a-time, no lead fees. It's what I'd want as the bloke calling for a
                plumber on a Sunday. It's what I'd want as the bloke quoting the work on Monday.
                So I built it.
              </p>
              <p style={{ marginTop: 32 }}>— Jake, founder</p>
            </div>
          </div>
        </div>
      </section>

      <section className="page-section cream">
        <div className="container">
          <div className="mid-head">
            <div className="eyebrow accent">— What we believe</div>
            <h2 className="h-1">
              Five rules we won't <span className="it">trade away.</span>
            </h2>
            <p className="lede">
              Every product decision goes through these. When I'm tempted to fudge one, I go
              back and read them out loud.
            </p>
          </div>

          <div className="tradie-perks">
            {PRINCIPLES.map((p) => (
              <div className="tradie-perk" key={p.num}>
                <div className="num">{p.num}</div>
                <h4>{p.title}</h4>
                <p>{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="page-section bordered">
        <div className="container">
          <div className="mid-head">
            <div className="eyebrow accent">— The team</div>
            <h2 className="h-1">
              Just me. <span className="it">Direct inbox.</span>
            </h2>
            <p className="lede">
              If you've got a question, I'm reading it. No support ticket queue, no team to route
              through. Founder's mobile, founder's inbox.
            </p>
          </div>

          <div className="team-row" style={{ display: "flex", justifyContent: "center" }}>
            {TEAM.map((t) => (
              <div className="team-card" key={t.name} style={{ maxWidth: 420, width: "100%" }}>
                <div className="ph">
                  <span>{t.placeholder}</span>
                </div>
                <h5>{t.name}</h5>
                <div className="role">{t.role}</div>
                <p>{t.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="page-section bordered">
        <div className="container">
          <div className="mid-head">
            <div className="eyebrow accent">— How we got here</div>
            <h2 className="h-1">
              The road <span className="it">so far.</span>
            </h2>
          </div>

          <div className="timeline">
            {TIMELINE.map((row) => (
              <div className="timeline-row" key={row.when}>
                <div className="when">{row.when}</div>
                <div>
                  <h4>{row.title}</h4>
                  <p>{row.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="page-section bordered">
        <div className="container">
          <div className="mid-head">
            <div className="eyebrow accent">— Press & contact</div>
            <h2 className="h-1">Want to talk?</h2>
          </div>

          <div className="proof-grid">
            {CONTACTS.map((c) => (
              <div className="proof-card" key={c.email}>
                <div className="ticker">{c.ticker}</div>
                <h4>{c.title}</h4>
                <p>{c.body}</p>
                <a className="stamp" href={`mailto:${c.email}`}>
                  {c.email}
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="page-section bordered">
        <div className="container">
          <div className="page-nav-prevnext">
            <PageLink href="FAQ.html">
              <span>← Previous</span>
              <strong>Full FAQ</strong>
            </PageLink>
            <PageLink href="Trust Trade Landing.html" className="next">
              <span>Back to →</span>
              <strong>The home page</strong>
            </PageLink>
          </div>
        </div>
      </section>

      <PageWaitlistFooterCTA />
      <PageFooter />
    </>
  );
}
