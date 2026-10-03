import { PageShell, PageHero, HeadC } from "../components/SiteKit.jsx";

// /tools: the free tradie tools hosted on this site (static files in public/).

const TOOLS = [
  { name: "Job Calculator", desc: "Work out what an hour really costs you, price every job for profit and publish a customer-ready price list. Imports from Xero.", href: "/job-calculator.html", cta: "Open the calculator", tone: "amber" },
  { name: "Ducted Designer", desc: "Upload a floor plan, place your outlets and it sizes the whole duct run, then builds a take-off and a quote.", href: "/duct-sizing.html", cta: "Open the designer", tone: "sky" },
];

export default function ToolsPage() {
  return (
    <PageShell>
      <PageHero kicker="Free trade tools" title="Tools for" accent="the trade." lede="Free tools that make quoting easier and your numbers clearer. Open in your browser, no download needed." />
      <section className="s-sec tight">
        <div className="s-wrap">
          <div className="s-grid c2">
            {TOOLS.map((t, i) => (
              <a key={t.name} className={"s-gcard s-tool rv tone-" + t.tone} href={t.href} style={{ "--d": i * 80 + "ms" }}>
                <span className="s-gcard-ic">Free</span>
                <h3>{t.name}</h3>
                <p>{t.desc}</p>
                <span className="s-tool-cta">{t.cta} →</span>
              </a>
            ))}
          </div>
        </div>
      </section>
      <section className="s-sec tight">
        <div className="s-wrap">
          <HeadC lines={["Made by a tradie,", "for tradies."]} sm sub="Built by Trust Trade's founder, a mechanical plumber, from years of quoting real jobs." />
        </div>
      </section>
    </PageShell>
  );
}
