# apps/admin — OnlineLand admin dashboard

Private dashboard at **admin.onlineland.in** — Next.js static export (no server), Telugu / English.

| Page | What |
| --- | --- |
| Overview | Listings to review, payments to check, new leads, visit requests, live listings, paying dealers |
| Listings | Approve (gives OL-code, checks plan limits) / reject with reason; featured 7 days; documents checked; mark sold; owner's private number |
| Leads (CRM) | Stage, notes, assign to an agent, WhatsApp/call; filter OnlineLand vs dealer-link leads |
| Site visits | Confirm / complete / cancel, assign agent |
| Payments | Check the UTR in your bank app, then approve → plan / featured / extra listing turns on by itself |
| Users | Roles, ✓ Verified badge, plan and live listings |
| Prices & settings | Plan prices and limits, featured / extra-listing prices, your UPI ID; run the daily job now |
| Audit log | Who changed what |

Sign-in is phone OTP. Only accounts with the `admin` role (or `agent`, who sees only their own leads and visits) get in;
everyone else is signed out. Security is enforced by Firestore rules and Cloud Functions, not by the pages.

```bash
npm run dev:admin            # http://localhost:3001 (set NEXT_PUBLIC_FIREBASE_* or NEXT_PUBLIC_USE_FIREBASE_EMULATORS=true)
npm run build:admin          # static site in apps/admin/out
npm run test:e2e:admin       # browser tests against all emulators (repo root)
```

Deploy: a second Vercel project with root directory `apps/admin` (output `out`), domain admin.onlineland.in,
same `NEXT_PUBLIC_FIREBASE_*` values as the website. The first admin is made with `scripts/set-role.mjs`.
