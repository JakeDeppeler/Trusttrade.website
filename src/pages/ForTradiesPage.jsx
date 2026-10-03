import { PageShell, PageHero, HeadC, CardGrid, Steps, Feature, FaqList, Phone, PageLink, Check } from "../components/SiteKit.jsx";

// /for-tradies: the "apply as a tradie" page. Every benefit here is something
// the live tradie app does today (dashboard, jobs, quote builder, insights,
// desktop dashboard). Pricing: free to apply, no lead fees, no commission
// (the app's quote screen says so). Never promise a price for listing.

const BENEFITS = [
  { t: "Enquiries, not leads", d: "A homeowner looked at your profile, picked you and wrote to you. Nobody else gets that enquiry.", tone: "amber" },
  { t: "No lead fees", d: "You never pay to see a job or to reply. No bidding against four other tradies for the same customer.", tone: "peach" },
  { t: "No commission", d: "Trust Trade takes nothing from your quote. You invoice the customer and keep the full amount.", tone: "mint" },
  { t: "Limited spots per area", d: "Only a few tradies per trade in each suburb, so the work in your area isn't spread thin.", tone: "sky" },
  { t: "You can't pay to rank", d: "Where you show up comes from your rating, reply speed, completed jobs, prices and photos. Money isn't a factor.", tone: "mint" },
  { t: "Checked like you are", d: "Every tradie on here passed the same checks. You're not standing next to someone with a ute and no licence.", tone: "amber" },
];

const STEPS = [
  { t: "Apply online", d: "Your details, licence, ABN, trading hours, services and prices, and some photos of your work." },
  { t: "We check you", d: "A person checks your licence on the regulator's register, your ABN and your photo ID before anything goes live." },
  { t: "Your profile goes live", d: "Homeowners nearby can find you, see your work and prices, and send you an enquiry." },
  { t: "Quote, book, do the job", d: "Reply, send a fixed-price quote from your phone and the job's booked when they accept. Then get reviewed for it." },
];

const NEED = [
  { t: "A current trade licence", d: "For the trade you're listing, in the state you work in." },
  { t: "An active ABN", d: "Matched to the business you're trading as." },
  { t: "Photo ID", d: "So customers know the person turning up is the person we checked." },
];

const FAQ = [
  ["What does it cost?", "Applying is free. There are no lead fees and Trust Trade takes no commission on your jobs."],
  ["How are enquiries sent to me?", "A homeowner finds your profile and sends you an enquiry directly. It isn't sent to anyone else, and you're notified as soon as it arrives."],
  ["How do customers pay me?", "Directly, the way you already get paid. You can send invoices from the app and see what's unpaid at a glance."],
  ["Can I set my own prices?", "Yes. You set your services and prices on your profile, and every quote is yours to write. The app adds GST for you."],
  ["Why is there a limit per area?", "So the tradies on Trust Trade each get a fair share of the work nearby. When the spots for your trade in a suburb are taken, it locks."],
  ["Do I need to be on my phone all day?", "No. Set your hours and when you take emergencies. There's also a desktop dashboard for doing quotes and invoices from the office."],
];

