# Mrinmoy &amp; Co. — Website

A modern, premium redesign of **www.camrinmoy.com** for CA Mrinmoy Pathak.
Hand-coded, dependency-free, fast, responsive, accessible, and built to respect the
**ICAI Code of Ethics** for chartered accountants' websites.

- **Design direction:** white canvas · deep navy-blue accent (`#0B4F8A`) · Inter (headings) + Manrope (body) + IBM Plex Mono (data). Signature device: a "ledger line" system (hairline rules + monospaced line-item indices) that echoes a financial statement.
- **Stack:** plain HTML + one CSS file + one small vanilla-JS file. No build step, no framework, no cookies.

---

## 1. File structure

```
camrinmoy-website/
├── index.html          Home
├── about.html          About the practice / CA Mrinmoy Pathak
├── services.html       6 services (description · benefits · process · CTA) + FAQ
├── work.html           Engagements — anonymised & filterable
├── blog.html           Insights — search + category filter + author + sharing
├── contact.html        Enquiry form + details + map
├── privacy.html        Privacy Policy (review before publishing)
├── terms.html          Terms & Conditions (review before publishing)
├── 404.html            Friendly not-found page
├── robots.txt
├── sitemap.xml
├── site.webmanifest
├── favicon.svg
└── assets/
    ├── css/styles.css  Entire design system (one file, well-commented)
    └── js/main.js      Nav, reveal, accordions, filters, form (one file)
```

Open `index.html` in a browser to preview, or drop the whole folder onto any static host.

---

## 2. Things to fill in before go-live  ⬅️ important

Search the project for the word `TODO` and these placeholders:

| Placeholder | Where | Replace with |
|---|---|---|
| `contact@camrinmoy.com` | every page footer, contact page, `main.js` | the firm's **real email** |
| LinkedIn `href="#"` | every footer + contact page | the firm's **LinkedIn URL** (or delete the icon) |
| Map `iframe` query | `contact.html` | an exact Google Maps pin / embed for the office |
| Portrait image slots | `index.html`, `about.html`, `blog.html` (author) | a **professional portrait** of CA Mrinmoy Pathak (see §3) |
| Blog post links → `business-blogs-hub` | `blog.html` | real article URLs once posts are migrated |
| `Updated Jul 2026` | footers | keep current — ICAI expects a visible "last updated" date |

Optional but recommended: add a **Membership No. / Firm Registration No.** to the About page if the firm wishes (ICAI permits it), and confirm the **year of establishment** if you'd like it shown.

---

## 3. Swapping images (easy by design)

The site currently reuses the three images from the existing website (hosted on GoDaddy's
`img1.wsimg.com` CDN). Each place an image appears is marked with an `IMAGE SLOT` comment.

**To replace an image:** just change the `src="…"` on that `<img>`. Keep the `width`/`height`
attributes roughly proportional (they prevent layout shift), and always write a meaningful `alt`.

**Recommended once you have new photography:**
1. Save a copy of each image into `assets/img/`.
2. Export as **WebP** at ~1600px on the long edge for hero/portrait, ~960px for cards.
3. Point the `src` at the local file, e.g. `src="assets/img/portrait.webp"`.
   Local, optimised images load faster and remove the dependency on the old host.

The hero and card images are shown in a tasteful monochrome/duotone treatment (via CSS
`filter`) so mixed stock photos feel cohesive — a real portrait will still look great in it,
and you can soften the effect in `styles.css` (search `grayscale`) if you prefer full colour.

---

## 4. Making the contact form actually send

By default the form is **backend-free**: on submit it validates, then opens the visitor's
email app pre-filled (via `mailto:`). This works anywhere with zero setup.

To receive submissions **without** the visitor's email app, connect a free form service:

1. Create a form at **Formspree** (formspree.io) or **Web3Forms** (web3forms.com) and copy your endpoint/key.
2. In `assets/js/main.js`, find the block marked *"No backend is wired by default"* and replace the `mailto` line with:

```js
fetch("https://formspree.io/f/XXXXXXXX", {         // ← your Formspree ID
  method: "POST",
  headers: { "Accept": "application/json" },
  body: new FormData(form)
})
.then(function (r) {
  status.classList.add("ok");
  status.textContent = "Thanks — your enquiry has been sent. We'll be in touch shortly.";
  form.reset();
})
.catch(function () {
  status.classList.add("ok");
  status.textContent = "Something went wrong. Please email or WhatsApp us instead.";
});
```

