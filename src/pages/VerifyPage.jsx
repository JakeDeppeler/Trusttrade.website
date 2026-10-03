import { PageShell, PageHero, HeadC, CardGrid, Feature, Check, Phone } from "../components/SiteKit.jsx";

// /how-we-verify, presented as "Trust & safety". States exactly what is checked
// (trade licence on the regulator's register, ABN against the ABR, photo ID) and,
// plainly, what is NOT (insurance: Verification Standard 2.2 says we don't verify it).

const CHECKS = [
  { t: "Trade licence", d: "Checked by a person on the state regulator's public register, for the trade they're listed under. Expiry dates are tracked.", tone: "mint" },
  { t: "Active ABN", d: "Checked against the Australian Business Register and matched to the business they trade as.", tone: "sky" },
  { t: "Photo ID", d: "Matched to the person who applied, so the tradie at your door is the one we checked.", tone: "amber" },
];

const SAFETY = [
  { t: "Your job goes to one tradie", d: "An enquiry only goes to the tradie you send it to. It isn't shared, sold or auctioned." },
  { t: "Your address stays private", d: "Your street address is only shared with the tradie you book, for that job." },
  { t: "Everything on record", d: "Messages, photos and quotes stay in the app, so there's a record of what you both agreed." },
  { t: "Reviews from real jobs", d: "Reviews are marked as a verified job when they come from a booking. Tradies can reply publicly." },
  { t: "Report a profile", d: "Something not right? Every profile has a Report button, and a person reads every report." },
  { t: "Raise an issue on a job", d: "If something's gone wrong with a quote or a job, raise it from the job in the app and we'll step in." },
];

export default function VerifyPage() {
  return (
    <PageShell>
      <PageHero
        kicker="Trust & safety"
        title="Checked by a person,"
        accent="before they're listed."
        lede="Anyone can make a listing on most sites. On Trust Trade, every tradie applies and passes three checks before a homeowner ever sees them."
        visual={
          <div className="s-phero-vis" aria-hidden="true">
            <div className="s-aurora" />
            <Phone name="profile-checks" className="c" />
          </div>
        }
      />

      <section className="s-sec">
        <div className="s-wrap">
          <HeadC kicker="The checks" lines={["Three checks.", "Every tradie."]} sub="Done by a person, not a bot, before a profile goes live. You can see them on every tradie's profile." />
          <CardGrid items={CHECKS} cols={3} numbered />
          <div className="s-note rv" style={{ marginTop: 28 }}>
            <b>What we don't check:</b> insurance. We don't verify a tradie's public liability or other insurance, so if
            your job needs it, ask your tradie for a current certificate before they start.
          </div>
        </div>
      </section>

      <section className="s-sec s-stack-sec">
        <div className="s-wrap s-feats">
          <Feature
            kicker="On every profile"
            title="See the checks for yourself."
            body="Each tradie's profile shows their licence and ABN checks, their contact details and hours, the area they cover, and reviews from booked jobs only."
            points={["Licence checked by a person", "ABN checked against the ABR", "Reviews only from booked jobs"]}
            shot="profile-checks"
            tone="mint"
          />
        </div>
      </section>

      <section className="s-sec">
        <div className="s-wrap">
          <HeadC kicker="Safety" lines={["Built so you", "stay in control."]} />
          <CardGrid items={SAFETY} cols={3} />
        </div>
      </section>

      <section className="s-sec tight">
        <div className="s-wrap s-center">
          <HeadC lines={["Tips for any trade job."]} sm />
          <div className="s-facts" style={{ maxWidth: 980, margin: "0 auto", textAlign: "left" }}>
            <div className="rv"><Check s={16} /><span><b>Keep it in the app.</b> Agree the price and changes in writing.</span></div>
            <div className="rv" style={{ "--d": "80ms" }}><Check s={16} /><span><b>Ask for insurance</b> if your job needs it.</span></div>
            <div className="rv" style={{ "--d": "160ms" }}><Check s={16} /><span><b>Extra work?</b> Ask for an updated quote first.</span></div>
          </div>
          <p className="s-fine" style={{ marginTop: 28 }}>
            Something wrong? Email <a href="mailto:jake@trusttrade.au?subject=Safety" className="s-textlink" style={{ height: "auto", padding: 0 }}>jake@trusttrade.au</a> and a person will reply.
          </p>
        </div>
      </section>
    </PageShell>
  );
}
