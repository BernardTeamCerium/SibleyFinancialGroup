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
 *   NOTIFY_EMAIL    optional — team address(es) told about each submission,
 *                   comma-separated. Omit and no internal alert is sent.
 *   CRM_WEBHOOK_URL optional — submissions are POSTed here as JSON. Works with
 *                   Zapier/Make catch hooks and most CRM inbound endpoints.
 *   CRM_AUTH_HEADER optional — sent as Authorization, e.g. "Bearer abc123"
 *   CRM_AUTH_NAME   optional — use a different header name, e.g. "x-api-key"
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
      "Someone from Troy's team will be calling you shortly to schedule a meeting with Troy Sibley, our President and Founder.",
      'If your question is time-sensitive, please call us directly rather than waiting — we would rather hear from you than have you wonder.',
    ],
    // Only the enquiry email introduces Troy: the other forms are filled in by
    // people who already know him.
    intro: {
      eyebrow: 'Who you will be meeting',
      name: 'C. Troy Sibley',
      role: 'President & Founder',
      strapline: 'Twenty-five years advising families and business owners across Louisiana.',
      bio: [
        'Troy founded Sibley Financial Group in 2000 and has spent twenty-five years helping families and business owners across Louisiana retire with confidence. His work concentrates on safe growth tied to the market, retirement and estate planning, and protecting wealth that took a lifetime to build.',
        'He was named the youngest district manager at Union National, a Kemper company, and has since been recognised as a Top Advisor and Regional Agent of the Year by Transamerica Life and Lincoln Heritage Life. In 2025 he was inducted into the Marquis Who\u2019s Who network of Emerging Leaders.',
      ],
      beliefsTitle: 'What he believes',
      beliefs: [
        'Substance over appearance. A plan that only looks good on a brochure does not leave the office.',
        'Protection first, then growth. Income you depend on should not be exposed to a market you cannot control.',
        'Plain English. If a strategy cannot be explained in one page, it is not the right strategy.',
        'A written plan, not a verbal one. You leave with something you can hand to your spouse, your CPA or your attorney.',
      ],
    },
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

