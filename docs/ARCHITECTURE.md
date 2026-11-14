# OnlineLand — System Architecture (Phase 1, approved 12 Nov 2026)

Full document with diagram: https://claude.ai/artifact/Lgt3U9iqripwCjgxcK27v2

**OnlineLand — Find Your Perfect Property.** Real estate consultancy + property marketplace for Telangana. One shared Firebase backend serves three clients: the website, the Android app and the admin dashboard.

## Decisions

| # | Decision |
| --- | --- |
| D1 | New dedicated Firebase projects (`onlineland-dev`, `onlineland-prod`). onlineland-28234 and WorkPin stay untouched. |
| D2 | Blaze plan with a monthly budget alert. |
| D3 | Owner/dealer contacts hidden from the public; every enquiry goes through OnlineLand. |
| D4 | Built-in OnlineLand CRM replaces Privyr (Phase 7). |
| D5 | Firebase phone OTP as the main login, plus Google sign-in. Login optional for browsing. |
| D6 | Manual UPI first: dealer pays, admin confirms, a Cloud Function activates the plan. Gateway later. |

## Architecture

```
 Website (Next.js, Vercel)   Android app (Flutter)   Admin (Next.js, Vercel)
 onlineland.in /te /en       Google Play             admin.onlineland.in
            \                      |                      /
             +---- Firebase SDKs + App Check ------------+
                                   |
   Firebase (asia-south1): Auth | Firestore | Storage | Cloud Functions | FCM
                                   |
   Outside: WhatsApp (wa.me/919959731120) | Google Maps | GA4 + Meta Pixel | UPI
```

Privileged work (approvals, role changes, payment activation, lead assignment, audit logs) runs only in Cloud Functions.

## Firestore collections

| Collection | Holds |
| --- | --- |
| `users/{uid}` (+ `favorites/`) | Profiles; role set only by Cloud Function |
| `properties/{id}` (+ `media/`, `private/contact`) | Listings; owner contact in a private sub-document |
| `locations/{id}` | District → mandal → village (te/en) |
| `leads/{id}` | Every enquiry, stage, assigned agent |
| `siteVisits/{id}` | Visit bookings |
| `plans/{id}`, `subscriptions/{id}` | Dealer plans and purchases |
| `notifications/{id}` | Push messages sent |
| `auditLogs/{id}` | Who changed what (Functions only) |
| `settings/site` | Banners, contact number, category order |

Listing lifecycle: draft → pending → approved / rejected → sold / rented / expired.

## Roles

Visitor (not logged in), Buyer, Owner, Dealer, Sales Agent, Admin — stored as Firebase Auth custom claims. See `packages/shared/src/roles.ts`.

## Security

Default-deny Firestore and Storage rules; public reads only of approved listings; protected fields (`status`, `isFeatured`, `role`) never writable from clients; App Check; secrets only in Vercel / Functions settings; daily Firestore backups; emulator tests for every rule.

## Language, SEO, performance

Telugu default + English (`/te`, `/en`); all visitor text stored as `{ te, en }`. Server-rendered listing pages with readable URLs, location landing pages, sitemap, schema.org data. Target: LCP under 2.5 s on 4G, Lighthouse 90+.

## Roadmap

1. Phase 2 — Folder structure ✅
2. Phase 3 — Website homepage ✅
3. Phase 4 — Firebase backend ✅ (emulators; deploy pending)
4. Phase 5 — Property listings ✅
5. Phase 6 — Android app
6. Phase 7 — Admin dashboard
7. Phase 8 — Testing and launch (www.onlineland.in, Play Store)
