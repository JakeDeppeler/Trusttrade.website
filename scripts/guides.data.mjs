/* Content source for the Trust Trade guides / SEO content engine.
   Each guide is rendered to a static page by scripts/gen-guides.mjs.
   Bodies are trusted HTML (authored here, never user input). Keep the tone plain-Aussie,
   accurate for AU/VIC, and always route the reader toward a verified local (a /find link + the app). */

export const UPDATED = "2026-09-26";

/* Reusable pricing note so every cost guide carries the same honest framing. */
const PRICE_NOTE = `<p class="note"><b>Heads up on prices.</b> Every range below is <em>indicative</em> for 2026 and moves with the job, access, time of day and where you are. The number that matters is the one in writing before anyone starts — on Trust Trade the tradie sets a call-out fee and you approve it up front, so there are no surprise invoices.</p>`;

export const GUIDES = [
  /* ---------------------------------------------------------------- 1 */
  {
    slug: "plumber-cost-melbourne",
    category: "Costs & pricing",
    title: "How Much Does a Plumber Cost in Melbourne? (2026 Price Guide)",
    metaTitle: "Plumber Cost in Melbourne (2026) — Call-Out Fees & Job Prices",
    description:
      "What a plumber really costs in Melbourne in 2026 — call-out fees, hourly rates and typical prices for common jobs like blocked drains, burst pipes and hot water systems.",
    readMins: 6,
    takeaways: [
      "Expect a call-out fee of roughly $80–$150, plus $100–$150 an hour once they're on the tools.",
      "Small jobs (a tap washer, a running toilet) usually land $100–$250 all up; a hot water system replacement is the big one at $1,200–$3,500+.",
      "Emergency and after-hours work costs more — sometimes double. Ask whether the quote is business-hours or not.",
      "Always get the price in writing first. A licensed plumber will happily give you one.",
    ],
    intro: `<p>Getting a plumber out shouldn't feel like a lucky dip. Below is a straight-talking guide to what plumbing work actually costs in Melbourne in 2026 — the call-out fee, the hourly rate, and ballpark prices for the jobs people call about most. Use it to sanity-check a quote so you know when a price is fair and when you're being taken for a ride.</p>`,
    sections: [
      {
        h: "The two numbers every plumber quote is built from",
        body: `${PRICE_NOTE}
<p>Almost every plumbing quote comes down to two things:</p>
<ul>
<li><b>The call-out fee</b> — a fixed charge just to send a licensed plumber to your door, usually <b>$80–$150</b> in metro Melbourne. It often covers the first 15–30 minutes.</li>
<li><b>The hourly rate</b> — after that, typically <b>$100–$150 an hour</b>, billed in 15-minute or half-hour blocks, plus any parts.</li>
</ul>
<p>A good operator rolls both into a single up-front price for the job rather than leaving the meter running. If a quote is "hourly, we'll see how we go", ask for a not-to-exceed figure before they start.</p>`,
      },
      {
        h: "Typical Melbourne plumbing prices in 2026",
        body: `<p>Indicative all-up ranges for common jobs (labour + basic parts, business hours):</p>
<table>
<thead><tr><th>Job</th><th>Typical price (2026)</th></tr></thead>
<tbody>
<tr><td>Leaking tap / washer replacement</td><td>$100 – $220</td></tr>
<tr><td>Running or blocked toilet</td><td>$120 – $300</td></tr>
<tr><td>Blocked drain (plunger/snake)</td><td>$150 – $400</td></tr>
<tr><td>Blocked drain (high-pressure jet)</td><td>$300 – $700</td></tr>
<tr><td>Burst or leaking pipe repair</td><td>$200 – $600</td></tr>
<tr><td>Leak detection</td><td>$200 – $450</td></tr>
<tr><td>Toilet supply & install</td><td>$300 – $700</td></tr>
<tr><td>Tap / mixer supply & install</td><td>$180 – $450</td></tr>
<tr><td>Hot water system — repair</td><td>$150 – $600</td></tr>
<tr><td>Hot water system — supply & replace</td><td>$1,200 – $3,500+</td></tr>
<tr><td>Gas appliance / line work (licensed gas)</td><td>$150 – $800+</td></tr>
</tbody>
</table>
<p>Big variables that push a price up: poor access (under the house, in a wall), old or non-standard fittings, premium tapware, and anything urgent or after-hours.</p>`,
      },
      {
        h: "What makes a plumbing quote go up",
        body: `<ul>
<li><b>After-hours & emergencies.</b> Nights, weekends and public holidays can add 50–100% to the call-out.</li>
<li><b>Parts quality.</b> A $40 tap and a $400 designer mixer are the same install labour but a very different invoice.</li>
<li><b>Access.</b> If the pipe's buried, behind tiles or under the slab, expect more time.</li>
<li><b>Diagnosis.</b> Leak detection and camera drain inspections are their own line items.</li>
</ul>`,
      },
      {
        h: "How to not get stung",
        body: `<ul>
<li><b>Get it in writing.</b> A call-out fee and a job price, before work starts. Verbal "she'll be right" quotes are where surprise invoices come from.</li>
<li><b>Check the licence.</b> Plumbing in Victoria must be done by a registered or licensed plumber — you can verify them (see our guide on <a href="/guides/check-tradie-licence-victoria/">checking a tradie's licence in Victoria</a>).</li>
<li><b>Confirm insurance.</b> Public liability protects your home if something goes wrong.</li>
<li><b>Don't pay the full amount up front.</b> A deposit for materials on a big job is normal; the whole lot before they start isn't.</li>
</ul>`,
      },
    ],
    faqs: [
      { q: "How much is a plumber call-out fee in Melbourne?", a: "Usually $80–$150 in metro Melbourne for business hours, often covering the first 15–30 minutes on site. After-hours and emergency call-outs cost more." },
      { q: "How much does a plumber charge per hour in 2026?", a: "Around $100–$150 an hour once they're on the tools, on top of the call-out fee and any parts. Many plumbers prefer to quote a fixed price for the whole job." },
      { q: "Why are emergency plumbers so expensive?", a: "After-hours, weekend and public-holiday work carries penalty rates and can add 50–100% to the call-out. If it's not a true emergency, booking for business hours is cheaper." },
      { q: "Do plumbers give free quotes?", a: "Many will quote for free over the phone or on a photo for straightforward jobs. Anything that needs diagnosis (a hidden leak, a blocked drain) may carry an inspection fee that's credited to the job." },
    ],
    relatedFind: [
      { href: "/find/plumbers-in-melbourne", label: "Plumbers in Melbourne" },
      { href: "/find/plumbers", label: "All verified plumbers" },
    ],
    relatedGuides: ["check-tradie-licence-victoria", "questions-to-ask-before-hiring-a-tradie"],
  },

  /* ---------------------------------------------------------------- 2 */
  {
    slug: "check-tradie-licence-victoria",
    category: "Hiring safely",
    title: "How to Check if a Tradie Is Licensed in Victoria (2026)",
    metaTitle: "Check a Tradie's Licence in Victoria (2026) — VBA, ESV & ABN",
    description:
      "A plain-English guide to checking whether a plumber, electrician or builder is properly licensed and insured in Victoria — the free registers to use and what to ask for.",
    readMins: 5,
    takeaways: [
      "In Victoria, plumbers and builders are checked through the VBA, electricians through Energy Safe Victoria (ESV), and any business through ABN Lookup — all free.",
      "Ask for the licence/registration number and the exact business name, then look them up yourself.",
      "A licence isn't insurance. Confirm current public liability (and workers' comp if they have staff) separately.",
      "Trust Trade does these checks before a tradie is ever listed, so the profile you see is already verified.",
    ],
    intro: `<p>Anyone can call themselves a "tradie". In Victoria, the licensed ones are on public registers you can search for free in a couple of minutes — and doing it before you hand over any money is the single best way to avoid a dodgy job. Here's exactly where to look.</p>`,
    sections: [
      {
        h: "The registers that actually matter in Victoria",
        body: `<table>
<thead><tr><th>Trade</th><th>Who to check with</th><th>What it confirms</th></tr></thead>
<tbody>
<tr><td>Plumbers &amp; gasfitters</td><td>Victorian Building Authority (VBA)</td><td>Registration/licence class &amp; current status</td></tr>
<tr><td>Builders &amp; building trades</td><td>Victorian Building Authority (VBA)</td><td>Registration &amp; the work they're allowed to do</td></tr>
<tr><td>Electricians</td><td>Energy Safe Victoria (ESV)</td><td>Electrical licence &amp; current status</td></tr>
<tr><td>Any business / sole trader</td><td>ABN Lookup (business.gov.au)</td><td>The ABN is active and the name matches</td></tr>
</tbody>
</table>
<p>These are the same bodies Trust Trade verifies every tradie against before they're listed — so a verified profile has already cleared these checks.</p>`,
      },
      {
        h: "How to do the check in 4 steps",
        body: `<ol>
<li><b>Get the details.</b> Ask for the licence or registration number, the licence holder's name, and the exact business/trading name.</li>
<li><b>Search the right register.</b> Plumber or builder → VBA. Electrician → ESV. Then run the ABN through ABN Lookup.</li>
<li><b>Match the name.</b> The name on the licence should match the person doing your work or their business. A licence that belongs to someone else on site is a red flag.</li>
<li><b>Check it's current.</b> Licences expire and can be suspended. "Current" is what you want to see.</li>
</ol>`,
      },
      {
        h: "A licence isn't the same as insurance",
        body: `<p>Two different protections, and you want both:</p>
<ul>
<li><b>Licence / registration</b> — proves they're legally allowed to do the work to code.</li>
<li><b>Public liability insurance</b> — covers damage to your property if something goes wrong. Ask for a current certificate of currency.</li>
<li><b>Workers' compensation</b> — required if they have employees, and worth confirming for larger jobs.</li>
</ul>
<p>On Trust Trade, licence status and insurance are confirmed and kept on file, so you're not chasing paperwork yourself.</p>`,
      },
      {
        h: "Red flags to walk away from",
        body: `<ul>
<li>Won't give a licence number, or gets cagey when you ask.</li>
<li>Cash-only, no invoice, no ABN.</li>
<li>Pressure to decide on the spot or pay the full amount up front.</li>
<li>A quote far below everyone else's — someone's cutting a corner, and it's usually the licence or the insurance.</li>
</ul>`,
      },
    ],
    faqs: [
      { q: "How do I check if a plumber is licensed in Victoria?", a: "Ask for their registration/licence number and business name, then search the Victorian Building Authority (VBA) register. Confirm the licence is current and the name matches." },
      { q: "How do I check an electrician's licence in Victoria?", a: "Electricians are licensed through Energy Safe Victoria (ESV). Ask for the licence number and look it up on the ESV register to confirm it's current." },
      { q: "Is it illegal to do plumbing or electrical work unlicensed in Victoria?", a: "Yes. Plumbing and electrical work must be carried out by appropriately registered or licensed tradespeople. Unlicensed work can be unsafe, uninsured and hard to get fixed under warranty." },
      { q: "Does Trust Trade check tradie licences?", a: "Yes — every tradie is verified against the relevant body (VBA, ESV, ABN Lookup) and their insurance is confirmed before they appear on the platform." },
    ],
    relatedFind: [
      { href: "/find/plumbers", label: "Verified plumbers" },
      { href: "/find/electricians", label: "Verified electricians" },
    ],
    relatedGuides: ["questions-to-ask-before-hiring-a-tradie", "plumber-cost-melbourne"],
  },

  /* ---------------------------------------------------------------- 3 */
  {
    slug: "questions-to-ask-before-hiring-a-tradie",
    category: "Hiring safely",
    title: "12 Questions to Ask Before You Hire a Tradie",
    metaTitle: "12 Questions to Ask Before Hiring a Tradie (2026 Checklist)",
    description:
      "A practical checklist of the questions that separate a good tradie from a dodgy one — licence, insurance, quotes, timelines and payment — before you commit.",
    readMins: 5,
    takeaways: [
      "The right questions up front prevent almost every bad job — licence, insurance, a written quote and a clear payment plan.",
      "Never pay the full amount before work starts. A materials deposit on a big job is normal; everything isn't.",
      "Get the scope and price in writing so there's a record if things go sideways.",
    ],
    intro: `<p>Most tradie horror stories could've been avoided with five minutes of questions before any money changed hands. Here's the checklist worth running through before you say yes — screenshot it, ask them on the phone, and see how they answer. A good tradie won't mind a single one.</p>`,
    sections: [
      {
        h: "Licence, insurance & who's actually doing the work",
        body: `<ol>
<li><b>Are you licensed for this work, and what's your licence number?</b> (Then check it — see our <a href="/guides/check-tradie-licence-victoria/">Victoria licence-check guide</a>.)</li>
<li><b>Do you have current public liability insurance?</b> Ask for a certificate of currency.</li>
<li><b>Will you be doing the work, or a subcontractor?</b> If it's a sub, are they licensed and insured too?</li>
</ol>`,
      },
      {
        h: "Quote, scope & timeline",
        body: `<ol start="4">
<li><b>Can I get the quote in writing?</b> Verbal quotes are where disputes start.</li>
<li><b>Is this a fixed price or an estimate?</b> If hourly, what's the not-to-exceed figure?</li>
<li><b>What's included — and what isn't?</b> Rubbish removal, materials, making good, GST.</li>
<li><b>When can you start and how long will it take?</b> Get a realistic window, not "next week" forever.</li>
<li><b>Who cleans up and disposes of waste?</b> Assume nothing.</li>
</ol>`,
      },
      {
        h: "Payment, warranty & proof",
        body: `<ol start="9">
<li><b>What's the payment schedule?</b> A deposit for materials is normal; the full amount up front is not.</li>
<li><b>Do you provide a tax invoice with your ABN?</b> No ABN, no invoice = walk away.</li>
<li><b>What warranty or guarantee comes with the work?</b> Get it in writing.</li>
<li><b>Can I see recent reviews or a couple of similar jobs?</b> Real, recent, and ideally from confirmed customers — not anonymous five-stars.</li>
</ol>`,
      },
      {
        h: "The easy way to skip most of this",
        body: `<p>The reason we built Trust Trade is that a homeowner shouldn't have to be a detective. Every tradie on the platform is licence-checked and insurance-confirmed before they're listed, reviews come only from real bookings, and the call-out fee is agreed in writing and approved in the app before anyone turns up. You still ask the job-specific questions — but the "are they legit" part is already done.</p>`,
      },
    ],
    faqs: [
      { q: "Should I pay a tradie a deposit before work starts?", a: "A deposit to cover materials on a larger job is normal and reasonable. Paying the full amount before any work is done is not — hold the balance until the job's finished to your satisfaction." },
      { q: "What should be in a tradie's written quote?", a: "The scope of work, what's included and excluded, materials, the total price and whether it's fixed or an estimate, GST, the ABN, and any warranty. Get it before work starts." },
      { q: "How do I know if a tradie's reviews are real?", a: "Look for recent, specific reviews tied to confirmed jobs. On Trust Trade, ratings only come from real bookings on the platform, so you're not reading planted five-stars." },
    ],
    relatedFind: [
      { href: "/find/plumbers", label: "Verified plumbers" },
      { href: "/find/electricians", label: "Verified electricians" },
      { href: "/find/hvac", label: "Verified HVAC & air-con" },
    ],
    relatedGuides: ["check-tradie-licence-victoria", "plumber-cost-melbourne"],
  },

  /* ---------------------------------------------------------------- 4 */
  {
    slug: "electrician-cost-australia",
    category: "Costs & pricing",
    title: "Electrician Call-Out Fees & Costs in Australia (2026)",
    metaTitle: "Electrician Cost in Australia (2026) — Call-Out Fees & Job Prices",
    description:
      "What an electrician costs in Australia in 2026 — call-out fees, hourly rates and typical prices for powerpoints, downlights, switchboard upgrades and safety switches.",
    readMins: 6,
    takeaways: [
      "A typical electrician call-out is $80–$150, with hourly rates around $90–$140 once on site.",
      "Small jobs (a powerpoint, a light swap) are often $130–$300; a switchboard upgrade is the big one at $800–$2,500+.",
      "Anything involving your meter box or switchboard is licensed work — never DIY it, and never let an unlicensed 'mate' do it.",
      "After-hours and emergency call-outs cost more; ask whether a quote is business-hours.",
    ],
    intro: `<p>Electrical work is one job you never want to cheap out on — get it wrong and it's a fire or a shock, not just a leak. Here's what electricians actually charge across Australia in 2026, so you can tell a fair quote from a rip-off, and know which jobs are strictly for a licensed spark.</p>`,
    sections: [
      {
        h: "Call-out fees and hourly rates",
        body: `${PRICE_NOTE}
<p>Like plumbing, an electrician's quote is usually a <b>call-out fee</b> of <b>$80–$150</b> plus an <b>hourly rate</b> of roughly <b>$90–$140</b>, or a fixed price for the whole job. Emergency and after-hours work carries penalty rates.</p>`,
      },
      {
        h: "Typical electrical prices in 2026",
        body: `<table>
<thead><tr><th>Job</th><th>Typical price (2026)</th></tr></thead>
<tbody>
<tr><td>Extra powerpoint / GPO</td><td>$130 – $300</td></tr>
<tr><td>Swap a light fitting</td><td>$80 – $180</td></tr>
<tr><td>Supply &amp; install downlights (each)</td><td>$80 – $150</td></tr>
<tr><td>Ceiling fan install</td><td>$150 – $350</td></tr>
<tr><td>Safety switch (RCD) install</td><td>$150 – $350</td></tr>
<tr><td>Smoke alarm (hard-wired, each)</td><td>$120 – $250</td></tr>
<tr><td>Switchboard upgrade</td><td>$800 – $2,500+</td></tr>
<tr><td>Fault finding / diagnosis</td><td>$150 – $400</td></tr>
<tr><td>EV charger install</td><td>$800 – $2,000+</td></tr>
<tr><td>Full rewire (per room, guide only)</td><td>$400 – $1,200</td></tr>
</tbody>
</table>
<p>Prices climb with access (crawling through a roof cavity), the age of the wiring, and how much needs bringing up to current standards while they're in there.</p>`,
      },
      {
        h: "Jobs that are licensed-only (don't DIY)",
        body: `<p>In Australia, most fixed electrical work is licensed-only for good reason. Leave these to a licensed electrician every time:</p>
<ul>
<li>Anything in the switchboard or meter box.</li>
<li>New or moved wiring, powerpoints or light points.</li>
<li>Hard-wired appliances, hot water, air-con and EV chargers.</li>
<li>Safety switches and smoke alarms.</li>
</ul>
<p>Swapping a plug-in appliance or a lamp is fine. Touching the fixed wiring is not — and unlicensed electrical work voids insurance and can be deadly.</p>`,
      },
      {
        h: "Getting a fair price",
        body: `<ul>
<li><b>Bundle jobs.</b> Because you're paying a call-out, doing the powerpoint, the downlights and the fan in one visit is far cheaper than three.</li>
<li><b>Get it in writing.</b> A fixed quote beats "we'll see how we go".</li>
<li><b>Check the licence.</b> Electricians in Victoria are licensed through Energy Safe Victoria — see our <a href="/guides/check-tradie-licence-victoria/">licence-check guide</a>.</li>
<li><b>Confirm insurance.</b> Public liability, on file, current.</li>
</ul>`,
      },
    ],
    faqs: [
      { q: "How much does an electrician cost per hour in Australia?", a: "Around $90–$140 an hour once on site, on top of a call-out fee of roughly $80–$150. Many electricians prefer to quote a fixed price for the whole job." },
      { q: "How much to add a powerpoint?", a: "A new powerpoint (GPO) is typically $130–$300 installed, depending on access and how far it is from existing wiring. Doing several in one visit brings the per-point cost down." },
      { q: "How much is a switchboard upgrade?", a: "Usually $800–$2,500+ depending on the size of the board, how much rewiring is needed and whether safety switches are added. It's one of the bigger electrical jobs a home will need." },
      { q: "Can I do my own electrical work in Australia?", a: "No. Fixed electrical work must be done by a licensed electrician. You can replace plug-in items and lamps, but anything involving the fixed wiring, switchboard or meter is licensed-only — and DIY can void your insurance." },
    ],
    relatedFind: [
      { href: "/find/electricians", label: "Verified electricians" },
      { href: "/find/electricians-in-melbourne", label: "Electricians in Melbourne" },
    ],
    relatedGuides: ["check-tradie-licence-victoria", "questions-to-ask-before-hiring-a-tradie"],
  },
];
