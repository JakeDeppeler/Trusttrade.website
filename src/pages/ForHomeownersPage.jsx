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
            Every licence, insurance certificate and ABN is checked at the source before a tradie
            is listed. Not honour-system.
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

const HOMEOWNER_STORIES = [
  {
    eyebrow: "Verified locals",
    headline: "See who you're actually hiring.",
    body: "Every tradie's licence is checked at the state regulator before you see them. What you see is the receipt.",
    screenshot: "/assets/app-profile.png",
    alt: "A verified tradie's public profile",
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
    eyebrow: "Fixed quote",
    headline: "The price is the price.",
    body: "The tradie sends a call-out fee — one number, in writing — before anyone rolls. You approve or you don't.",
    screenshot: "/assets/app-quote.png",
    alt: "A chat thread with a fixed call-out fee approved",
    overlayCards: [
      {
        position: "br",
        badge: "$120",
        badgeStyle: "float-badge-approved",
        title: "You approved",
        sub: "Logged on both sides",
      },
    ],
  },
  {
    eyebrow: "Browse verified",
    headline: "You pick. Not the algorithm.",
    body: "No job posting, no SMS blast at 7am. Browse verified locals, tap the one you trust, contact them direct.",
    screenshot: "/assets/app-browse.png",
    alt: "The Trust Trade browse screen",
    overlayCards: [
      {
        position: "tr",
        icon: "★",
        title: "5.0 · 6 reviews",
        sub: "From confirmed jobs",
      },
    ],
  },
  {
    eyebrow: "One thread per job",
    headline: "No more \"which Sarah?\"",
    body: "Every job has its own conversation. Gate codes, dogs to watch, photos, receipts — all in one place.",
    screenshot: "/assets/app-messages-list.png",
    alt: "The homeowner messages list",
    overlayCards: [
      {
        position: "tl",
        icon: "✓",
        title: "Job complete",
        sub: "Receipt in your inbox",
      },
    ],
  },
];

const HOMEOWNER_BEHIND = [
  {
    eyebrow: "Trade routing",
    headline: "Describe it in plain English.",
    body: "Type or dictate what's wrong. The app works out which trade you actually need before you're routed.",
  },
  {
    eyebrow: "Privacy first",
    headline: "Your address stays private.",
    body: "Tradies see the suburb, the brief and the photos. They see your street only after you approve the call-out.",
  },
  {
    eyebrow: "48-hour mediation",
    headline: "If it goes sideways, we step in.",
    body: "Both sides have the record. Human on it within an hour, decision within 48 if it doesn't get sorted on the day.",
  },
];

const HOMEOWNER_PROMISES = [
  { title: "Free to use", body: "Finding, booking and messaging tradies is free. No surcharge, ever." },
  { title: "No spam", body: "We don't sell your details to a queue of 5 tradies. You browse. You pick." },
  { title: "Quotes live in the app", body: "Anything a tradie quotes you sits in writing. No hand-shake guessing." },
  { title: "One thread per job", body: "ETA pings, photos, receipts — all in one conversation." },
  { title: "Reviews from real jobs", body: "Only confirmed bookings can review. No bot armies, no drive-bys." },
  { title: "Verified badge on every listing", body: "Licence, insurance, ABN, conduct — four hard checks, one badge." },
  { title: "Emergency filter", body: "Filter by who can be there today. Verified and available." },
  { title: "Nothing gets sold", body: "Your address, your phone, your job details. Yours. Full stop." },
];

const HOMEOWNER_VOICES = [
  {
    title: "Why cheap costs more",
    quote:
      "You save $200 up front on a dodgy tiler. You lose $2,000 fixing the waterproofing eighteen months later. Cheap tradies aren't cheap. They're just the first bill.",
    when: "Founder's note · June 2026",
  },
  {
    title: "The problem we saw",
    quote:
      "I've walked into houses where someone paid the first bloke who answered the ad, and now they can't sell because the work isn't compliant. Trust Trade exists so that never happens to you.",
    when: "Founder's note · May 2026",
  },
  {
    title: "What we're not",
    quote:
      "We're not a job-posting site. We don't sell your details to five people who then hound you at 7am. You browse, you pick, you contact. That's the whole model.",
    when: "Founder's note · June 2026",
  },
];