function renderHtml({ heading, body, name, siteUrl, intro }) {
  const greeting = name ? `Hello ${escapeHtml(name.split(' ')[0])},` : 'Hello,';
  const paragraphs = body
    .map((p) => `<p style="margin:0 0 16px;font-size:16px;line-height:1.65;color:#414d5c;">${escapeHtml(p)}</p>`)
    .join('');

  /* Optional introduction to the advisor. Omitted unless the form's copy
     carries one, so existing clients are not introduced to someone they
     already know. */
  /* Photograph beside his name rather than above it. A two-column table is
     the only side-by-side layout email can be trusted with — there is no
     flexbox, and floats drop out in Outlook. The photo is kept narrow and
     only the name and role sit next to it, so the pairing still holds at
     320px; the bio runs full width underneath where it has room to breathe. */
  const introBlock = !intro ? '' : `
      <tr><td style="padding:4px 28px 0;">
        <div style="border-top:1px solid #e9ecf1;padding-top:24px;"></div>
      </td></tr>
      <tr><td style="padding:0 28px 4px;font-family:Arial,Helvetica,sans-serif;">
        <div style="font-size:11px;font-weight:bold;letter-spacing:.2em;text-transform:uppercase;color:#1b4c86;margin-bottom:14px;">${escapeHtml(intro.eyebrow)}</div>
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
          <tr>
            <td width="112" valign="top" style="width:112px;padding-right:16px;">
              <img src="${escapeHtml(siteUrl)}/assets/img/troy-sibley-headshot.jpg" width="112" height="140"
                   alt="${escapeHtml(intro.name)}, ${escapeHtml(intro.role)}"
                   style="display:block;width:112px;height:140px;border:1px solid #d5dae3;border-radius:4px;">
            </td>
            <td valign="middle">
              <div style="font-family:Georgia,'Times New Roman',serif;font-size:21px;line-height:1.2;color:#0a2044;font-weight:600;">${escapeHtml(intro.name)}</div>
              <div style="font-size:10px;font-weight:bold;letter-spacing:.17em;text-transform:uppercase;color:#6c7884;margin-top:6px;">${escapeHtml(intro.role)}</div>
              <div style="margin-top:12px;width:34px;height:2px;background:#b81020;font-size:0;line-height:0;">&nbsp;</div>
              <div style="margin-top:12px;font-size:13px;line-height:1.55;color:#66707d;">${escapeHtml(intro.strapline)}</div>
            </td>
          </tr>
        </table>
      </td></tr>
      <tr><td style="padding:20px 28px 0;font-family:Arial,Helvetica,sans-serif;">
        ${intro.bio.map((t) => `<p style="margin:0 0 14px;font-size:15px;line-height:1.65;color:#414d5c;">${escapeHtml(t)}</p>`).join('')}
      </td></tr>
      <tr><td style="padding:6px 28px 0;font-family:Arial,Helvetica,sans-serif;">
        <div style="background:#f4f6f9;border:1px solid #e9ecf1;border-left:3px solid #b81020;border-radius:0 3px 3px 0;padding:18px 20px;">
          <div style="font-size:11px;font-weight:bold;letter-spacing:.17em;text-transform:uppercase;color:#0c2c52;margin-bottom:12px;">${escapeHtml(intro.beliefsTitle)}</div>
          ${intro.beliefs.map((t) => `<p style="margin:0 0 10px;font-size:14px;line-height:1.6;color:#414d5c;"><span style="color:#b81020;">&#9670;</span>&nbsp; ${escapeHtml(t)}</p>`).join('')}
        </div>
      </td></tr>`;

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
      ${introBlock}
      <tr><td style="padding:22px 28px 32px;" align="center">
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

function renderText({ heading, body, name, intro }) {
  const greeting = name ? `Hello ${name.split(' ')[0]},` : 'Hello,';
  const introLines = !intro ? [] : [
    '', intro.eyebrow.toUpperCase(), '',
    `${intro.name} - ${intro.role}`, intro.strapline, '',
    ...intro.bio.flatMap((t) => [t, '']),
    `${intro.beliefsTitle.toUpperCase()}:`, '',
    ...intro.beliefs.map((t) => `  * ${t}`),
  ];
  return [
    heading.toUpperCase(), '', greeting, '', ...body, ...introLines, '',
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
async function sendViaResend({ to, subject, html, text, replyTo }) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.FROM_EMAIL,
      to: Array.isArray(to) ? to : [to],
      reply_to: replyTo || process.env.REPLY_TO || undefined,
      subject,
      html,
      text,
    }),
  });
  const detail = await res.text();
  if (!res.ok) throw new Error(`Resend responded ${res.status}: ${detail}`);
  return detail;
}

/* ------------------------------------------------- internal notification - */
const FORM_LABELS = {
  contact: 'contact enquiry',
  referral: 'referral',
  'event-rsvp': 'event registration',
  'gift-claim': 'gift claim',
};

/* Fields that are plumbing rather than content, and must not be shown. */
const SKIP_FIELDS = new Set(['form-name', 'company_website', 'consent']);

function renderNotification({ formName, data, submittedAt }) {
  const label = FORM_LABELS[formName] || formName || 'form';
  const rows = Object.entries(data)
    .filter(([k, v]) => !SKIP_FIELDS.has(k) && String(v || '').trim() !== '')
    .map(([k, v]) => {
      const key = escapeHtml(k.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()));
      return `<tr>
        <td style="padding:9px 14px;border-bottom:1px solid #e9ecf1;font-size:12px;font-weight:bold;letter-spacing:.06em;text-transform:uppercase;color:#6c7884;white-space:nowrap;vertical-align:top;">${key}</td>
        <td style="padding:9px 14px;border-bottom:1px solid #e9ecf1;font-size:14px;color:#131b26;">${escapeHtml(v).replace(/\n/g, '<br>')}</td>
      </tr>`;
    }).join('');

  const html = `<!doctype html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:24px 12px;background:#f8f6f1;font-family:Arial,Helvetica,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:580px;background:#ffffff;border:1px solid #d5dae3;border-radius:6px;overflow:hidden;">
  <tr><td style="background:#0a2044;padding:16px 20px;color:#ffffff;font-size:13px;font-weight:bold;letter-spacing:.14em;text-transform:uppercase;">New ${escapeHtml(label)}</td></tr>
  <tr><td style="height:3px;line-height:3px;font-size:0;background:#b81020;">&nbsp;</td></tr>
  <tr><td style="padding:18px 20px 6px;font-size:13px;color:#66707d;">Received ${escapeHtml(submittedAt)}</td></tr>
  <tr><td style="padding:0 20px 20px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #e9ecf1;border-radius:4px;">${rows}</table></td></tr>
  <tr><td style="padding:0 20px 22px;font-size:12px;color:#66707d;">Reply to this email to answer them directly. A confirmation has already gone to the person who submitted it.</td></tr>
</table></td></tr></table></body></html>`;

  const text = [
    `NEW ${label.toUpperCase()}`, `Received ${submittedAt}`, '',
    ...Object.entries(data)
      .filter(([k, v]) => !SKIP_FIELDS.has(k) && String(v || '').trim() !== '')
      .map(([k, v]) => `${k.replace(/_/g, ' ')}: ${v}`),
    '', 'Reply to this email to answer them directly.',
  ].join('\n');

  return { subject: `New ${label}${data.name ? ` — ${data.name}` : ''}`, html, text };
}

/* -------------------------------------------------------------- the CRM - */
/* A plain JSON POST, which every CRM inbound endpoint and every Zapier or
   Make catch hook accepts. Both the tidied fields and the raw submission go
   out, so whatever is on the other end can map what it needs. */
async function postToCrm({ formName, data, submittedAt, payload }) {
  const headers = { 'Content-Type': 'application/json' };
  if (process.env.CRM_AUTH_HEADER) {
    headers[process.env.CRM_AUTH_NAME || 'Authorization'] = process.env.CRM_AUTH_HEADER;
  }
  const res = await fetch(process.env.CRM_WEBHOOK_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      source: 'sibleyfinancialgroup.com',
      form: formName,
      submitted_at: submittedAt,
      name: data.name || '',
      email: data.email || payload.email || '',
      phone: data.phone || '',
      estimated_assets: data.estimated_assets || '',
      message: data.message || data.context || '',
      fields: data,
    }),
  });
  if (!res.ok) throw new Error(`CRM responded ${res.status}: ${(await res.text()).slice(0, 200)}`);
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
  const submittedAt = new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC';
  const ctx = { formName, data, submittedAt, payload };

  const jobs = [];

  // 1. confirmation to the person who filled the form in
  jobs.push(['confirmation', sendViaResend({
    to, subject: copy.subject, html: renderHtml(fields), text: renderText(fields),
  })]);

  // 2. alert to the team, with reply-to set to the enquirer so a reply just works
  if (process.env.NOTIFY_EMAIL) {
    const note = renderNotification(ctx);
    jobs.push(['team notification', sendViaResend({
      to: process.env.NOTIFY_EMAIL.split(',').map((x) => x.trim()).filter(Boolean),
      subject: note.subject, html: note.html, text: note.text, replyTo: to,
    })]);
  }

  // 3. hand the submission to the CRM
  if (process.env.CRM_WEBHOOK_URL) {
    jobs.push(['CRM', postToCrm(ctx)]);
  }

  // Independent on purpose: a CRM outage must not cost the enquirer their
  // confirmation, and a bounced confirmation must not lose the CRM record.
  const results = await Promise.allSettled(jobs.map(([, p]) => p));
  const done = [];
  results.forEach((r, i) => {
    const label = jobs[i][0];
    if (r.status === 'fulfilled') { done.push(`${label} ok`); }
    else { done.push(`${label} FAILED`); console.error(`submission-created: ${label} failed —`, r.reason && r.reason.message); }
  });
  console.log(`submission-created: "${formName}" — ${done.join(', ')}`);
  return ok(done.join(', '));
};

// exported for the local test harness
module.exports._internals = { MESSAGES, renderHtml, renderText, renderNotification };
