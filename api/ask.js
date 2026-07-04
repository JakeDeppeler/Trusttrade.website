// Live "Ask AI" demo endpoint — routes a plain-English household problem to
// the right trade via Claude. Requires ANTHROPIC_API_KEY in the environment.
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const MODEL = process.env.ASK_MODEL || "claude-haiku-4-5-20251001";

const SYSTEM = `You are the Trust Trade assistant — a friendly Australian helper on a website demo for a members-only marketplace of verified, insured local tradies.

A homeowner describes a household problem in plain English. Your job:
- Work out which trade they actually need (e.g. plumber, gas-fitter, electrician, carpenter, HVAC tech, tiler, roofer, handyman).
- Say the trade clearly, then add one short helpful line (urgency, what to check, or what a verified Trust Trade tradie would do).
- If it's an emergency (gas smell, burst pipe, no power, sparks, smoke), flag it and tell them to prioritise safety first.

Rules: keep replies to 2–3 short sentences, warm and plain. Never give step-by-step DIY repair instructions — the whole point is to route them to a verified local tradie. Australian spelling and tone. If the message isn't about a household job, gently steer back to what trade they might need.`;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ ok: false, error: "Method not allowed" });
    return;
  }

  if (!ANTHROPIC_API_KEY) {
    res.status(200).json({
      ok: true,
      reply:
        "The live assistant isn't switched on yet (no API key set). In the app, I'd read your problem and point you straight at the right verified, insured local tradie.",
    });
    return;
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
    let messages = Array.isArray(body.messages) ? body.messages : [];
    messages = messages
      .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
      .slice(-8)
      .map((m) => ({ role: m.role, content: m.content.slice(0, 1000) }));

    if (!messages.length || messages[messages.length - 1].role !== "user") {
      res.status(400).json({ ok: false, error: "No message." });
      return;
    }

    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({ model: MODEL, max_tokens: 300, system: SYSTEM, messages }),
    });

    if (!r.ok) {
      const text = await r.text();
      console.error("[ask] anthropic error", r.status, text.slice(0, 300));
      res.status(502).json({ ok: false, error: "The assistant is unavailable right now — try again in a moment." });
      return;
    }

    const data = await r.json();
    const reply =
      (data.content || [])
        .filter((c) => c.type === "text")
        .map((c) => c.text)
        .join("")
        .trim() || "Sorry, I didn't catch that — try describing the problem again.";

    res.status(200).json({ ok: true, reply });
  } catch (err) {
    console.error("[ask] failed", err);
    res.status(500).json({ ok: false, error: "Something went wrong." });
  }
}