const COMPARE_ROWS = [
  {
    label: "The request flow",
    them: "Fill out a 12-field form. Get five SMSes by lunch.",
    us: "Describe it in plain English. Browse verified locals. Pick who you like.",
  },
  {
    label: "Who you hear from",
    them: "Whoever pays the platform first. Could be 25 km away.",
    us: "Whoever you picked. Verified, licenced, insured.",
  },
  {
    label: "The quote",
    them: "\"We'll have a look on the day\" — then a $480 surprise.",
    us: "Fixed call-out fee, in writing, approved before they roll.",
  },
  {
    label: "Verification",
    them: "They filled in their licence number. Maybe it's real.",
    us: "Cross-checked with the state regulator. Re-checked quarterly.",
  },
  {
    label: "Reviews",
    them: "Anonymous, possibly bots, possibly the tradie's mate Dave.",
    us: "Only people who actually booked through us can review.",
  },
  {
    label: "The paper trail",
    them: "SMS thread you can't search. Email lost in promotions.",
    us: "One thread, one receipt, in your inbox. Logged for 7 years.",
  },
  {
    label: "If it goes sideways",
    them: "You're on your own. The platform \"facilitates introductions\".",
    us: "48-hour mediation. Both sides have the record.",
  },
];

function ComparisonBlock() {
  return (
    <section className="page-section comparison-block">
      <div className="container">
        <div className="behind-head">
          <div className="eyebrow accent">— The old way vs Trust Trade</div>
          <h2 className="h-1">
            Not another <span className="it">tradie-finder site.</span>
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
  );
}

export default function ForHomeownersPage() {
  return (
    <>
      <PageHeader current="For Homeowners.html" />

      <PageHero
        eyebrow="For homeowners"
        title="Find a tradie."
        italicWord="Without the drama."
        lede="Verified, insured locals with a fixed call-out fee in writing before anyone rolls. Built by a mech plumber who knows the trade from both sides of the front door."
        ctaLabel="Get early access →"
        secondaryLabel="See how it works"
        secondaryHref="How it works.html"
        meta={[
          { k: "Cost", v: "Free for homeowners" },
          { k: "Verification", v: "Licence + insurance + ABN" },
          { k: "Quote format", v: "Fixed call-out, in writing" },
          { k: "Coverage", v: "VIC at launch" },
        ]}
      />

      <IntegrationsRow />

      <FeatureStories stories={HOMEOWNER_STORIES} />

      <BehindTheScenes
        eyebrow="Behind the scenes"
        title="More than a directory."
        italicWord="A safety net."
        subhead="AI-powered trade routing, address privacy, and 48-hour human dispute mediation on every verified booking."
        items={HOMEOWNER_BEHIND}
      />

      <AdditionalFeatures
        eyebrow="What you get"
        title="What we promise,"
        italicWord="in writing."
        items={HOMEOWNER_PROMISES}
        screenshot="/assets/app-home.png"
        alt="Trust Trade homeowner home — Find a tradie. Done proper."
      />

      <PrivacyBreak
        eyebrow="Why we built it this way"
        title="I built the app"
        italicWord="I'd want my mum to use."
        body="I'm a mech plumber. I've quoted the work, I've done the work, and I've walked into more than one job that had already been botched by someone who shouldn't have been on the tools. Trust Trade is what I want my own family to open when the hot water goes."
      />

      <ComparisonBlock />

      <VoiceCards
        eyebrow="From the founder"
        title="Why we're"
        italicWord="doing it this way."
        quotes={HOMEOWNER_VOICES}
      />

      <PageWaitlistFooterCTA
        headline="No more drama."
        subhead="Get on the list."
        secondaryLabel="I'm a tradie"
        secondaryHref="For Tradies.html"
      />
      <PageFooter />
    </>
  );
}
