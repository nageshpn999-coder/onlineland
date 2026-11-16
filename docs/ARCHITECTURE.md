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
| D7 | Revenue (17 Nov 2026): commission on deals via OnlineLand + dealer/agent subscriptions + paid featured listings. Prices and limits are editable in admin. |

### Subscription plans (D7)

| Plan | Price | Includes |
| --- | --- | --- |
| Free | ₹0 | 2 listings; WhatsApp share — enquiries go to OnlineLand (lead tagged with the dealer) |
| Basic | ₹499 / month | 15 listings; shared links show the dealer's own name + number; Verified Dealer badge; views/enquiries stats |
| Pro | ₹1,499 / month | Unlimited listings; 2 featured listings a month; own dealer page (onlineland.in/dealer/…); area leads shared |

Add-ons: featured listing ₹199 / week. Owners: 1 listing free; each further listing ₹199 (live until sold or 90 days).
Lead ownership: enquiries from a dealer's own share link (Basic/Pro) are the dealer's — shown in the app under "My leads" with a push notification; the form tells the customer their details go to the dealer and OnlineLand. Enquiries from OnlineLand's site/app search, ads or SEO stay with OnlineLand (D3); admin may forward them to Pro dealers. Admin sees all leads, tagged by dealer.
Payment: UPI QR in the app → user enters UTR → admin approves → plan active 30 days → renewal reminder 3 days before expiry.

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
| `users/{uid}` (+ `favorites/`, `devices/`) | Profiles; role set only by Cloud Function; FCM tokens for push |
| `properties/{id}` (+ `media/`, `private/contact`) | Listings; owner contact in a private sub-document |
| `locations/{id}` | District → mandal → village (te/en) |
| `leads/{id}` | Every enquiry, stage, assigned agent, `refId` = dealer whose share link brought it |
| `siteVisits/{id}` | Visit bookings |
| `plans/{free,basic,pro}`, `settings/pricing` | Plan limits and prices, UPI ID (admin edits; defaults in `packages/shared/src/plans.ts`) |
| `paymentRequests/{id}` | UPI payments with UTR, waiting for admin (D6) |
| `subscriptions/{id}` | Approved plan purchases (Functions only) |
| `dealers/{uid}` | Public dealer card: name, ✓ badge, plan, validity, phone only on paid plans (Functions only) |
| `propertyStats/{id}` | Views, shares, enquiries per listing (Functions only; owner + staff read) |
| `notifications/{id}` | Push messages sent |
| `auditLogs/{id}` | Who changed what (Functions only) |
| `settings/site` | Banners, contact number, category order |

Listing lifecycle: draft → pending → approved / rejected → sold / rented / expired.

Cloud Functions (asia-south1): `onUserCreated`, `becomeOwner`, `setUserRole`, `reviewProperty` (codes, plan limits, push),
`reviewPayment`, `setVerified`, `useFeaturedSlot`, `trackEvent`, `onLeadCreated`, `dailyMaintenance` (09:00 IST) / `runMaintenance`.

Share links: `onlineland.in/te/properties/OL-1001?ref=<ownerId>`. The ref counts only when it is the listing's owner (rules check it).

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
