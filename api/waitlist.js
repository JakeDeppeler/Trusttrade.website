import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { createHash } from "node:crypto";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const RESEND_FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "Trust Trade <noreply@trusttrade.au>";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const POSTCODE_RE = /^[0-9]{4}$/;
// Phone: allow digits, spaces, +, parens, hyphens. 8–20 chars after stripping.
const PHONE_RE = /^[+\d][\d\s\-().]{7,19}$/;

function badRequest(res, message) {
  res.status(400).json({ ok: false, error: message });
}

function hashIp(ip, salt) {
  if (!ip) return null;
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex").slice(0, 32);
}

function buildEmail({ email, role, businessName, name }) {
  const greetingName = (name || "").trim();
  if (role === "tradie") {
    const greeting = greetingName
      ? `G'day ${greetingName},`
      : businessName
      ? `G'day ${businessName} crew,`
      : "G'day,";
    return {
      subject: "You're on the Trust Trade tradie waitlist",
      text: [
        greeting,
        "",
        "Thanks for putting your name down. You're on the founding-tradie list.",
        "",
        "What happens next:",
        "1. We're rolling out invites fortnightly from Q4 2026, starting in Victoria.",
        "2. The day before your invite opens, you'll get an email with a temporary password and a link to download the app.",
        "3. You log in, upload your licence, insurance certificate of currency, ABN and ID. We verify everything with the relevant state regulator within 48–72 hours.",
        "4. Once verified, you're listed. Founding 500 members lock in lifetime founding-member pricing.",
        "",
        "If you've got questions before then, reply to this email — it goes straight to me.",
        "",
        "— Jake",
        "Mech plumber · Founder, Trust Trade®",
        "https://trusttrade.au",
      ].join("\n"),
    };
  }

  const homeownerGreeting = greetingName ? `G'day ${greetingName},` : "G'day,";
  return {
    subject: "You're on the Trust Trade waitlist",
    text: [
      homeownerGreeting,
      "",
      "You're locked in as a homeowner on the Trust Trade waitlist.",
      "",
      "We're rolling out invites fortnightly from Q4 2026, starting in Victoria. Waitlist members get web access first, founding-member pricing, and a verified badge on day one.",
      "",
      "When the app's live we'll email you a download link.",
      "",
      "— Jake",
      "Mech plumber · Founder, Trust Trade®",
      "https://trusttrade.au",
    ].join("\n"),
  };
}

async function sendConfirmationEmail({ email, role, businessName, name }) {
  if (!RESEND_API_KEY) return { skipped: true };
  try {
    const resend = new Resend(RESEND_API_KEY);
    const { subject, text } = buildEmail({ email, role, businessName, name });
    await resend.emails.send({
      from: RESEND_FROM_EMAIL,
      to: email,
      subject,
      text,
    });
    return { sent: true };
  } catch (err) {
    console.error("[waitlist] resend send failed", err);
    return { error: err?.message || "send failed" };
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "method not allowed" });
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error("[waitlist] missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    return res.status(500).json({ ok: false, error: "server not configured" });
  }

  const body = typeof req.body === "string" ? safeParse(req.body) : req.body || {};
  const email = (body.email || "").trim().toLowerCase();
  const role = (body.role || "").trim().toLowerCase();
  const postcode = (body.postcode || "").trim();
  const businessName = (body.businessName || "").trim();
  const phone = (body.phone || "").trim();
  const name = (body.name || "").trim();
  const source = (body.source || req.headers["referer"] || "").toString().slice(0, 200);

  // Common validation
  if (!EMAIL_RE.test(email) || email.length > 254) return badRequest(res, "Please enter a valid email address.");
  if (role !== "homeowner" && role !== "tradie") return badRequest(res, "Please pick homeowner or tradie.");
  if (postcode && !POSTCODE_RE.test(postcode)) return badRequest(res, "Postcode should be 4 digits.");

  // Tradie-specific validation
  if (role === "tradie") {
    if (!businessName || businessName.length < 2) {
      return badRequest(res, "Business name is required for tradies.");
    }
    if (businessName.length > 120) {
      return badRequest(res, "Business name is a bit long — try under 120 characters.");
    }
    if (!phone) {
      return badRequest(res, "We need a mobile so we can reach you when verification starts.");
    }
    if (!PHONE_RE.test(phone)) {
      return badRequest(res, "Please enter a valid phone number.");
    }
  } else if (phone && !PHONE_RE.test(phone)) {
    // Homeowner with optional phone — still validate if provided
    return badRequest(res, "Please enter a valid phone number.");
  }
  if (name && name.length > 80) {
    return badRequest(res, "Name is too long — try under 80 characters.");
  }

  const userAgent = (req.headers["user-agent"] || "").toString().slice(0, 300);
  const ip =
    (req.headers["x-forwarded-for"] || "").toString().split(",")[0].trim() ||
    req.socket?.remoteAddress ||
    "";
  const ipHash = hashIp(ip, SUPABASE_SERVICE_ROLE_KEY);

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  const { error } = await supabase.from("waitlist_signups").insert({
    email,
    role,
    name: name || null,
    postcode: postcode || null,
    business_name: businessName || null,
    phone: phone || null,
    source: source || null,
    user_agent: userAgent || null,
    ip_hash: ipHash,
  });

  if (error) {
    // 23505 = unique_violation — already on the list
    if (error.code === "23505") {
      return res.status(200).json({ ok: true, alreadyOnList: true });
    }
    console.error("[waitlist] insert failed", error);
    return res.status(500).json({ ok: false, error: "could not save signup" });
  }

  const emailResult = await sendConfirmationEmail({ email, role, businessName, name });

  return res.status(200).json({
    ok: true,
    emailSent: emailResult?.sent === true,
  });
}

function safeParse(s) {
  try {
    return JSON.parse(s);
  } catch {
    return {};
  }
}
