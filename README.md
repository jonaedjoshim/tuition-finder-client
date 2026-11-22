# TuitionFinder

A Bangladesh-focused tuition marketplace connecting students/parents with tutors.

| App | Folder | Stack | Deploy |
| --- | --- | --- | --- |
| Web client | `tuition-finder-client/` | React 18 + Vite 5 + React Router 6 + Tailwind 3 + Firebase Web SDK | Vercel (static) |
| API server | `tuition-finder-server/` | Node 20/22 + Express 4 + Mongoose 8 + Firebase Admin | Vercel (serverless) |

The two apps remain separate projects with their own `package.json`, lockfile and
Git repository. There is no TypeScript and no monorepo tooling — by design.

---

## 1. Quick start (local)

Requires **Node 20+**, a MongoDB Atlas cluster, and a Firebase project with
Email/Password + Google sign-in enabled.

```bash
# 1. API
cd tuition-finder-server
cp .env.example .env          # fill in the values (see §2)
npm install
npm run dev                   # http://localhost:5000

# 2. Web (in a second terminal)
cd tuition-finder-client
cp .env.example .env          # fill in the Firebase web config
npm install
npm run dev                   # http://localhost:3000
```

The Vite dev server proxies `/api` → `http://localhost:5000`, so local requests
work even if `VITE_API_URL` points at the same origin.

Optional demo data:

```bash
cd tuition-finder-server
npm run seed                  # safe, non-destructive: reuses demo records
# npm run seed -- --force     # DESTRUCTIVE: wipes all app collections first
```

Demo logins (password `demo1234`): `student@demo.com`, `tutor@demo.com`,
`admin@demo.com`, `tutor2@demo.com`. The admin account cannot be created through
public registration; seed it or promote a user directly in MongoDB.

---

## 2. Environment variables

### Server (`tuition-finder-server/.env`)

| Variable | Required | Notes |
| --- | --- | --- |
| `MONGO_URI` | yes | MongoDB Atlas connection string. |
| `FIREBASE_SERVICE_ACCOUNT_KEY` | yes* | The **entire** service-account JSON as one line. Use this on Vercel. |
| `config/serviceAccountKey.json` | yes* | Local alternative to the env var. Never commit it. |
| `CLIENT_ORIGIN` | no | CORS allow-list origin. Defaults to `http://localhost:3000`. Set to the real client URL on Vercel. |
| `PORT` | no | Defaults to `5000`. Ignored by Vercel serverless. |
| `NODE_ENV` | no | `development` / `production`. |
| `BLOB_READ_WRITE_TOKEN` | no | Vercel Blob token for tutor documents. Without it, uploads fall back to local `uploads/documents/` (dev only). |

\* One of the two Firebase credential sources is required. The server validates
all required variables at startup and reports every missing item in one message.

### Client (`tuition-finder-client/.env`)

| Variable | Required | Notes |
| --- | --- | --- |
| `VITE_API_URL` | no | Defaults to `/api`. On Vercel set `https://<api-domain>/api`. |
| `VITE_FIREBASE_API_KEY` | yes | Firebase Console → Project settings → Your apps. |
| `VITE_FIREBASE_AUTH_DOMAIN` | yes | e.g. `project.firebaseapp.com`. |
| `VITE_FIREBASE_PROJECT_ID` | yes | Firebase project id. |
| `VITE_FIREBASE_STORAGE_BUCKET` | yes | e.g. `project.appspot.com`. |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | yes | Numeric sender id. |
| `VITE_FIREBASE_APP_ID` | yes | Firebase app id. |

Vite bakes `VITE_*` values into the bundle **at build time**. After changing
them on Vercel, trigger a new deployment.

---

## 3. Vercel deployment notes (current setup retained)

**Client:** framework Vite, build command `npm run build`, output `dist`.
`vercel.json` rewrites all SPA routes to `index.html`.

**Server:** the exported Express `app` is the serverless handler. `app.listen()`
only runs when the file is executed directly (`require.main === module`), so it
does not try to bind a port inside a serverless function. Set the server's env
vars in the Vercel project (Production + Preview). MongoDB uses a cached
connection so warm invocations reuse the same pool.

Two platform caveats worth knowing:

- The in-memory `express-rate-limit` stores are per instance and therefore
  best-effort on serverless; they are not a distributed rate limit.
- Local-disk uploads are read-only/ephemeral on Vercel. Set
  `BLOB_READ_WRITE_TOKEN` (Vercel → Storage → Create Blob store) for tutor
  verification documents. Without it, uploads only work locally.

`CLIENT_ORIGIN` must match the deployed client origin exactly (scheme + host).

---

## 4. How the app works

- **Identity:** Firebase owns sign-up/login (email + Google). The client sends
  the Firebase ID token as `Authorization: Bearer …`; the API verifies it with
  Firebase Admin and mirrors the account into MongoDB (`User.firebaseUid`).
  `/auth/bootstrap` self-heals the case where Firebase succeeds but the Mongo
  record does not exist. Admin is never self-assignable.
- **Roles:** `student`, `tutor`, `admin`. Middleware chain: `auth` → `role(...)` →
  controller ownership checks. Client-side `ProtectedRoute` mirrors it, but the
  server is the authority.
- **Workflow:** student posts tuition → admin approves → tutors apply → student
  accepts one (others auto-rejected) → tutoring history → student reviews the
  tutor → admins moderate reports and tutor verification.
- **Messaging:** REST only, polled every 15s in the dashboards. No WebSockets.
- **Notifications:** lightweight in-app notifications polled by the navbar bell.

### Main API surface

| Prefix | What it covers |
| --- | --- |
| `/api/auth` | register, bootstrap, `me`, profile updates |
| `/api/tutors` | public search/profile/reviews, own profile, documents, applications, history |
| `/api/posts` | browse (approved only), own posts, apply, applications, close |
| `/api/applications` | accept/reject, received list, withdraw |
| `/api/messages` | conversations, thread, send |
| `/api/reports` | create a report, list own reports |
| `/api/notifications` | list, mark one/all read |
| `/api/admin` | stats, users, post moderation, tutor verification, reports |

Paginated endpoints accept `?page=` and `?limit=` (max 100) and return
`{ data, pagination }`. Public tutor/post responses are serialized to exclude
email, phone and document paths; contact goes through messaging.

---

## 5. Scripts & checks

```bash
# API
npm start        # node server.js
npm run dev      # nodemon
npm run seed     # demo data (non-destructive)
npm test         # node:test unit tests (no external services needed)

# Client
npm run dev
npm run build
npm run preview
```

A full manual smoke test after any change:

1. Register/login as student and tutor (email and Google).
2. Student: post tuition → admin approves → student sees it.
3. Tutor: find the post, apply, withdraw from another.
4. Student: accept an application → review the tutor.
5. Tutor: upload a document → admin verifies/rejects with a note.
6. Report a user/post → admin resolves it.
7. Exchange messages; check the navbar notification bell.

## 6. Known limitations / residual risk

- `npm audit` still reports non-critical advisories in transitive packages of
  Firebase JS SDK, Vite (dev-server only), React Router 6 and `@vercel/blob`.
  The available `--force` fixes would downgrade Firebase or jump major
  versions, so they were deliberately not applied. Re-check periodically.
- In-memory rate limits are per serverless instance (best-effort), and message
  delivery is 15-second polling rather than WebSockets — both intentional for
  the current Vercel setup.
- The client bundle is ~570 kB (Firebase dominates); Vite emits a size warning,
  but builds and deploys normally.

See `GAP_REGISTER.md` for the audit findings, the fix applied to each, and how
to verify it.
