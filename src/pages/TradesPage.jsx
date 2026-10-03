import { PageShell, PageHero, HeadC, PageLink } from "../components/SiteKit.jsx";

// /trades. The same canonical trade list the directory generator uses
// (scripts/gen-tradie-pages.mjs ALL_TRADES); each links to its /find hub.

const TRADES = [
  ["plumbers", "Plumbers", "Leaks, blocked drains, hot water"],
  ["gas-fitters", "Gas fitters", "Gas appliances, cooktops, leaks"],
  ["electricians", "Electricians", "Power, lighting, switchboards"],
  ["hvac", "HVAC & air-con", "Split systems, ducted heating and cooling"],
  ["carpenters", "Carpenters", "Decks, doors, framing, repairs"],
  ["roofers", "Roofers", "Leaks, gutters, restoration"],
  ["painters", "Painters", "Interior and exterior painting"],
  ["tilers", "Tilers", "Bathrooms, kitchens, floors"],
  ["handyman-services", "Handyman services", "Small jobs around the house"],
];

function Arrow() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

export default function TradesPage() {
  return (
    <PageShell>
      <PageHero
        kicker="Trades we cover"
        title="The trades your"
        accent="home needs."
        lede="Every tradie listed is licence-checked by a person first. Pick a trade to see who's available near you."
      />
      <section className="s-sec tight">
        <div className="s-wrap">
          <div className="s-trades">
            {TRADES.map(([slug, name, desc], i) => (
              <a key={slug} className="s-trade rv" href={`/find/${slug}`} style={{ "--d": (i % 3) * 70 + "ms" }}>
                <span>
                  <b>{name}</b>
                  <small>{desc}</small>
                </span>
                <span><Arrow /></span>
              </a>
            ))}
          </div>
        </div>
      </section>
      <section className="s-sec tight">
        <div className="s-wrap">
          <HeadC lines={["Your trade not here?"]} sm sub="We add trades as checked tradies join. If you're licensed and want to be listed, apply and tell us what you do." />
          <div className="s-center">
            <PageLink className="s-dl" href="For Tradies.html">Join as a tradie</PageLink>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
