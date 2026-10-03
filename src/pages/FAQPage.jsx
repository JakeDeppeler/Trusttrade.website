import { PageShell, PageHero, HeadC, FaqList, PageLink } from "../components/SiteKit.jsx";

// /faq. Answers describe the live app only: no call-out fees (fixed-price quotes),
// no insurance checks, no in-app payments, no invented timelines or member counts.

const HOMEOWNERS = [
  ["Is Trust Trade free?", "Yes. Finding a tradie, sending enquiries, getting quotes and booking are free for homeowners. You only pay your tradie for the job, at the price you accepted."],
  ["How do I find a tradie?", "Search by name or by the job, or browse the map. Tradies are sorted nearest first, and every one has passed our checks. Not sure who you need? Ask the assistant in the app."],
  ["Who sees my enquiry?", "Only the tradie you send it to. It isn't shared with or sold to anyone else, and you won't hear from businesses you didn't contact."],
  ["How do quotes work?", "Your tradie sends a fixed-price quote in the app with GST shown. Accept it and the job is booked. Anything extra should come as an updated quote before the work is done."],
  ["Do I pay through the app?", "No. You pay your tradie directly. The quote, booking and messages stay in the app as a record of what you agreed."],
  ["Is my address shared?", "Your street address is only shared with the tradie you book, for that job."],
  ["How do reviews work?", "Once a job's done you can leave a review. Reviews from a booked job are marked as verified, and tradies can reply publicly."],
  ["Where does it work?", "Trust Trade is live on iPhone in Australia, starting in Victoria. Android is on the way."],
];

const CHECKS = [
  ["What do you check?", "Three things, by a person, before a tradie is listed: their trade licence on the state regulator's public register, their ABN against the Australian Business Register, and their photo ID."],
  ["Do you check insurance?", "No. We don't verify a tradie's insurance. If your job needs it, ask your tradie for a current certificate before they start."],
  ["What if something goes wrong?", "Raise an issue from the job in the app, or email jake@trusttrade.au. A person reads every message. You can also report any profile from the profile itself."],
  ["Does the assistant replace a tradie?", "No. It helps you work out which trade you need and how urgent it is, then points you to checked tradies. The work is always done by a licensed person."],
];

const TRADIES = [
  ["What does it cost to join?", "Applying is free. There are no lead fees, and Trust Trade takes no commission on your jobs."],
  ["What do I need to apply?", "A current trade licence, an active ABN and photo ID, plus your services, prices, hours and some photos of your work."],
  ["Are enquiries shared with other tradies?", "No. A homeowner picks you and sends the enquiry to you only."],
  ["How many tradies are in my area?", "Only a few per trade in each suburb. When the spots are taken, that area locks."],
  ["How do I rank higher?", "Good reviews, fast replies, completed jobs, published prices and photos of your work. Paying isn't a factor."],
  ["Is there a desktop version?", "Yes. Log in at trusttrade.au/dashboard to manage enquiries, quotes and invoices from a computer."],
];

export default function FAQPage() {
  return (
    <PageShell>
      <PageHero kicker="FAQ" title="Questions," accent="answered." lede="Everything you need to know about finding a tradie, or joining as one." />

      <section className="s-sec tight">
        <div className="s-wrap s-faq">
          <HeadC kicker="Homeowners" lines={["Finding and booking."]} sm />
          <FaqList items={HOMEOWNERS} id="homeowners" />
        </div>
      </section>

      <section className="s-sec tight">
        <div className="s-wrap s-faq">
          <HeadC kicker="Trust & safety" lines={["Checks and safety."]} sm />
          <FaqList items={CHECKS} id="safety" />
          <PageLink className="s-textlink center" href="How we verify.html">How we check tradies →</PageLink>
        </div>
      </section>

      <section className="s-sec tight">
        <div className="s-wrap s-faq">
          <HeadC kicker="Tradies" lines={["Joining Trust Trade."]} sm />
          <FaqList items={TRADIES} id="tradies" />
          <PageLink className="s-textlink center" href="For Tradies.html">Why join →</PageLink>
        </div>
      </section>

      <section className="s-sec tight">
        <div className="s-wrap s-center">
          <p className="s-sub">
            Still stuck? Email <a className="s-textlink" style={{ height: "auto", padding: 0 }} href="mailto:jake@trusttrade.au">jake@trusttrade.au</a>. A real person answers.
          </p>
        </div>
      </section>
    </PageShell>
  );
}
