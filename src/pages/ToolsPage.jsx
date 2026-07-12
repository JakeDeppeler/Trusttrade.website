import {
  PageDownloadCTA,
  PageFooter,
  PageHeader,
  PageHero,
} from "../components/PageChrome.jsx";
import PageLink from "../components/PageLink.jsx";
import { usePageReveal } from "../components/RedesignSections.jsx";
import "../styles/hiw-redesign.css";

const TOOLS = [
  {
    status: "live",
    icon: "🧮",
    name: "Job Calculator",
    desc: "Work out what an hour actually costs you, price every job for profit, and publish a customer-ready price list. Import straight from Xero. Free.",
    href: "/job-calculator.html",
    cta: "Open the calculator",
  },
  {
    status: "soon",
    icon: "🌬️",
    name: "Duct Sizing",
    desc: "Size ducts right the first time — airflow, static pressure and duct runs worked out for you. In the workshop now.",
    cta: "Coming soon",
  },
];

export default function ToolsPage() {
  usePageReveal();

  return (
    <>
      <PageHeader current="Tools.html" />

      <PageHero
        eyebrow="Free trade tools"
        title="Tools built to help"
        italicWord="the trade."
        lede="We're not here to sell you leads — we're here to help tradies run a better business. Free tools that make your day easier and your numbers clearer. The calculator's live now, with more on the way."
      />

      {/* ===== Tools grid ===== */}
      <section className="page-section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="tools-grid reveal">
            {TOOLS.map((t) => (
              <div className={"tool-card " + t.status} key={t.name}>
                <div className="tool-top">
                  <span className="tool-icon" aria-hidden="true">{t.icon}</span>
                  <span className={"tool-badge " + t.status}>
                    {t.status === "live" ? "Live" : "Coming soon"}
                  </span>
                </div>
                <h3>{t.name}</h3>
                <p>{t.desc}</p>
                {t.status === "live" ? (
                  <a href={t.href} className="btn btn-primary tool-cta">{t.cta} →</a>
                ) : (
                  <span className="btn btn-ghost tool-cta is-soon" aria-disabled="true">{t.cta}</span>
                )}
              </div>
            ))}

            {/* Suggestion card */}
            <div className="tool-card idea">
              <div className="tool-top">
                <span className="tool-icon" aria-hidden="true">💡</span>
                <span className="tool-badge idea">Your idea</span>
              </div>
              <h3>What should we build next?</h3>
              <p>These tools come straight from what tradies ask for. Tell us what would make your job easier — it might be the next one we build.</p>
              <a
                href="mailto:jake@trusttrade.au?subject=Tool%20idea&body=A%20tool%20that%20would%20help%20me%3A%20"
                className="btn btn-ghost tool-cta"
              >
                Suggest a tool
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ===== Why we build these ===== */}
      <section className="page-section bordered">
        <div className="container">
          <div className="mid-head reveal">
            <div className="eyebrow accent">Why we build these</div>
            <h2 className="h-1">
              Here to help the trade, <span className="it">not just win the click.</span>
            </h2>
            <p className="lede">
              The industry got sold out by lead-gen platforms that take a cut and give nothing back.
              We're doing the opposite — genuinely useful tools, free, that make you better at running
              your business. The app is where the work comes from; the tools are how we back the tradies
              who do the job right.
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginTop: 26 }}>
              <a href="/job-calculator.html" className="btn btn-primary btn-lg">Open the calculator →</a>
              <PageLink href="For Tradies.html" className="btn btn-ghost btn-lg">Join as a tradie</PageLink>
            </div>
          </div>
        </div>
      </section>

      <PageDownloadCTA
        eyebrow="The tools are free"
        title="The work's in"
        italic="the app."
        lede="Know your numbers with the tools, then let Trust Trade bring you the customers — verified, local, and no per-lead fees."
      />

      <PageFooter />
    </>
  );
}