export default function ForTradiesPage() {
  return (
    <PageShell>
      <PageHero
        kicker="Tradies"
        title="Real jobs."
        accent="No lead fees."
        lede="Homeowners nearby find you, check your work and send you the job. You quote it, they accept, it's booked. No bidding, no commission."
        visual={
          <div className="s-phero-vis" aria-hidden="true">
            <div className="s-aurora" />
            <Phone name="trade-jobs" className="l" />
            <Phone name="trade-quote" className="r" />
            <Phone name="trade-dashboard" className="c" />
          </div>
        }
      >
        <a className="s-dl big" href="/apply">Apply to join</a>
        <a className="s-textlink" href="#how-joining-works">How it works →</a>
      </PageHero>

      <section className="s-sec">
        <div className="s-wrap">
          <HeadC lines={["Built for tradies who", "do the job properly."]} sub="Most platforms sell the same job to five businesses. Trust Trade sends it to one: the one the homeowner picked." />
          <CardGrid items={BENEFITS} cols={3} />
        </div>
      </section>

      <section className="s-sec s-stack-sec">
        <div className="s-wrap">
          <HeadC kicker="The tradie app" lines={["Your whole business,", "in your pocket."]} />
          <div className="s-feats">
            <Feature
              kicker="Dashboard"
              title="See what's coming in."
              body="Enquiries for the last 30 days, profile views, calls and emails, and everything that needs you today, on one screen."
              shot="trade-dashboard"
              tone="amber"
            />
            <Feature
              kicker="Quotes"
              title="Quote it in a minute."
              body="Start from a template, add labour and supply lines, and GST is worked out for you. Add your terms and warranty, then send it."
              points={["Accepted means booked", "Save your own templates", "No commission taken"]}
              shot="trade-quote"
              tone="peach"
              flip
            />
            <Feature
              kicker="Jobs"
              title="Every job, sorted."
              body="New, booked and done jobs in one list, with the chat, photos and quote on each. Unpaid invoices are flagged so nothing slips."
              shot="trade-jobs"
              tone="sky"
            />
            <Feature
              kicker="Insights"
              title="Know why you rank."
              body="See your views and enquiries over time, and exactly what moves you up: rating, reply speed, completed jobs, published prices and work photos."
              shot="trade-insights"
              tone="mint"
              flip
            />
          </div>
          <p className="s-fine s-center">Prefer a bigger screen? Log in at <a href="/dashboard" className="s-textlink" style={{ height: "auto", padding: 0 }}>trusttrade.au/dashboard</a> to quote and invoice from the office.</p>
        </div>
      </section>

      <section className="s-sec" id="grow">
        <div className="s-wrap">
          <HeadC kicker="Grow your business" lines={["Tools that help", "you grow."]} sub="Beyond the jobs app, Trust Trade builds tools for the parts of the trade that eat your evenings: designing, sizing and pricing." />
          <div className="s-grow">
            <a className="s-grow-pro rv" href="/pro">
              <span className="s-mono"><i /> Trust Trade Pro</span>
              <h3>Trade tools in one app.</h3>
              <p>
                Start with Ducted Designer: scan a home with an iPhone Pro or upload the builder's plan, and it works out
                every room's heat load, sizes the unit and lays out the ducts. Then share a customer report and a
                materials list.
              </p>
              <ul>
                <li><Check /> Room-by-room heat loads</li>
                <li><Check /> Unit sizing and duct layout</li>
                <li><Check /> Customer report and take-off</li>
              </ul>
              <span className="s-grow-cta">Learn about Trust Trade Pro →</span>
            </a>
            <PageLink className="s-grow-tools rv" href="Tools.html" style={{ "--d": "100ms" }}>
              <span className="s-gcard-ic">Free</span>
              <h3>Free trade tools.</h3>
              <p>The Job Calculator works out what an hour really costs you and prices every job for profit. The Ducted Designer sizes a whole duct run in your browser.</p>
              <span className="s-grow-cta">Open the free tools →</span>
            </PageLink>
          </div>
        </div>
      </section>

      <section className="s-sec" id="how-joining-works">
        <div className="s-wrap">
          <HeadC kicker="Joining" lines={["From application", "to your first job."]} />
          <Steps items={STEPS} />
        </div>
      </section>

      <section className="s-sec tight">
        <div className="s-wrap">
          <HeadC kicker="What you'll need" lines={["Three things."]} sm sub="Have these handy before you start your application." />
          <CardGrid items={NEED} cols={3} numbered />
          <div className="s-center" style={{ marginTop: 40 }}>
            <a className="s-dl big" href="/apply">Start your application</a>
          </div>
        </div>
      </section>

      <section className="s-sec">
        <div className="s-wrap s-faq">
          <HeadC lines={["Tradie questions."]} sm />
          <FaqList items={FAQ} id="tradies" />
          <PageLink className="s-textlink center" href="FAQ.html">All questions →</PageLink>
        </div>
      </section>
    </PageShell>
  );
}
