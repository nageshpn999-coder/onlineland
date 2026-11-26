# OnlineLand — Developer handover

Start here if you are new to this repo. This is the current state (26 Nov 2026). `docs/ARCHITECTURE.md` is the
original Phase 1 design; where the two differ (for example hosting: Vercel was replaced by Firebase), this file wins.
The day-by-day history, with every decision and problem, is in `DEVELOPMENT_LOG.md`.

## 1. What the product is

OnlineLand is a real-estate marketplace for Telangana (farmland, open plots, flats, villas, rentals, commercial),
run by OnlineLand Infra Private Limited, Makthal. Three clients share one Firebase backend:

| Client | Tech | Who uses it | Address |
| --- | --- | --- | --- |
| Website | Next.js 16 (App Router), Tailwind, `next-intl` (Telugu default, English) | Buyers, owners, dealers | onlineland.in (prod), App Hosting URL for dev |
| Android app | Flutter (Riverpod, go_router) | Buyers, owners, dealers — one app, features change with role | Play Store (pending D-U-N-S), test APKs on GitHub releases |
| Admin | Next.js static export | Owner of the business / staff with role `admin` | admin.onlineland.in (prod), onlineland-dev.web.app (dev) |
| Backend | Firebase: Auth (phone OTP), Firestore, Storage, Cloud Functions v2 (Node 22, TypeScript), FCM | — | asia-south1 (data, functions) |

Roles (Auth custom claims, set only by Cloud Functions): `buyer` (default) → `owner` (first listing) → `dealer`
(paid plan approved) · `agent` · `admin`. See `packages/shared/src/roles.ts`.

Revenue: dealer plans (Free / Basic / Pro, monthly or yearly), featured listings, owner extra listings, paid services
(drone video, document check, survey, registration, loan help) and a 1% fee on assisted sales. All prices live in
Firestore (`plans/*`, `settings/pricing`, `settings/services`) and are edited in admin; code defaults are in
`packages/shared/src/plans.ts` and `services.ts`, mirrored in `firebase/functions/src/plans.ts`.
Payments are manual UPI: user pays the UPI ID from settings, types the UTR, admin approves in admin → a Cloud
Function activates the plan/service.

## 2. Repo map

```
apps/web/            Website. src/app/[locale]/… pages, src/components, src/lib (firebase, data, legal texts)
apps/admin/          Admin dashboard (static export, client-side Firebase). src/app/<section>/page.tsx
apps/android/        Flutter app. lib/ui (screens), lib/data (models, repository, firebase/demo implementations)
packages/shared/     TypeScript constants and types used by web, admin and functions (plans, services, roles, models)
firebase/            firestore.rules, storage.rules, indexes, firebase.json, functions/ (Cloud Functions), tests/ (rules + functions tests)
scripts/             seed-emulator.mjs (demo data), set-role.mjs, check-emulators.mjs
docs/                HANDOVER (this), ARCHITECTURE, FIREBASE_SETUP, LAUNCH, PLAY_STORE, LEGACY_SITE, store/ (graphics)
design/              Source artwork (3D category icons)
.github/workflows/   CI and all deploys (see §5)
DEVELOPMENT_LOG.md   History
Root html files      The OLD website (GitHub Pages on main). Not used by the new platform; see docs/LEGACY_SITE.md
```

npm workspaces + Turborepo at the root (App Hosting builds from the root lock file).

## 3. Environments and accounts

| | dev | prod |
| --- | --- | --- |
| Firebase project | `onlineland-dev` | `onlineland-prod` |
| Website | https://onlineland-web--onlineland-dev.asia-southeast1.hosted.app (branch `develop`) | onlineland.in / https://onlineland-web--onlineland-prod.asia-southeast1.hosted.app (branch `release`) |
| Admin | https://onlineland-dev.web.app | admin.onlineland.in / https://onlineland-prod.web.app |
| Android | release `android-dev` (debug-signed APK) | release `android-prod` (signed AAB + APK) |
| Test login | +91 90000 00001, code set in Firebase Auth test numbers | real numbers only |

- Firebase / Google Cloud owner account: onlinelandads@gmail.com. GitHub: `nageshpn999-coder` (repo is **public**).
- Domain and email: GoDaddy (onlineland.in). Email uses GoDaddy/secureserver MX, SPF, DKIM, DMARC records — never
  change those when editing DNS.
- **Do not touch** other Firebase projects on the same account (onlineland-28234, vahan-3e329, ridekart-70332,
  scraplake). They are separate businesses.
- Billing: Blaze on a Google Cloud free-trial credit until 21 Feb 2027 — upgrade the billing account and set the card
  e-mandate before then. Budget alert ₹2,000; spend caps on prod (Cloud Run ₹1,000, Functions ₹1,000, AI ₹100 each).

## 4. Running locally

Requirements: Node 22+, Java 21+ (emulators), Flutter stable (app).

