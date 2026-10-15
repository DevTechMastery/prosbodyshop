# Pro’s Body Shop & Paint — cinematic concept

Complete Next.js 16 / React 19 / TypeScript strict project for an unofficial, owner-unapproved concept. Optimized in layout for MacBook first, then mobile. No database, authentication, CRM, or CMS.

## Run on your MacBook

Install Node.js 22 LTS or newer, then in this folder:

```sh
npm ci
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000. No API keys are needed to explore the design or vehicle lookup. Without email credentials, development submissions are logged server-side and visibly reported as **not sent**. Use test details only when demonstrating log-only mode.

Production:

```sh
npm run typecheck
npm run lint
npm test
npm run build
npm start
```

## Email setup on Vercel

Import this directory as a Next.js project. Set:

- `RESEND_API_KEY`: your Resend key, server-side only.
- `FROM_EMAIL`: a sender on a domain verified in Resend (not an arbitrary Gmail sender).
- `ESTIMATE_EMAIL`: `prosbodyshop@gmail.com`.

Redeploy after setting variables. The endpoint sends via Resend to the configured inbox, with the customer's email as Reply-To. It includes HTML and plain text, escapes user input, validates all fields, and uses a UTC submission timestamp. No attachments or database writes.

An unconfigured production endpoint returns HTTP 503, never fake success. For an explicitly private development demo, `ESTIMATE_DEMO_MODE=true` enables the log-only HTTP 202 response. Leave that off on a real public deployment. Resend provider acceptance is not proof of Gmail inbox arrival: verify actual delivery and Reply-To with a controlled end-to-end test before launch.

The form has a honeypot, same-origin browser check, payload bounds and input validation. Before opening it to public traffic, configure request-rate protection at the hosting edge; these checks are not a distributed rate limiter.

## 3D art and scroll choreography

The attached business card and sign informed the red/black identity, warm accents, condensed type, large phone number and low, wide car stance. The original uses Veyron-like shapes and badges. This project adapts a licensed concept vehicle with black/red paint and contains no Bugatti badges, stock repair photos, fake reviews or fabricated history.

`components/CarScene.tsx` loads the credited detailed concept model and applies a continuous scroll-driven exterior reveal, studio lighting and black/red materials. Its supplementary chassis rails are illustrative, not an engineering depiction of an actual vehicle.

On desktop, the sticky hero spans 190 viewport-height units. GSAP expands the car scene across the viewport and transitions typography. Scroll position also drives camera movement, a body clipping plane and perspective. The finished body first reveals the structure, then sweeps back over it. Scroll backward to reverse. Pointer response is restrained; no continuous spinning.

Desktop DPR is capped at 1.5; mobile at 1.25. Mobile removes the pinned scroll sequence and uses lower-resolution lighting/shadows/reflections. The scene loads dynamically, stays mounted across scroll and pauses rendering offscreen. Reduced-motion preference disables scroll choreography and continuous animation. A neutral studio loading state appears before 3D is ready; no alternate SVG vehicle is used. Errors and lost WebGL contexts show a clear unavailable state. Visible text and all controls live in HTML.

## Vehicle lookup

The server proxies the free NHTSA vPIC API. Makes come from `GetAllMakes`; that endpoint is not year-specific. Models are filtered using `GetModelsForMakeIdYear` with the selected year and make ID. Responses are cached for one day. Each lookup has a timeout; failures and empty results offer manual entry. Search supports Arrow Up/Down, Enter, Escape, pointer, and touch. Changing year or make clears dependent selections. Older or missing vehicles can use manual entry.

Sources: https://vpic.nhtsa.dot.gov/api/ and https://resend.com/docs/api-reference/emails/send-email

## Main files

- `app/page.tsx`: semantic page structure and verified shop content.
- `app/globals.css`: responsive art direction and reduced-motion states.
- `components/CarScene.tsx`: adapted concept model, continuous reveal and studio.
- `components/HeroCar.tsx`: lazy loading, error boundary, viewport and motion handling.
- `components/Effects.tsx`: reversible GSAP sequences.
- `components/EstimateForm.tsx`, `VehicleSelect.tsx`: form and searchable selectors.
- `app/api/estimate/route.ts`: validated Resend email endpoint.
- `app/api/vehicles/route.ts`: NHTSA proxy.
- `tests/endpoints.test.ts`: isolated route tests; email transport is mocked, never sent.

## Demo and content controls

Metadata and the X-Robots-Tag header are `noindex, nofollow`; these are not access controls. The footer identifies this as an unofficial concept. No business hours, certifications, warranties, partnerships, ratings or completed repair images have been added. Service copy uses only reasonable body/paint services from the supplied brief.

For an approved work gallery later, add a standalone component between the process and brand sections, using owner-supplied images and captions only. No fabricated gallery is shipped.

## Verification limits

TypeScript, ESLint, route tests and the production build are checked during implementation. This environment did not provide a supported browser QA capability, so actual WebGL appearance, device frame rate, browser keyboard interaction and the three viewport screenshots have not been verified. Review at 1512×982, 1440×900 and 390×844 before an owner presentation. No actual Resend email was sent and no public deployment was created.


## Updated car study
The scene now uses the detailed Car Concept mesh by Eric Chadwick / DGG (CC BY 4.0), with black/red material adaptations and omitted plate/emblem meshes. Attribution is included in public/models and linked in the footer. Desktop scroll continuously reveals exterior geometry along the car; internal components remain visible. This is an illustrative concept, not a mechanically accurate repair simulation. Mobile and reduced-motion show the finished vehicle. The local model is approximately 12 MB. Browser visual and frame-rate verification was unavailable in the build environment.


## Estimate photos
The optional photo picker accepts up to 10 JPG, PNG or WebP files (20 MB per original). HEIC users are prompted to export JPG. Each image is re-encoded as JPEG in the browser, up to 1600 pixels on the long edge and 340 KB, with progressive size reduction when required. Re-encoding removes camera metadata. The interface supports local previews, removal, preparation status and clear failures. It submits multipart FormData; do not set Content-Type manually.
The server bounds the streamed request at 3.7 MB, validates file count, individual/combined size and JPEG/PNG/WebP signatures, and sends the photos as Resend attachments with generated safe filenames. Total prepared photos are capped at 3.4 MB to stay below the hosting request limit. No image storage or database is used. Photographs are optional. A Resend API acceptance confirms submission, not final Gmail inbox delivery. Log-only development mode logs attachment names and byte counts, never file contents.
The private static preview demonstrates image preparation locally and does not transmit or store photos. The full Next.js project supplies the multipart endpoint for deployment with configured RESEND_API_KEY, FROM_EMAIL and ESTIMATE_EMAIL.