The `name`, `email`, `phone`, `service`, and `message` fields are already named correctly for either service.

---

## 5. ICAI compliance — what was adapted and why

CA firm websites are governed by the ICAI Code of Ethics (pull-model, no solicitation, no
advertising of attainments, strict client confidentiality, no logo for members in practice).
Several items in the original brief conflicted with this, so they were **adapted rather than
dropped**, keeping the premium feel while staying compliant:

- **No testimonials.** Client testimonials would amount to advertisement/solicitation, so the "testimonials" slot was replaced by an ICAI-safe **"How we work"** section built on factual credentials.
- **Portfolio → "Engagements", anonymised.** No client names, no boastful metrics or "results achieved". Work is described generically ("the kind of engagements the practice takes on"), with a confidentiality note.
- **Softened calls to action.** "High-converting" language was replaced with permitted, neutral prompts like **"Request a consultation"** — responding to a specific enquiry is expressly allowed under the pull model.
- **No logo mark.** Members in practice may not use a logo, so the brand is a **typographic wordmark** ("Mrinmoy & Co."), not a graphic logo. (The `favicon.svg` is a simple site icon using the firm initial.)
- **Confidentiality + disclaimer.** Every page carries a footer disclaimer stating the site is informational, not an advertisement or solicitation, and a **"last updated"** date is shown, as ICAI expects.
- **Factual credentials only.** ICAI membership and the IIM Ahmedabad Leadership Development Programme are stated as facts, with no superlatives or comparisons.

**Please still have the firm / a compliance-aware colleague review the final copy**, and remember to **file the website address with ICAI** in the annual form. Guidance evolves (the ICAI updated its advertising/website rules again in Dec 2025), so a quick check against the current Code of Ethics before launch is worthwhile. This README is guidance, not legal advice.

---

## 6. SEO — what's already in place

- Unique `<title>` + meta description per page; canonical URLs; `robots` meta.
- Open Graph + Twitter Card tags on every page.
- **Schema.org JSON-LD:** `AccountingService`/`LocalBusiness` + `Person` (home & about), `OfferCatalog` + `FAQPage` (services), `Blog` (insights), `ContactPage` (contact), and `BreadcrumbList` on inner pages.
- Semantic HTML5, single `<h1>` per page, ordered headings, descriptive `alt` text.
- `sitemap.xml` + `robots.txt` (update the domain if it changes).
- Lazy-loaded images with width/height; `fetchpriority="high"` on the hero image.

**After launch:** submit `sitemap.xml` in Google Search Console, and update every
`https://www.camrinmoy.com/…` URL if the final domain differs.

---

## 7. Performance & production polish (optional)

The site is already lightweight (no frameworks). To squeeze out the last points on
PageSpeed / Core Web Vitals:

- **Minify** `styles.css` and `main.js` for production (e.g. `npx lightningcss styles.css -m -o styles.min.css`, `npx terser main.js -o main.min.js`), and point the pages at the `.min` files. Source files are kept readable here for easy maintenance.
- **Self-host the fonts** (download the Inter / Manrope / IBM Plex Mono woff2 files and serve them locally) to drop the Google Fonts round-trip, or subset them.
- **Convert images to WebP/AVIF** and host locally (see §3).
- Add far-future cache headers for `/assets/*` on your host.
- Enable HTTPS (most hosts do this automatically) — the brief's "secure" requirement.

---

## 8. Editing tips

- **Colours & type** live at the top of `assets/css/styles.css` under `:root` — change once, applies everywhere.
- **Navigation** appears in the `<header>` and `.mobile-menu` of each page; the highlighted item uses `aria-current="page"`.
- **Add an FAQ / service / engagement / post:** copy an existing block in the relevant page and edit the text — the interactivity (accordion, filter, search) is wired by `data-*` attributes, so new blocks work automatically as long as you keep those attributes.
- The blog search matches the `data-search` attribute on each post — keep it filled with relevant keywords.

---

*Built to position the practice as credible, trustworthy and modern — without overstating anything, and within the rules of the profession.*
