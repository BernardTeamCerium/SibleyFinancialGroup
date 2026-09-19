# Sibley Financial Group — Website

A static, dependency-free marketing website for **Sibley Financial Group**, powered by
Allied Elite Financial — an independent retirement planning and wealth management firm
in Mandeville, Louisiana, founded in 2000 by C. Troy Sibley.

The entire site is plain HTML, CSS and vanilla JavaScript. There is no build step, no
framework and no package manager. Open `index.html` in a browser and it works.

---

## ⚠️ Before this site goes live

The site is complete and deployable, but a handful of details could not be verified from
public sources. **Replace these first.**

| What | Where | Current placeholder |
|---|---|---|
| Phone number | Every page (header, footer, contact) | `(985) 000-0000` / `tel:+19850000000` |
| Email address | Every page | `info@sibleyfinancialgroup.com` |
| Street address | `contact.html`, footer, `index.html` JSON-LD | City/state only — no street address |
| Domain name | `<link rel="canonical">`, Open Graph tags, `sitemap.xml`, `robots.txt` | `https://www.sibleyfinancialgroup.com` |
| Contact form endpoint | `contact.html` → `<form action="…">` | `REPLACE_WITH_YOUR_FORM_ENDPOINT` |
| Office hours | Footer, `contact.html` | Mon–Fri, 9:00am–5:00pm CT |
| Headshot of Troy Sibley | `about.html`, `index.html` | Crest plate stands in — see below |

Fastest way to do the first four:

```bash
grep -rn "985) 000-0000\|+19850000000\|sibleyfinancialgroup.com\|REPLACE_WITH" *.html *.xml *.txt
```

### Content that should be verified

The copy on `about.html` was assembled from publicly available sources (LinkedIn, Marquis
Who's Who, press releases). **Please confirm each claim before publishing**, in particular:

- "25 years" / founded 2000
- Youngest district manager at Union National, a Kemper company
- Top Advisor and Regional Agent of the Year — Transamerica Life; Lincoln Heritage Life
- Marquis Who's Who Emerging Leaders, May 2025
- Great Lakes Christian College
- NAFA membership
- The four statistics in the home page stat bar

### Compliance review

`disclosures.html` contains a **starting template** for general, insurance/annuity,
performance, awards, licensing, privacy and accessibility disclosures, plus the standard
footer disclosure on every page. These are reasonable defaults, not legal advice. They
must be reviewed and amended by the firm's compliance supervisor, carriers and counsel to
match actual licensing, registrations, product lines and state requirements before launch.

---

## Adding a headshot

`about.html` and `index.html` both use a `.portrait` block that currently shows the crest
on a navy plate. To swap in a real photograph, replace the inner `<div class="portrait__plate">…</div>`
with:

```html
<img src="assets/img/troy-sibley.jpg" alt="C. Troy Sibley, President and Founder of Sibley Financial Group" width="800" height="1000">
```

A portrait-orientation image around 800×1000px works best (the CSS crops to a 4:5 ratio).

---

## Structure

```
index.html           Home — hero, stats, services, process, advisor, motto, CTA
about.html           Firm story, C. Troy Sibley bio, recognition, values, who we serve
services.html        Six services in detail, plus a plain-language note on compensation
process.html         Four-step planning process and an eight-question FAQ
contact.html         Contact form, direct details, privacy note
disclosures.html     Disclosures, privacy statement, accessibility statement
404.html             Not-found page
site.webmanifest     PWA manifest (icons, theme colour)
robots.txt           Points crawlers at the sitemap
sitemap.xml          All six public pages
assets/css/styles.css   The entire stylesheet (~800 lines, heavily commented)
assets/js/main.js       Nav, scroll reveal, counters, accordion, form validation
assets/img/             Logo variants, icons, social share card
```

Shared header and footer markup is duplicated in each page (normal for a site this size —
no build step to go wrong). If you change a nav item, change it in all seven HTML files.

---

## Branding

Everything is derived from the firm's crest — colours were sampled directly from the logo
artwork, and the ornament (engraved hairlines, the heraldic lozenge on section eyebrows,
the shield-shaped icon plates, the two-tincture rule) echoes its details.

| Token | Value | From |
|---|---|---|
| `--navy-800` | `#0A2044` | Wordmark navy |
| `--navy-700` | `#0C2C52` | Wordmark navy |
| `--royal-700` | `#0A3178` | Azure half of the shield |
| `--crimson-600` | `#B81020` | Gules half of the shield |
| `--silver-200` | `#D5DAE3` | Mantling, helm and griffin |
| `--ivory` | `#F8F6F1` | Ground |

- **Display type:** Cormorant Garamond (a high-contrast serif close to the wordmark)
- **Body type:** Inter
- Both load from Google Fonts via `<link>` in each `<head>`, with system fallbacks.

The motto, *Esse Quam Videri* — "to be, rather than to seem" — is used as the site's
organising idea rather than decoration.

> **Note on the logo artwork:** in the supplied file, the Q in "ESSE QUAM VIDERI" reads
> almost like an O at small sizes. Worth correcting in the source artwork at some point.

### Logo assets

| File | Use |
|---|---|
| `crest-sm.png/.webp` | Header and footer mark (48px) |
| `crest.png/.webp` | Large watermarks, the motto band |
| `logo-lockup.png/.webp` | Full lockup for **light** backgrounds |
| `logo-lockup-reversed.png/.webp` | Full lockup with an ivory wordmark, for **dark** backgrounds |
| `icon-32/180/512.png`, `favicon.ico` | Favicons and app icons |
| `og-image.jpg` | Social sharing card (1200×630) |

All were generated from the original artwork with the white background removed. Each is
served as WebP with a PNG fallback via `<picture>`.

---

## The contact form

Out of the box the form validates in the browser, then falls back to opening the
visitor's email client with the message pre-filled — so nothing is lost before an
endpoint is configured. It also carries a honeypot field to absorb basic bot spam.

To wire it to a real handler, set the `action` on `#contact-form` in `contact.html`:

```html
<!-- Formspree -->
<form ... action="https://formspree.io/f/YOUR_FORM_ID" method="post">

<!-- Netlify Forms -->
<form ... action="/thank-you" method="post" name="contact" data-netlify="true">
```

The JavaScript hands off to a normal form submission as soon as the action no longer
contains `REPLACE_WITH`.

---

## Running it locally

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

## Deploying

Any static host will do — no build command, no server runtime.

- **GitHub Pages:** Settings → Pages → deploy from this branch, root folder
- **Netlify / Vercel / Cloudflare Pages:** no build command; publish directory `.`
- **Traditional hosting:** upload every file, preserving the `assets/` folder structure

After deploying, update the domain in the canonical/Open Graph tags, `sitemap.xml` and
`robots.txt`, then submit the sitemap in Google Search Console.

---

## Accessibility & performance notes

- Semantic landmarks, a skip link, and a labelled primary nav
- Keyboard-operable menu and accordion with correct `aria-expanded` / `aria-controls`
- Visible focus rings, `aria-live` form errors, `aria-invalid` on failed fields
- All animation is suppressed under `prefers-reduced-motion`
- The site is fully readable and usable with JavaScript disabled
- No tracking, no cookies, no third-party scripts (only Google Fonts stylesheets)
- Images carry explicit dimensions and lazy-load below the fold

A print stylesheet is included so a client can print a page cleanly.
