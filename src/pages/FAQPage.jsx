import { useEffect, useRef, useState } from "react";
import {
  PageFooter,
  PageHeader,
  PageHero,
  PageWaitlistFooterCTA,
} from "../components/PageChrome.jsx";
import PageLink from "../components/PageLink.jsx";

const FAQ_SECTIONS = [
  {
    id: "general",
    name: "General",
    items: [
      { q: "When does Trust Trade launch?", a: "We're rolling out invites fortnightly from Q4 2026, starting with Victoria. iOS first, Android close behind. Web access opens for waitlist members before the public launch." },
      { q: "Is Trust Trade free for homeowners?", a: "Yes — finding, requesting and booking a tradie is free. You only ever pay the tradie's quoted call-out fee, and only once you've approved it in writing. There's no Trust Trade surcharge on top." },
      { q: "Where are you operating?", a: "Starting in Victoria — Melbourne metro, Geelong, and Gippsland (yes, including Pakenham). NSW, QLD and SA in the months after launch. If you're outside these, join the waitlist and we'll email you when your state opens." },
      { q: "Why 'Trust Trade'?", a: "Because the two biggest things missing from finding a tradie online were trust and a clear paper trail. We picked a name that put both up front. The ® is registered in Australia." },
      { q: "How is this different from existing platforms?", a: "Three big differences: tradies are verified before they're listed (not just signed up); we don't sell leads (no race-to-the-bottom bidding); and every job leaves a real receipt. We charge tradies nothing to be listed at launch." },
    ],
  },
  {
    id: "homeowners",
    name: "Homeowners",
    items: [
      { q: "How do you verify tradies?", a: "Four checks at apply: licence number verified with the state regulator, public liability + workers' comp on file, ABN active and not on hold, no active disciplinary action. Plus photo-ID-to-licence match and two reference jobs we phone. Full breakdown on the How we verify page." },
      { q: "What if it goes wrong on the day?", a: "Tap the help button in the job. A human reads the thread and gets back to both sides within an hour (business hours). For real disputes — wrong work, no-show, billing problems — we mediate within 48 hours between verified accounts." },
      { q: "Do I pay through the app?", a: "No, you pay your tradie direct. Trust Trade isn't an escrow. But the booking record — call-out fee, ETA, address, ABN — is logged in the app and emailed to both sides as a receipt." },
      { q: "Does the AI replace talking to a real tradie?", a: "Nope. The AI's job is to work out which trade you actually need from a plain-English description — then point you at verified humans. The fix-it bit is still done by a real, insured person on site." },
      { q: "Can I cancel a booking?", a: "Yes — reschedule or cancel free up to 1 hour before the agreed ETA. Inside that window, a small cancellation fee may apply to cover the tradie's travel and time. The fee is set by the tradie and disclosed before you book." },
      { q: "What if I get quoted more on the day?", a: "Call-out fee is locked. Any work beyond the call-out — replacement parts, additional jobs uncovered on site — must be quoted again in the app before it starts. You approve it; only then can they proceed." },
      { q: "I left a review I regret. Can I edit it?", a: "You can edit within 24 hours of posting. After that, it's locked, but tradies can post a public reply underneath. We don't delete reviews on request — the integrity of the system depends on them sticking." },
    ],
  },
  {
    id: "tradies",
    name: "Tradies",
    items: [
      { q: "What does it cost to join as a tradie?", a: "Free to apply, free to be listed at launch. Founding members (the first 50 verified tradies) lock in lifetime founding-member pricing on any future paid tiers. Standard fees come in after public launch in 2027." },
      { q: "Do you take a cut of my job?", a: "No. Trust Trade doesn't sit between you and your customer's money. You invoice them direct, you get paid direct. We're the paper trail and the routing layer — not a middleman." },
      { q: "How do I get verified?", a: "Apply via the waitlist, upload your licence, insurance certificate of currency, ABN, and ID. We check with the relevant state regulator and confirm the documents. Two reference jobs (two past customers willing to vouch in writing). Usually 48-72 hours end to end." },
      { q: "Can I set my own call-out fee?", a: "Yes — per job, every job. Your default rate is saved, but you can override it on any specific job before sending. No platform-set minimums, no algorithmic discount." },
      { q: "What if I want to take a few weeks off?", a: "Switch yourself to Unavailable in the app. No jobs route to you. Switch back on whenever. No lock-in, no penalty, no clawback." },
      { q: "Can I be on multiple lead-gen platforms at once?", a: "Yeah, that's your call. We don't ask for exclusivity. Most tradies in our beta run us alongside one other platform during launch and drop the other once we've ramped." },
      { q: "What trades do you cover?", a: "Thirty-five trades across six categories at launch — wet trades, electrical, building/carpentry, surfaces, outside work, and specialists. Full list on the Trades we cover page. If your trade isn't there, email Jake — we add by request." },
    ],
  },
  {
    id: "trust",
    name: "Trust & safety",
    items: [
      { q: "What if a tradie's licence lapses while they're listed?", a: "Our system tracks expiry on every licence and insurance cert. Seven days before expiry we ping them. The day it lapses, they can't take new jobs until they've uploaded a renewed cert. No 'maybe verified' — it's binary." },
      { q: "Are reviews moderated?", a: "Lightly — we strip out personal contact info, slurs, and obvious fakes. We don't pay-to-bury and we don't delete on request. Tradies get a public right of reply. Disputed reviews go to 48-hour mediation." },
      { q: "What data do you collect about me?", a: "What you need an account for: name, mobile, suburb, the brief on your job. We don't sell it, we don't share it with insurers or banks, we don't on-sell to a third-party CRM. Full breakdown in the Privacy policy." },
      { q: "Is my address shared before I book?", a: "No. Tradies see the suburb and the brief — never your street address — until you've approved their call-out fee. After that, they see the address (because they're showing up). Address is never visible to anyone you didn't approve." },
    ],
  },
  {
    id: "business",
    name: "About the business",
    items: [
      { q: "Who's behind Trust Trade?", a: "Just me. Jake — a mechanical plumber based in Melbourne who started on the tools and now runs the quoting side too. Solo founder, no team, no outside investment. ABN 40 873 784 535, registered in Victoria." },
      { q: "Are you regulated by anyone?", a: "Trust Trade itself is a platform, not a trade. The tradies we list are regulated by their state authority (VBA, ESV, etc.) and we verify against those regulators. Consumer Affairs Victoria oversees us as an Australian Consumer Law-bound business like any other marketplace." },
      { q: "Can I invest / partner / sell into Trust Trade?", a: "We're not raising at the moment. For partnerships — insurance, regulator integrations, trade associations — email jake@trusttrade.au with a one-pager." },
      { q: "Is the name actually trademarked?", a: "Yep — Trust Trade® is a registered Australian trademark in classes 9, 35 and 42 (software, marketplace services, app development). Use of the mark for anything else needs our written nod." },
    ],
  },
];

