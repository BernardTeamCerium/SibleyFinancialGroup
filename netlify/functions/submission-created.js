/**
 * Netlify event-triggered function: runs automatically whenever any Netlify
 * form on this site is submitted. Sends the person who filled the form a
 * confirmation email via Resend.
 *
 * The filename is significant — Netlify fires the "submission-created" event
 * at the function of the same name. Do not rename it.
 *
 * Environment variables (set in Netlify: Site configuration → Environment variables)
 *   RESEND_API_KEY  required — from resend.com/api-keys
 *   FROM_EMAIL      required — e.g. "Sibley Financial Group <hello@sibleyfinancialgroup.com>"
 *                   The domain must be verified in Resend or sending will fail.
 *   REPLY_TO        optional — where replies go, defaults to FROM_EMAIL
 *   SITE_URL        optional — used for the crest image in the email
 *
 * No npm dependencies: Resend is called over plain fetch, so the site still
 * needs no build step.
 */

'use strict';

const FIRM = 'Sibley Financial Group';
const PHONE_DISPLAY = '(985) 231-2167';
const PHONE_HREF = '+19852312167';

/* --------------------------------------------------------------- content - */
/* One entry per Netlify form name. `contact` is also the fallback. */
const MESSAGES = {
  contact: {
    subject: `Thank you for contacting ${FIRM}`,
    heading: 'Thank you for getting in touch',
    body: [
      'Someone from Sibley Financial Group will reach out to you shortly to discuss your inquiry and set a time to speak with one of our award-winning advisors.',
      'If your question is time-sensitive, please call us directly rather than waiting — we would rather hear from you than have you wonder.',
    ],
  },
  referral: {
    subject: `Thank you for the introduction — ${FIRM}`,
    heading: 'That means a great deal',
    body: [
      'Thank you for thinking of us. Putting your name behind an introduction is not a small thing, and we will treat it that way.',
      'Someone from Sibley Financial Group will reach out to you shortly — either with a note you can forward, or to let you know we have made contact.',
    ],
  },
  'event-rsvp': {
    subject: `Your seats are requested — ${FIRM}`,
    heading: "You're on the list",
    body: [
      'Thank you for registering for our client appreciation event. Someone from Sibley Financial Group will reach out to you shortly to confirm your seats.',
      'We will send exact seats, gate entry and parking details the week of the game. If your plans change, just let us know so we can offer the seat to someone else.',
    ],
  },
  'gift-claim': {
    subject: `Your gift is on its way — ${FIRM}`,
    heading: 'Thank you — we have your request',
    body: [
      'Thank you for letting us say thank you. Someone from Sibley Financial Group will reach out to you shortly if we need anything to complete your order.',
      'Most gifts arrive within two weeks. If anything about your delivery address needs changing, just call and we will sort it.',
    ],
  },
};

