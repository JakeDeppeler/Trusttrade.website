import {
  PageFooter,
  PageHeader,
  PageHero,
  PageWaitlistFooterCTA,
} from "../components/PageChrome.jsx";
import PageLink from "../components/PageLink.jsx";

const TRADE_CATEGORIES = [
  {
    n: "01",
    name: "Wet trades",
    blurb: "Anything with water, gas or drainage. Licensed and gas-endorsed where required.",
    trades: [
      { name: "Plumbers", sub: "General + gas" },
      { name: "Gas fitters", sub: "Type A + Type B" },
      { name: "Hot water specialists", sub: "Gas, electric, solar" },
      { name: "Drainage", sub: "CCTV + jet-rod" },
      { name: "Roof plumbers", sub: "Gutter + downpipe" },
      { name: "Backflow testers", sub: "Annual rec" },
    ],
  },
  {
    n: "02",
    name: "Electrical",
    blurb: "Sparkies and adjacent specialists. Every job tied to an A-Grade licence.",
    trades: [
      { name: "Electricians", sub: "A-Grade" },
      { name: "Air-con / HVAC", sub: "Split + ducted" },
      { name: "Solar + battery", sub: "CEC-accredited" },
      { name: "EV chargers", sub: "Home + commercial" },
      { name: "Data + comms", sub: "ACMA cabler" },
      { name: "Security + CCTV", sub: "VPLA-licensed" },
    ],
  },
  {
    n: "03",
    name: "Building + carpentry",
    blurb: "Structural, finishing, and the bits in between. Domestic builders' licence checked at apply.",
    trades: [
      { name: "Carpenters", sub: "Structural + finish" },
      { name: "Domestic builders", sub: "DB-U + DB-L" },
      { name: "Cabinet makers", sub: "Kitchens + joinery" },
      { name: "Decking + pergolas", sub: "Outdoor structures" },
      { name: "Doors + windows", sub: "Install + repair" },
      { name: "Handymen", sub: "Sub-$10k jobs" },
    ],
  },
  {
    n: "04",
    name: "Surfaces + finishes",
    blurb: "The trades that make a place actually look finished. Materials at customer cost, labour quoted by the job.",
    trades: [
      { name: "Painters", sub: "Interior + exterior" },
      { name: "Tilers", sub: "Wet + dry" },
      { name: "Plasterers", sub: "Repair + new" },
      { name: "Floorers", sub: "Timber + carpet + vinyl" },
      { name: "Polished concrete", sub: "Grind + seal" },
      { name: "Stonemasons", sub: "Benchtops + fireplaces" },
    ],
  },
  {
    n: "05",
    name: "Outside the house",
    blurb: "Roof, walls, ground, garden. Heights work is OH&S-checked at apply.",
    trades: [
      { name: "Roofers", sub: "Tile + tin + flat" },
      { name: "Bricklayers", sub: "Build + repair" },
      { name: "Concreters", sub: "Slab + paths" },
      { name: "Fencers", sub: "Timber + colorbond + glass" },
      { name: "Landscapers", sub: "Design + build" },
      { name: "Arborists", sub: "Pruning + removal" },
    ],
  },
  {
    n: "06",
    name: "Specialist",
    blurb: "The niche stuff that's hard to find in the suburbs. Listed when we have a verified specialist in your postcode.",
    trades: [
      { name: "Pest control", sub: "Termite + general" },
      { name: "Asbestos removal", sub: "Class A + B" },
      { name: "Pool + spa", sub: "Service + repair" },
      { name: "Locksmiths", sub: "24/7 emergency" },
      { name: "Garage doors", sub: "Install + service" },
      { name: "Restumping", sub: "Concrete + steel", soon: true },
    ],
  },
];

export default function TradesPage() {
  const totalTrades = TRADE_CATEGORIES.reduce((s, c) => s + c.trades.length, 0);

  return (
    <>
      <PageHeader current="Trades we cover.html" />

      <PageHero
        eyebrow="Trades we cover"
        title="Thirty-five trades."
        italicWord="One platform."
        lede="At launch we cover every trade Australian homes actually need. If we don't have a verified specialist in your postcode for a niche trade, you'll see that up-front — no false promises."
        meta={[
          { k: "Trades at launch", v: `${totalTrades} trades · ${TRADE_CATEGORIES.length} categories` },
          { k: "Coverage", v: "Victoria-wide" },
          { k: "Specialists added", v: "By postcode demand" },
          { k: "Request a trade", v: "jake@trusttrade.au" },
        ]}
      />

      <section className="page-section">
        <div className="container">
          {TRADE_CATEGORIES.map((cat) => (
            <div key={cat.n} className="trade-cat">
              <div className="trade-cat-head">
                <div className="cat-num">— Category {cat.n}</div>
                <h3>{cat.name}</h3>
                <p>{cat.blurb}</p>
              </div>
              <div className="trade-list">
                {cat.trades.map((t) => (
                  <div key={t.name} className={"trade-chip " + (t.soon ? "soon" : "")}>
                    <div className="name">{t.name}</div>
                    <div className="sub">{t.soon ? "Soon · " + t.sub : t.sub}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="page-section cream">
        <div className="container">
          <div className="mid-head">
            <div className="eyebrow accent">— Not in the list?</div>
            <h2 className="h-1">
              Tell us <span className="it">what's missing.</span>
            </h2>
            <p className="lede">
              If your trade isn't here, or you need someone specific in your postcode, we'd rather
              know than guess. Email Jake — actual founder, actual inbox.
            </p>
          </div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <a
              className="btn btn-dark btn-lg"
              href="mailto:jake@trusttrade.au?subject=Trade%20request"
            >
              Email a trade request →
            </a>
            <PageLink
              href="For Tradies.html"
              className="btn btn-ghost btn-lg"
              style={{ borderColor: "rgba(12,9,7,0.18)", color: "var(--on-accent)" }}
            >
              I'm a tradie — apply to be listed
            </PageLink>
          </div>
        </div>
      </section>

      <section className="page-section bordered">
        <div className="container">
          <div className="page-nav-prevnext">
            <PageLink href="How we verify.html">
              <span>← Previous</span>
              <strong>How we verify tradies</strong>
            </PageLink>
            <PageLink href="FAQ.html" className="next">
              <span>Next →</span>
              <strong>Full FAQ</strong>
            </PageLink>
          </div>
        </div>
      </section>

      <PageWaitlistFooterCTA />
      <PageFooter />
    </>
  );
}
