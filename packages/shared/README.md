# @onlineland/shared

One definition of OnlineLand's business vocabulary, used by the website, admin dashboard and Cloud Functions:

- `brand.ts` — name, tagline (te/en), colours, WhatsApp number
- `i18n.ts` — `te` / `en` locales, `LocalizedText`
- `roles.ts` — buyer, owner, dealer, agent, admin
- `property.ts` — 9 categories with Telugu/English labels and URL slugs, statuses, area units (acre, gunta, sq. yd, sq. ft)
- `leads.ts` — lead channels and stages, site-visit statuses, payment methods
- `firestore.ts` — collection names, Functions region

The Flutter app mirrors these values in Dart (Phase 6).
