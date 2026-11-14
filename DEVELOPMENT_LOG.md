# OnlineLand — Development Log

## Phase 1 — System Architecture ✅ (12 Nov 2026)

- Architecture, data model, data flows, stack, security model, language/SEO plan and roadmap defined.
- Decisions D1–D6 approved. See `docs/ARCHITECTURE.md`.

## Phase 2 — Project Folder Structure ✅ (12 Nov 2026)

**Completed**

- Repo `nageshpn999-coder/onlineland` connected; new `develop` branch created. `main` (live site) untouched.
- Monorepo with npm workspaces: `apps/web`, `apps/admin`, `apps/android`, `packages/shared`.
- `@onlineland/shared`: brand, locales (te/en), roles, 9 property categories with Telugu labels, statuses, area units, lead stages, collection names.
- `firebase/`: config with dev/prod aliases, deny-all Firestore and Storage rules, empty indexes, emulator ports.
- `.env.example` for website and admin; `.gitignore` blocks env files, service accounts, keystores.
- Docs: `README.md`, `docs/ARCHITECTURE.md`, `docs/LEGACY_SITE.md`.
- (Phase 3 note: TypeScript later pinned to 6.0.x for ESLint compatibility.)

- GitHub Actions CI (`.github/workflows/ci.yml`) runs install, type-check and the emulator check on every push to `develop`.

**Tests**

- `npm install` — passes. `npm audit` reports moderate issues inside `firebase-tools` (developer CLI only, never shipped to users); revisit when firebase-tools updates.
- `npm run typecheck` — passes; a deliberate type error was confirmed to fail it.
- `npm run emulators:check` — run on GitHub Actions (run 43118119374): Auth emulator up; Firestore read/write and Storage read all return 403 under deny-all rules. 4/4 passed.
- Legacy site files on `develop` are identical to `main`; `main` has no new commits.

**Pending (needs Nagesh)**

- Create Firebase projects `onlineland-dev` and `onlineland-prod`, enable Blaze, set budget alert.
- If the console assigns different IDs, update `firebase/.firebaserc`.

## Phase 3 — Website Homepage ✅ (12 Nov 2026)

**Completed**

