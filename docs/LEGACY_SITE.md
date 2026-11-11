# Legacy site — what exists today and how it is preserved

**Rule 12: preserve existing working code.** The current onlineland.in is a static site served by GitHub Pages from the `main` branch of this repo. It stays exactly as it is until the Phase 8 launch.

## Branch policy

| Branch | Purpose |
| --- | --- |
| `main` | Live onlineland.in (GitHub Pages). Not touched during Phases 2–7. |
| `develop` | New platform work. Merged to `main` only at Phase 8 launch, after URL checks. |

## Inventory (31 files, ~2 MB, as of 12 Nov 2026)

| Path | What it is | Launch plan |
| --- | --- | --- |
| `index.html` | Current homepage; reads `listings` from Firestore (project onlineland-28234); GA4 `G-FS8G5F66CB` | Replaced by the new Next.js homepage |
| `blog.html`, `posts.js` | Blog; reads `blogs` from Firestore (onlineland-28234) | Keep URL working (copy or redirect to new blog) |
| `sw.js` | Service worker, cache `onlineland-v13` | Replace with a self-unregistering worker at launch so visitors don't see stale cached pages |
| `icon-192.png`, `icon-512.png` | PWA icons | Copy to `apps/web/public/` |
| `CNAME` | `onlineland.in` for GitHub Pages | Removed only when DNS moves to Vercel |
| `c/*/` (an-landscape, demo-clinic, demo-restaurant, demo-shop, onlineland, scraplake, siri, venkateswara-tiffins) | Digital visiting cards for clients | Copy unchanged to `apps/web/public/c/` — same URLs |
| `demo/dental/`, `demo/dental/dental2/` | Website-service demos (premium English, simple Telugu) | Copy unchanged to `apps/web/public/demo/` |
| `poster/index.html` | Poster generator | Copy unchanged to `apps/web/public/poster/` |

## Things to know

- **Old Firebase project:** onlineland-28234 (also used by WorkPin) is not modified. The new platform uses new projects (decision D1). Existing `listings` documents will be migrated into the new `properties` collection with a one-time script (Phase 5), after you confirm.
- **Folder name with a trailing space:** `c/an-landscape /readme.txt` exists next to `c/an-landscape/`. Left as is (Rule 6); flag for cleanup when you decide.
- **Analytics:** keep GA4 ID `G-FS8G5F66CB` on the new site so history continues.