```bash
npm install
npm run emulators            # Auth, Firestore, Functions, Storage on demo-onlineland (no real data)
npm run seed:emulator        # demo listings, leads, payments
npm run dev:web              # http://localhost:3000
npm run dev:admin            # admin against emulators
npm run lint && npm run typecheck
npm run test:firebase        # rules + functions tests
npm run test:e2e             # website Playwright tests (builds against emulators)
npm run test:e2e:admin       # admin Playwright tests
cd apps/android && flutter test
flutter run --dart-define=DATA_MODE=demo   # app with built-in sample data, no Firebase
```

## 5. CI/CD — everything deploys from GitHub Actions

`workflow_dispatch` only works for workflows on `main`, and `main` still holds the old site, so deploys are
triggered by **pushing to special branches**:

| Push | Does |
| --- | --- |
| any push / PR to `develop` | `ci.yml`: lint, typecheck, unit + rules + functions tests, web and admin e2e |
| `develop` → `develop` | App Hosting auto-builds the **dev website** |
| `develop` → `release` | App Hosting auto-builds the **prod website** |
| `develop` → `deploy-dev` | `deploy.yml`: rules, indexes, functions, admin → onlineland-dev |
| `develop` → `deploy-prod` | same → onlineland-prod |
| `develop` → `android-dev` | `android-dev.yml`: dev APK → release `android-dev` |
| `develop` → `android-prod` | `android-prod.yml`: signed AAB + APK on prod → release `android-prod` |
| commit `set-role +91XXXXXXXXXX <role>` → `set-role-dev` / `set-role-prod` | `set-role.yml`: sets a user's role (user must have logged in once) |

Example: `git push origin develop:refs/heads/deploy-prod` (use `refs/heads/`; a tag named `android-dev` exists).

Normal flow: work on `develop` → CI green → check on dev (deploy-dev, android-dev) → ship to prod
(`release`, `deploy-prod`, `android-prod`). Write a `DEVELOPMENT_LOG.md` entry for every change.

## 6. Secrets — where they live (never in the repo, chat or logs)

| Secret | Where |
| --- | --- |
| Service account for dev / prod deploys | GitHub secrets `FIREBASE_SERVICE_ACCOUNT_DEV`, `FIREBASE_SERVICE_ACCOUNT_PROD` (Owner role) |
| Play upload key + password | Google Secret Manager in onlineland-prod: `android-upload-keystore`, `android-upload-keystore-password`. Created by `android-prod.yml`, never downloaded |
| Firebase web/Android config | Read at build time (`firebase apps:sdkconfig`, `FIREBASE_WEBAPP_CONFIG` on App Hosting) — public by design |
| Website server access to Firestore | App Hosting's own Google identity (ADC), no key |
| UPI ID | Firestore `settings/pricing`, edited in admin |

If the upload key is ever lost, Play App Signing lets you request an upload-key reset from Play Console support.

## 7. Data model (Firestore)

`users` (+ `favorites`, `devices`) · `properties` (+ `media`, `private/contact`) · `locations` · `leads` ·
`siteVisits` · `plans`, `settings/{pricing,services,site}` · `paymentRequests` · `subscriptions` · `dealers` ·
`propertyStats` · `serviceRequests` · `notifications` · `auditLogs`.
Types: `packages/shared/src/models.ts`. Rules: `firebase/firestore.rules` (default deny; status, role and money fields
are written only by functions). Listing lifecycle: draft → pending → approved / rejected → sold / rented / expired.
Drafts older than a day are cleaned by `dailyMaintenance`.

Main Cloud Functions: `onUserCreated`, `becomeOwner`, `setUserRole`, `reviewProperty`, `reviewPayment`,
`setVerified`, `useFeaturedSlot`, `trackEvent`, `onLeadCreated`, `onServiceRequestCreated`, `quoteService`,
`claimLaunchOffer`, `dailyMaintenance`.

## 8. Things that bit us (read before changing)

- Storage rules call `firestore.get`: the Storage service agent needs `roles/firebaserules.firestoreServiceAgent`
  (the deploy workflow grants it).
- Phone OTP on Android needs the signing key's SHA-1/SHA-256 on the Firebase Android app and the Play Integrity API.
  After the first Play upload, add Play's **App signing key** fingerprints too.
- New website domains must be added to Auth → Authorized domains, or OTP fails there.
- First functions deploy on a new project can fail with an Eventarc permission error; rerun after a few minutes.
- App Hosting needs the root `package-lock.json` (Turborepo at the root).
- Dev and prod APKs share a package name — uninstall one to install the other.
- Gradle downloads sometimes 503; the Android workflows retry 3 times.
- Category labels in the app use `TileLabel` so a word never breaks mid-word; 3D icons are in `apps/android/assets/categories` and `apps/web/public/categories`.

## 9. Open items

- onlineland.in: DNS moved 26 Nov; confirm "Connected" in App Hosting, then add www.onlineland.in (replace the
  www CNAME that still points to GitHub Pages) and confirm admin.onlineland.in.
- Play Store: waiting for D-U-N-S; follow the "Launch-day checklist" in the Play Store listing doc and `docs/PLAY_STORE.md`.
- Billing upgrade before 21 Feb 2027.
- Real listings on prod, store screenshots.