- `apps/web`: Next.js 16 (App Router, Turbopack) + TypeScript + Tailwind CSS 4 + next-intl 4.
- Telugu-first routing: `/` → `/te`; `/te` and `/en` pre-rendered; choice remembered by cookie.
- Self-hosted fonts: Anek Telugu (headings), Noto Sans Telugu (text) — no Google Fonts request.
- Homepage sections: header (nav, language switch, WhatsApp, mobile menu without JS), hero with survey-map illustration, search panel, 9 category tiles, 6 featured properties, services, sell-your-property band, footer.
- Search is a plain GET form (works before JavaScript loads) → `/[locale]/properties`, which shows the visitor's search and sends it to WhatsApp until real listings arrive in Phase 5.
- All WhatsApp buttons open wa.me/919959731120 with a pre-filled Telugu/English message.
- SEO basics: per-language title/description, canonical + hreflang (te/en), Open Graph, theme colour, favicon. `/properties` is `noindex` until it has listings.
- Shared package: imports made extension-less for the Next.js bundler.
- TypeScript pinned to 6.0.x (ESLint's TypeScript plugin does not support 7.0 yet).
- CI now also runs lint and the website production build.

**Sample content (clearly marked)**

- Featured properties are design samples (`src/data/sample-properties.ts`) with a "నమూనా / Sample" badge and a note above the grid. Replaced by approved Firestore listings in Phase 5.
- Property pictures are drawn illustrations until real photos come from Firebase Storage.
- The hero map is an illustration captioned "నమూనా మ్యాప్ / Sample map".

**Tests**

- `npm run typecheck`, `npm run lint`, `next build` — all pass.
- Screenshots checked at 1440 px (te, en) and 390 px mobile (te): no horizontal overflow, no console errors.
- Search flow (mobile): switching to Rent changes budget options; submit → `/te/properties?purpose=rent&type=rental&q=…&budget=0-10000`; summary chips and WhatsApp message carry the search.
- Language switch `/te` → `/en` keeps the page; keyboard focus ring visible.
- Reduced-motion users see the map without animation.

**Pending**

- Blog link points to the live `https://onlineland.in/blog.html` until the old site is copied into `public/` (Phase 8).
- Firebase projects `onlineland-dev` / `onlineland-prod` (needed for Phase 4).

## Phase 4 — Firebase Backend ✅ (14 Nov 2026, on emulators)

**Completed**

- `packages/shared/src/models.ts`: typed shapes for users, favorites, properties (+ media, private contact), locations, leads, site visits, plans, subscriptions, audit logs.
- `firebase/firestore.rules`: roles from Auth custom claims (buyer, owner, dealer, agent, admin).
  - Public sees only `approved` listings; owners see their own; staff see all.
  - Owners/dealers create listings only as `draft`/`pending`, cannot set status, featured, code or verified flags; editing an approved listing sends it back to review; approved → sold/rented allowed.
  - Owner's real phone lives in `properties/{id}/private/contact`: owner + admin only (D3).
  - Visitors send enquiries and book site visits without login (validated 10-digit mobile, no self-assigned agent/stage); only the assigned agent and admin read them.
  - `subscriptions`, `notifications`, `auditLogs`, `counters` are written only by Cloud Functions.
- `firebase/storage.rules`: listing photos public to view; upload only by the listing owner (checked against Firestore) or admin; images only, < 5 MB; profile photos < 2 MB.
- `firebase/firestore.indexes.json`: 14 composite indexes for listing search (purpose, category, district, price, featured), owner listings, leads, site visits, locations.
- `firebase/functions` (Node 22, asia-south1):
  - `onUserCreated` — profile + `buyer` role for every new account (keeps an existing role).
  - `becomeOwner` — buyer becomes owner to post a property.
  - `setUserRole` — admin only; refuses self-demotion; audit log.
  - `reviewProperty` — admin approves/rejects pending listings; approval assigns `OL-1001`, `OL-1002`…; rejection needs a reason; audit log.
- `scripts/set-role.mjs`: make the first admin from Cloud Shell.
- `apps/web/src/lib/firebase/client.ts` (browser, emulator switch) and `admin.ts` (server-only).
- `docs/FIREBASE_SETUP.md`: console steps for when the projects exist.

**Rule from Nagesh (14 Nov 2026):** never touch the existing Firebase projects (onlineland-28234, Vahan, Ridekart, ScrapLake). Only `onlineland-dev` / `onlineland-prod` are used; `set-role.mjs` refuses other projects (tested).

**Decision taken:** a buyer becomes an owner with one tap before posting; dealer role is given only by admin (linked to subscription).

**Tests** — GitHub Actions run 43611898006, Firebase emulators — 72 tests passed:

- Firestore rules: 50 tests passed.
- Storage rules: 9 tests passed.
- Cloud Functions + set-role script: 13 tests passed (includes check that functions' role list matches `@onlineland/shared`).
- Type-check, lint, website build: pass.

**Pending**

- Not deployed: waiting for the project-quota increase to create `onlineland-dev` / `onlineland-prod` (see `docs/FIREBASE_SETUP.md`).
- Location list (districts → mandals → villages) is seeded in Phase 5.
- Limit of 20 photos per listing is enforced in the upload screen (Phase 5/6); Storage rules cannot count files.
- Lead auto-assignment and notifications: Phase 7.

## Phase 5 — Property Listings ✅ (15 Nov 2026, on emulators)

**Completed**

- `/[locale]/properties` — listings with filters (buy/rent, type, district → mandal, budget), sort (newest with featured first, price low/high), 12 per page. Plain GET form (works without JavaScript); changes apply at once. Mobile: filters fold under one button. Filtered/paged URLs are `noindex`; the main list is indexed.
- `/[locale]/properties/OL-xxxx` — photo gallery (keyboard + thumbnails), total price and per-acre price, details grid, description, Google Maps embed when the listing has coordinates, JSON-LD (RealEstateListing), share-ready metadata. Pending, sold and unknown codes return 404.
- Enquiries: WhatsApp and call clicks are recorded as leads (never block the click); enquiry form (name, mobile, message) with Indian mobile validation; site-visit booking (date tomorrow…+60 days, morning/afternoon/evening) saved as a lead + site visit. All written from the browser and checked by the Phase 4 security rules.
- Mobile bottom bar with WhatsApp + Call on property pages.
- Favorites saved on the device, header count, `/[locale]/favorites` page. Sync to the account comes with login.
- Homepage "featured" now shows approved listings (featured first, then newest); hidden while there are none.
- `@onlineland/shared`: 33 Telangana districts and 13 Narayanpet mandals (te/en), price helpers (per-acre totals, budget ranges).
- Server reads use the Admin SDK over a 60-second cache of approved listings (private fields never leave the server); `/api/revalidate` refreshes it at once after approvals (secret header).
- `scripts/seed-emulator.mjs` — locations + 12 test listings (incl. hidden pending/sold) + generated photos; refuses to run outside the emulators.
- Removed the Phase 3 design samples.

**Tests** — GitHub Actions, Firebase emulators:

- Unit: 12 (filters, budgets, per-acre totals, pagination, mobile numbers, place names).
- Firebase rules + functions: 73.
- Browser (Playwright, Chromium): 14 — listings count, all filter combinations, live filter change + sort, empty state → WhatsApp, property page (gallery, prices, WhatsApp code, JSON-LD), English page, 404 for pending/sold/unknown, enquiry saved to Firestore, site visit + lead saved, favorites save/list/remove, homepage featured order, homepage search → filtered list, mobile layouts.
- Found and fixed by the tests: header overflow on phones (23 px) after adding the favorites button; WhatsApp label wrapping; village repeating the mandal name. Checked at 360/390/414 px.

**Pending**

- Village lists and mandals for other districts (free text until added).
- Favorites sync to the account and phone/Google login on the website (with the admin dashboard, Phase 7).
- App Check enforcement and spam limits on enquiries — before launch (Phase 8).
- Migration of the old site's `listings` from onlineland-28234 is **read-only and needs Nagesh's approval** (the old project is never modified).

## Phase 6 — Android App ⏳ (awaiting approval)