const ALL_FAQS = FAQ_SECTIONS.flatMap((s) =>
  s.items.map((i) => ({ ...i, sectionId: s.id, sectionName: s.name }))
);

export default function FAQPage() {
  const [query, setQuery] = useState("");
  const [openIds, setOpenIds] = useState({});
  const [activeSection, setActiveSection] = useState("general");

  const filtered = query.trim()
    ? ALL_FAQS.filter((f) =>
        (f.q + " " + f.a).toLowerCase().includes(query.trim().toLowerCase())
      )
    : ALL_FAQS;

  const grouped = FAQ_SECTIONS.map((sec) => ({
    ...sec,
    items: filtered.filter((f) => f.sectionId === sec.id),
  })).filter((sec) => sec.items.length > 0);

  const totalCount = filtered.length;
  const toggle = (id) => setOpenIds((s) => ({ ...s, [id]: !s[id] }));

  const refs = useRef({});
  useEffect(() => {
    const onScroll = () => {
      let best = activeSection;
      let bestTop = Infinity;
      for (const sec of FAQ_SECTIONS) {
        const el = refs.current[sec.id];
        if (!el) continue;
        const top = el.getBoundingClientRect().top;
        if (top < 200 && top > -el.offsetHeight) {
          if (top > -bestTop) {
            best = sec.id;
            bestTop = top;
          }
        }
      }
      if (best !== activeSection) setActiveSection(best);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [activeSection]);

  const scrollToSection = (id) => {
    const el = refs.current[id];
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - 90;
    window.scrollTo({ top, behavior: "smooth" });
  };

  return (
    <>
      <PageHeader current="FAQ.html" />

      <PageHero
        eyebrow="Questions"
        title="You ask."
        italicWord="We answer."
        lede="Everything we've been asked about Trust Trade so far, by homeowners and tradies. Use the search if you've got something specific."
        meta={[
          { k: "Total questions", v: `${ALL_FAQS.length} answered` },
          { k: "Sections", v: FAQ_SECTIONS.map((s) => s.name).join(" · ") },
          { k: "Missing one?", v: "jake@trusttrade.au" },
        ]}
      />

      <section className="page-section">
        <div className="container">
          <div className="two-col">
            <div className="faq-side">
              {FAQ_SECTIONS.map((sec) => (
                <button
                  key={sec.id}
                  className={activeSection === sec.id ? "active" : ""}
                  onClick={() => scrollToSection(sec.id)}
                >
                  — {sec.name}
                </button>
              ))}
            </div>
            <div>
              <div className="faq-search">
                <input
                  type="text"
                  placeholder="Search the FAQ…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
                <div className="count">
                  {totalCount} {totalCount === 1 ? "match" : "matches"}
                </div>
              </div>

              {grouped.length === 0 && (
                <div style={{ padding: "60px 0", textAlign: "center", color: "var(--text-dim)" }}>
                  <h3 className="h-3" style={{ marginBottom: 12 }}>
                    Nothing matches "{query}".
                  </h3>
                  <p>Try a different search, or email jake@trusttrade.au — we'll add it.</p>
                </div>
              )}

              {grouped.map((sec) => (
                <div
                  key={sec.id}
                  id={"faq-" + sec.id}
                  ref={(el) => (refs.current[sec.id] = el)}
                >
                  <div className="faq-section-title">— {sec.name}</div>
                  <div className="faq-grid">
                    {sec.items.map((item, i) => {
                      const id = sec.id + "-" + i;
                      const isOpen = !!openIds[id];
                      const panelId = `faq-a-${id}`;
                      const buttonId = `faq-q-${id}`;
                      return (
                        <div
                          key={id}
                          className={"faq-item " + (isOpen ? "open" : "")}
                        >
                          <button
                            type="button"
                            className="faq-q"
                            id={buttonId}
                            aria-expanded={isOpen}
                            aria-controls={panelId}
                            onClick={() => toggle(id)}
                          >
                            <span>{item.q}</span>
                            <span className="plus" aria-hidden="true">+</span>
                          </button>
                          <div
                            id={panelId}
                            role="region"
                            aria-labelledby={buttonId}
                            className="faq-a"
                          >
                            <div className="faq-a-inner">
                              <div className="faq-a-text">{item.a}</div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="page-section bordered">
        <div className="container">
          <div className="page-nav-prevnext">
            <PageLink href="For Homeowners.html">
              <span>← Previous</span>
              <strong>For Homeowners</strong>
            </PageLink>
            <PageLink href="About.html" className="next">
              <span>Next →</span>
              <strong>About Trust Trade</strong>
            </PageLink>
          </div>
        </div>
      </section>

      <PageWaitlistFooterCTA />
      <PageFooter />
    </>
  );
}