/* ----------------------------------------------------------- templating - */
const escapeHtml = (s) =>
  String(s).replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function renderHtml({ heading, body, name, siteUrl }) {
  const greeting = name ? `Hello ${escapeHtml(name.split(' ')[0])},` : 'Hello,';
  const paragraphs = body
    .map((p) => `<p style="margin:0 0 16px;font-size:16px;line-height:1.65;color:#414d5c;">${escapeHtml(p)}</p>`)
    .join('');

  /* Table layout and inline styles: email clients ignore stylesheets, and
     many strip <style> blocks entirely. */
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(heading)}</title></head>
<body style="margin:0;padding:0;background:#f8f6f1;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(body[0]).slice(0, 110)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f8f6f1;padding:28px 12px;">
  <tr><td align="center">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
           style="max-width:560px;background:#ffffff;border:1px solid #d5dae3;border-radius:6px;overflow:hidden;">
      <tr><td style="background:#0a2044;padding:26px 28px;text-align:center;">
        <img src="${escapeHtml(siteUrl)}/assets/img/icon-180.png" width="54" height="54" alt=""
             style="display:block;margin:0 auto 10px;border:0;">
        <div style="font-family:Georgia,'Times New Roman',serif;font-size:21px;letter-spacing:.09em;color:#ffffff;">SIBLEY</div>
        <div style="font-family:Arial,Helvetica,sans-serif;font-size:9px;letter-spacing:.26em;color:#bdc4d0;margin-top:5px;">FINANCIAL GROUP</div>
      </td></tr>
      <tr><td style="height:3px;line-height:3px;font-size:0;background:#b81020;">&nbsp;</td></tr>
      <tr><td style="padding:32px 28px 8px;font-family:Arial,Helvetica,sans-serif;">
        <h1 style="margin:0 0 18px;font-family:Georgia,'Times New Roman',serif;font-size:25px;line-height:1.25;color:#0a2044;font-weight:600;">${escapeHtml(heading)}</h1>
        <p style="margin:0 0 16px;font-size:16px;line-height:1.65;color:#414d5c;">${greeting}</p>
        ${paragraphs}
      </td></tr>
      <tr><td style="padding:10px 28px 32px;" align="center">
        <a href="tel:${PHONE_HREF}" style="display:inline-block;background:#b81020;color:#ffffff;text-decoration:none;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:bold;letter-spacing:.04em;text-transform:uppercase;padding:14px 28px;border-radius:3px;">Call ${PHONE_DISPLAY}</a>
      </td></tr>
      <tr><td style="padding:0 28px 26px;">
        <div style="border-top:1px solid #e9ecf1;padding-top:18px;font-family:Georgia,'Times New Roman',serif;font-style:italic;font-size:15px;color:#123a69;text-align:center;">Esse Quam Videri &mdash; to be, rather than to seem.</div>
      </td></tr>
      <tr><td style="background:#f4f6f9;border-top:1px solid #e9ecf1;padding:20px 28px;font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:1.6;color:#66707d;">
        <p style="margin:0 0 9px;">${FIRM}, powered by Allied Elite Financial &middot; Mandeville, Louisiana &middot; <a href="tel:${PHONE_HREF}" style="color:#123a69;">${PHONE_DISPLAY}</a></p>
        <p style="margin:0 0 9px;">Professional recognitions and industry awards are based on criteria set by the issuing organisation. They are not indicative of future performance, do not guarantee any particular result, and should not be construed as an endorsement by any client.</p>
        <p style="margin:0;">This email is a confirmation of your enquiry and does not constitute investment, insurance, tax or legal advice, nor an offer to sell any product. Please do not send account numbers or other sensitive information by email.</p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`;
}

function renderText({ heading, body, name }) {
  const greeting = name ? `Hello ${name.split(' ')[0]},` : 'Hello,';
  return [
    heading.toUpperCase(), '', greeting, '', ...body, '',
    `Call us: ${PHONE_DISPLAY}`, '',
    'Esse Quam Videri - to be, rather than to seem.', '',
    '--',
    `${FIRM}, powered by Allied Elite Financial`,
    `Mandeville, Louisiana | ${PHONE_DISPLAY}`, '',
    'Professional recognitions and industry awards are based on criteria set by the',
    'issuing organisation. They are not indicative of future performance, do not',
    'guarantee any particular result, and should not be construed as an endorsement',
    'by any client.', '',
    'This email is a confirmation of your enquiry and does not constitute investment,',
    'insurance, tax or legal advice, nor an offer to sell any product. Please do not',
    'send account numbers or other sensitive information by email.',
  ].join('\n');
}

/* ------------------------------------------------------------- sending - */
async function sendViaResend({ to, subject, html, text }) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.FROM_EMAIL,
      to: [to],
      reply_to: process.env.REPLY_TO || undefined,
      subject,
      html,
      text,
    }),
  });
  const detail = await res.text();
  if (!res.ok) throw new Error(`Resend responded ${res.status}: ${detail}`);
  return detail;
}

/* ------------------------------------------------------------- handler - */
exports.handler = async (event) => {
  // Never fail the submission itself: Netlify has already stored it, and a
  // non-200 here only produces noise. Log and move on.
  const ok = (note) => ({ statusCode: 200, body: note });

  let payload;
  try {
    payload = JSON.parse(event.body || '{}').payload || {};
  } catch (err) {
    console.error('submission-created: could not parse payload', err);
    return ok('unparseable payload');
  }

  const formName = payload.form_name || '';
  const data = payload.data || {};
  const to = (payload.email || data.email || '').trim();
  const name = (data.name || '').trim();

  if (!to) {
    console.log(`submission-created: no email address on form "${formName}", nothing to send`);
    return ok('no recipient');
  }
  if (!process.env.RESEND_API_KEY || !process.env.FROM_EMAIL) {
    console.error('submission-created: RESEND_API_KEY or FROM_EMAIL is not set — see README');
    return ok('not configured');
  }

  const copy = MESSAGES[formName] || MESSAGES.contact;
  const siteUrl = (process.env.SITE_URL || process.env.URL || '').replace(/\/$/, '');
  const fields = { ...copy, name, siteUrl };

  try {
    await sendViaResend({
      to,
      subject: copy.subject,
      html: renderHtml(fields),
      text: renderText(fields),
    });
    console.log(`submission-created: confirmation sent for "${formName}"`);
    return ok('sent');
  } catch (err) {
    console.error(`submission-created: send failed for "${formName}" —`, err.message);
    return ok('send failed');
  }
};

// exported for the local test harness
module.exports._internals = { MESSAGES, renderHtml, renderText };
