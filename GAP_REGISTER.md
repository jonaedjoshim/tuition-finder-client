# Gap Register — TuitionFinder

Audit → fix → verification map. Every item found in the original audit is
listed here with the change that addresses it. Statuses are confirmed during the
final integration pass before hand-off.

## Final verification (integration pass)

- `tuition-finder-server`: `npm test` → **17/17 passing** (config, pagination,
  regex/PII utilities, and booted Express route/guard checks with Firebase and
  MongoDB stubbed).
- `tuition-finder-client`: `npm run build` → **success**; one non-blocking Vite
  warning about the ~542 kB bundle (Firebase SDK dominates it).
- `npm audit --omit=dev --audit-level=critical` → **no critical issues** in
  either app. Non-breaking `npm audit fix` was applied to both lockfiles.
  Remaining moderate/high advisories are transitive from Firebase JS SDK,
  Vite's dev server, React Router 6 and `@vercel/blob`'s config parser; the
  offered `--force` fixes would downgrade Firebase or jump major versions, so
  they were intentionally not applied.
- API paths were cross-checked between `src/api/index.js` and the server
  routers; the verification-note body field and application-withdraw verb were
  corrected during integration.
- Statuses below are therefore confirmed, not just planned.

## Original audit findings

| # | Finding | Fix | Verify |
| --- | --- | --- | --- |
| 1 | No runnable configuration: no `.env`, no service account, no docs | `.env.example` in both apps, validated `config/env.js`, root `README.md` with every variable and Vercel notes | Fresh clone starts after copying env templates |
| 2 | Tutor profile edit silently wiped qualification/location/area/online | `GET /tutors/me/profile`, partial `updateMyProfile`, dashboard prefills and sends only changed fields | Edit only the tutor's name; saved profile fields remain |
| 3 | Admin document preview crashed when `VITE_API_URL` unset | Admin dashboard uses the document URL returned by the API; no string replace on an env var | Open verification tab with no `VITE_API_URL` set |
| 4 | Deep links `/student/messages`, `/tutor/profile`, `/tutors/jobs`, etc. landed on dashboard overview | All dashboards read `?tab=` / pathname and update it on tab change; Navbar/Footer links fixed | Open each deep link directly and use browser back/forward |
| 5 | Home search `class` param ignored; class vocabularies inconsistent | Shared `src/utils/constants.js` for both apps' forms/filters; `classLevel` param read everywhere | Search from home page filters tutors correctly |
| 6 | Public tutor/post endpoints exposed email, phone, and raw document paths | `publicUser`, `publicTutorProfile`, `publicPost` serializers on every public response | Inspect `/api/tutors` and `/api/posts/:id` responses |
| 7 | Unescaped regex in tutor/post filters → 500 / ReDoS | `escapeRegex()` applied to every user-supplied regex term | Search with `(`, `[`, `*.+` and confirm normal 200 result |
| 8 | Admin user deletion left orphaned data | Cascade delete across Mongo collections + best-effort Firebase Auth deletion | Delete a demo user; no orphan posts/apps/messages remain |
| 9 | No tests, lint, CI, server deploy config | `node:test` unit suite, `vercel.json` for the API, documented checks | `npm test`, `npm run build` both succeed |
| 10 | Unused `aos`, stray empty `nodemon` file, missing favicon, duplicate fonts, unused `useLocation` | Removed; inline SVG favicon; one font import | No 404 for favicon; no unused imports |
| 11 | `dns-test.js` and hardcoded DNS resolvers | Deleted script, removed `dns.setServers` | Server starts on restricted networks / Vercel |
| 12 | Native `alert()` / `confirm()` in dashboards | In-app `Alert`, `Modal`, `ConfirmDialog`, react-hot-toast | No browser dialogs in any flow |
| 13 | Messaging went stale without refresh | 15s polling of conversations and open thread, cleaned up on unmount | Send a message in two tabs; second updates within 15s |
| 14 | `seed.js` wiped seven collections on every run | Non-destructive by default, `--force` required to wipe; includes Notification collection | `npm run seed` twice without data loss |
| 15 | Wrong-role redirect to `/`; Firebase/Mongo session desync | `ProtectedRoute` redirects to the role's own dashboard; `POST /auth/bootstrap` self-heals missing Mongo users | Sign in with a Google account that has no Mongo record |

## Vercel-specific gaps found after deployment review

| # | Finding | Fix | Verify |
| --- | --- | --- | --- |
| 16 | `app.listen()` ran at module load, binding a port inside serverless | Guarded with `require.main === module` | Preview deployment responds without function crash |
| 17 | Mongoose opened a new connection per cold start | Cached `readyState`/promise connection in `config/db.js` | Multiple invocations reuse one pool |
| 18 | `multer.diskStorage` writes to read-only ephemeral filesystem | `memoryStorage()` + Vercel Blob with local-disk fallback | Upload a document locally and on preview |
| 19 | No API `vercel.json` routing all paths to the Express handler | Added `vercel.json` with `@vercel/node` build + catch-all route | Deep API paths resolve on Vercel |

## Product gaps (code existed but UI was missing)

| Gap | Fix |
| --- | --- |
| Reviews could not be submitted | Review modal on accepted tuitions and on tutor profiles |
| Tutor documents could not be uploaded | Upload UI + verification status/note in tutor profile and admin verification |
| Reports could not be created (admin tab permanently empty) | `POST /reports` + report modal on profiles/applications |
| Admin user delete API unreachable | Delete button with confirmation dialog |
| Verification was a bare boolean | `verificationStatus` + `verificationNote` with verified/rejected actions |
| No proactive notifications | In-app notification center with navbar bell and polling |
| Pagination ignored by UI | Pagination controls on list tabs |
| Post lifecycle incomplete | `closed` status, rejection reasons shown to students |
| Applications could not be withdrawn | Withdraw action for pending tutor applications |
| Firebase signup could leave a ghost session | Centralized bootstrap in `AuthContext` with race guard |
