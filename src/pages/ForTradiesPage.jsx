import {
  PageFooter,
  PageHeader,
  PageHero,
  PageWaitlistFooterCTA,
} from "../components/PageChrome.jsx";
import PageLink from "../components/PageLink.jsx";
import {
  FeatureStories,
  BehindTheScenes,
  AdditionalFeatures,
  PrivacyBreak,
  VoiceCards,
} from "../components/BevelSections.jsx";

const REGULATORS = [
  { short: "VBA", full: "Victorian Building Authority", tag: "Licence · builders + plumbers" },
  { short: "ESV", full: "Energy Safe Victoria", tag: "Licence · electrical + gas" },
  { short: "ASIC", full: "ABN Register", tag: "Business status" },
  { short: "IP Australia", full: "Trademarks Register", tag: "Trading name" },
];

function IntegrationsRow() {
  return (
    <section className="integrations-row" aria-label="Regulators we verify against">
      <div className="container">
        <div className="integrations-head">
          <div className="eyebrow accent">— Verified against</div>
          <p>
            Every licence, insurance certificate and ABN is checked at the source before you're
            listed. Not honour-system.
          </p>
        </div>
        <ul className="integrations-list">
          {REGULATORS.map((r) => (
            <li key={r.short} className="integration-pill">
              <span className="integration-short">{r.short}</span>
              <span className="integration-body">
                <span className="integration-full">{r.full}</span>
                <span className="integration-tag">{r.tag}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

const TRADIE_STORIES = [
  {
    eyebrow: "Your inbox",
    headline: "Every job in one place.",
    body: "New enquiries pin to the top. Every job has its own thread with the customer, ABN, address and fee attached.",
    screenshot: "/assets/app-inbox.png",
    alt: "The tradie inbox showing new enquiries, quoted and booked jobs",
    overlayCards: [
      {
        position: "tr",
        icon: "!",
        title: "Emergency pinned",
        sub: "Hot water · Pakenham · 8am",
      },
    ],
  },
  {
    eyebrow: "Fixed call-out",
    headline: "You set the price, every job.",
    body: "No bidding, no auction. Send one number through the chat. They approve or they don't.",
    screenshot: "/assets/app-quote.png",
    alt: "A chat thread with a fixed call-out fee approved in writing",
    overlayCards: [
      {
        position: "br",
        badge: "$120",
        badgeStyle: "float-badge-approved",
        title: "Customer approved",
        sub: "Logged both sides",
      },
    ],
  },
  {
    eyebrow: "Your storefront",
    headline: "The profile homeowners actually trust.",
    body: "Cover photo, story, gallery, verified reviews. Verified badges from the regulator stay on while your licence is current.",
    screenshot: "/assets/app-profile.png",
    alt: "A tradie's public profile in the Trust Trade app",
    overlayCards: [
      {
        position: "tl",
        icon: "✓",
        title: "Licence verified",
        sub: "VBA · re-checked quarterly",
      },
    ],
  },
  {
    eyebrow: "Real insights",
    headline: "Numbers behind your listing.",
    body: "Profile views, enquiries, first-reply time, reviews. Plus a health score with a checklist of what to fix next.",
    screenshot: "/assets/app-insights.png",
    alt: "The tradie insights dashboard",
    overlayCards: [
      {
        position: "tl",
        icon: "↗",
        title: "+18% this week",
        sub: "Profile views vs last 7d",
      },
    ],
  },
];

const TRADIE_BEHIND = [
  {
    eyebrow: "Routing",
    headline: "Customers who picked you.",
    body: "Verified homeowners browse locals and contact you direct. No shared leads, no bidding war, no dead-fish enquiries.",
  },
  {
    eyebrow: "Verification",
    headline: "The regulator does the credentialing.",
    body: "We check your licence at VBA, ESV, ASIC and IP Australia. Renewal reminders auto-fire before your certificate lapses.",
  },
  {
    eyebrow: "Payments",
    headline: "The money never touches us.",
    body: "Invoice the customer direct. Whatever you charge is what you keep. No commission, no clawback, no middleman.",
  },
];

const TRADIE_PERKS = [
  { title: "You set your radius", body: "5 km, 25 km, or the whole metro. Filter jobs to fit your day." },
  { title: "You set your hours", body: "Business hours, on-call, weekends only. Switch in the app any time." },
  { title: "60-second brief", body: "Trade, urgency, postcode, photos. Take the job or pass — no penalty." },
  { title: "No lock-in", body: "Pause your listing, leave, come back. No subscription clawback." },
  { title: "Founding 50 pricing", body: "First 50 in lock in lifetime founding rates on any future paid tiers." },
  { title: "Direct line to Jake", body: "First 12 months, you get a real human on a real phone. No ticket queue." },
  { title: "Verified reviews only", body: "Only confirmed bookings can leave a review. No competitor sniping." },
  { title: "48-hour dispute mediation", body: "Both sides have the record. Human on it within an hour, decision within 48." },
];

const TRADIE_VOICES = [
  {
    title: "The lead-gen tax",
    quote:
      "The old platforms take a cut of every quote, every job, every referral. And the customers still don't trust you because they got your name off a spam blast. We built the opposite.",
    when: "Founder's note · June 2026",
  },
  {
    title: "Why fixed call-out",
    quote:
      "A fixed call-out fee protects both sides. You get paid for the drive. They know what they're agreeing to. Nothing gets ambiguous on the day. That's what the app enforces.",
    when: "Founder's note · June 2026",
  },
  {
    title: "The Founding 50",
    quote:
      "The first 50 tradies are helping me shape this. In return I lock you in on founding rates forever, badge your profile, and put you first in Browse until 2027. Fair deal.",
    when: "Founder's note · May 2026",
  },
];

const COMPARE_ROWS = [
  {
    label: "Pricing model",
    them: "Pay per lead. $20–$80 every time a homeowner clicks — even if they never call back.",
    us: "One flat listing fee. No per-lead charges, no commission on jobs.",
  },
  {
    label: "How customers find you",
    them: "Your job posted to 4–5 tradies. Whoever replies first wins.",
    us: "No job posting. Customers browse verified tradies and contact you direct.",
  },
  {
    label: "Quoting",
    them: "Bidding war. Lowest quote wins. You earn less every year.",
    us: "You set the call-out, per job, every job. They say yes or they don't.",
  },
  {
    label: "Customer quality",
    them: "Anyone with a free email can request. Half the leads ghost you.",
    us: "Verified accounts only. People who want quality, not the cheapest bid.",
  },
  {
    label: "Reviews",
    them: "Anonymous drive-bys. Competitor sniping. No path to remove rubbish.",
    us: "Only verified bookings can review. Disputes mediated within 48 hours.",
  },
];

function ComparisonBlock() {
  return (
    <section className="page-section comparison-block">
      <div className="container">
        <div className="behind-head">
          <div className="eyebrow accent">— The old way vs Trust Trade</div>
          <h2 className="h-1">
            Not another <span className="it">lead-gen platform.</span>
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
  );
}

function FoundingFifty() {
  return (
    <section className="founding-fifty">
      <div className="container">
        <div className="founding-inner">
          <div className="founding-copy">
            <div className="eyebrow accent">— Founding 50</div>
            <h2 className="h-1">
              First 50 tradies in. <span className="it">Locked in for life.</span>
            </h2>
            <p className="lede">
              No paid tier exists yet. When it does — premium routing, deeper analytics — the first
              50 tradies through the door pay founding rates on the same ABN, forever.
            </p>
            <ul className="founding-list">
              <li>
                <strong>Lifetime founding pricing.</strong> Whatever paid tiers cost in 2028 or 2032,
                you pay 2026 rates.
              </li>
              <li>
                <strong>Founding badge on your profile.</strong> Homeowners see the mark. We surface
                you first in Browse until 2027.
              </li>
              <li>
                <strong>Direct line to the team.</strong> Jake's mobile for the first 12 months.
                No ticket queue.
              </li>
            </ul>
            <div className="founding-cta">
              <PageLink
                href="Trust Trade Landing.html#waitlist"
                className="btn btn-primary btn-lg"
              >
                Apply for Founding 50 →
              </PageLink>
              <span className="founding-note">
                First 50 in. Then the badge is gone.
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function ForTradiesPage() {
  return (
    <>
      <PageHeader current="For Tradies.html" />

      <PageHero
        eyebrow="For tradies"
        title="More jobs."
        italicWord="Less mucking around."
        lede="A real customer who picked you — not a job blasted to a mailing list. Fixed call-outs, one inbox per job, and a receipt at the end. Built by a mech plumber who's sick of the lead-gen rort."
        ctaLabel="Apply to join →"
        ctaHref="Trust Trade Landing.html#waitlist"
        secondaryLabel="Read the tradie FAQ"
        secondaryHref="FAQ.html#tradies"
        meta={[
          { k: "Model", v: "Listing fee only" },
          { k: "Reach", v: "You set your radius" },
          { k: "Payments", v: "Direct to you" },
          { k: "Lock-in", v: "None" },
        ]}
      />

      <IntegrationsRow />

      <FeatureStories stories={TRADIE_STORIES} />

      <BehindTheScenes
        eyebrow="Under the hood"
        title="Built the way"
        italicWord="the trade actually runs."
        subhead="Real customers. Real verification. Real payments direct to you."
        items={TRADIE_BEHIND}
      />

      <AdditionalFeatures
        eyebrow="What you get"
        title="Small stuff"
        italicWord="that adds up."
        items={TRADIE_PERKS}
        screenshot="/assets/app-insights-detail.png"
        alt="Detailed tradie insights — profile views, enquiries, calls, emails, reviews"
      />

      <PrivacyBreak
        eyebrow="From the tools"
        title="I'm building this because"
        italicWord="I'm the tradie on the other end of it."
        body="I'm a mech plumber. I've been on the tools, I've been quoting the jobs, and I've seen every rort. Trust Trade is what I'd want at both ends — a real customer who picked me, and a paper trail so nothing goes sideways."
      />

      <ComparisonBlock />

      <FoundingFifty />

      <VoiceCards
        eyebrow="Notes from the founder"
        title="Why we're"
        italicWord="doing it this way."
        quotes={TRADIE_VOICES}
      />

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
