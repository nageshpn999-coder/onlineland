# apps/web — OnlineLand website

Public website at **onlineland.in** (Next.js + TypeScript + Tailwind CSS, hosted on Vercel).

**Status:** folder reserved in Phase 2. The Next.js app is created in **Phase 3** (homepage) and connected to Firebase in **Phase 5**.

- Languages: `/te` (default) and `/en`
- Shared constants: `@onlineland/shared`
- Environment: copy `.env.example` → `.env.local`
- The old static site (blog, `/c/` visiting cards, `/demo/`, `/poster/`) is copied into `public/` before launch so its URLs keep working — see `docs/LEGACY_SITE.md`.
