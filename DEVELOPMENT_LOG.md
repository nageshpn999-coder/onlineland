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

**Decision taken:** a buyer becomes an owner with one tap before posting; dealer role is given only by admin (linked to subscription).

**Tests** — GitHub Actions run 43611535242, Firebase emulators:

- Firestore rules: 50 tests passed.
- Storage rules: 9 tests passed.
- Cloud Functions + set-role script: 13 tests passed (includes check that functions' role list matches `@onlineland/shared`).
- Type-check, lint, website build: pass.

**Pending**

- Not deployed: waiting for the project-quota increase to create `onlineland-dev` / `onlineland-prod` (see `docs/FIREBASE_SETUP.md`).
- Location list (districts → mandals → villages) is seeded in Phase 5.
- Limit of 20 photos per listing is enforced in the upload screen (Phase 5/6); Storage rules cannot count files.
- Lead auto-assignment and notifications: Phase 7.

## Phase 5 / 6 — awaiting approval
