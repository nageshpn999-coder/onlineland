# OnlineLand — Find Your Perfect Property

Real estate consultancy + property marketplace for Telangana: website, Android app and admin dashboard on one Firebase backend.

> **Branches:** `main` = the live onlineland.in site (GitHub Pages, untouched until launch). `develop` = new platform work.

## Structure

```
apps/
  web/        Next.js website — onlineland.in        (Phase 3)
  admin/      Next.js admin — admin.onlineland.in     (Phase 7)
  android/    Flutter Android app                     (Phase 6)
packages/
  shared/     Shared constants and types (@onlineland/shared)
firebase/     Firestore + Storage rules, indexes, emulator config
scripts/      Setup and maintenance scripts
docs/         ARCHITECTURE.md, LEGACY_SITE.md
DEVELOPMENT_LOG.md
```

The files at the repo root (`index.html`, `blog.html`, `c/`, `demo/`, `poster/`, …) are the current live site — see `docs/LEGACY_SITE.md`.

## Getting started

Requirements: Node.js 22+, Java 21+ (for Firebase emulators).

```bash
npm install
npm run typecheck        # type-check shared code
npm run emulators        # start Auth, Firestore, Storage emulators (UI at http://127.0.0.1:4000)
npm run emulators:check  # verify emulators + deny-all rules
```

Emulators use the offline project `demo-onlineland`, so nothing touches real data.

## Environments

| Alias | Firebase project | Use |
| --- | --- | --- |
| `dev` | `onlineland-dev` | Testing |
| `prod` | `onlineland-prod` | Live |

Update `firebase/.firebaserc` if the console gave different project IDs.

## Secrets

Never commit `.env.local`, service-account JSON, `google-services.json` or keystores (all git-ignored). Copy each app's `.env.example` to `.env.local`. Production secrets live in Vercel and Firebase settings only.
