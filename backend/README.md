# vela backend

Node.js + Express + PostgreSQL/PostGIS API for the vela dating app —
profiles, photos, the swipe deck, and matches. Chat and Auth stay on
Firebase for now (see rationale below); this service is scoped to Section 5
& 6 of the Product Spec.

## Why this stack, at this scope

Built for a ~1,000-user MVP with **$0/month** infra cost:

- **Auth**: stays on **Firebase Auth** (phone/OTP). This backend never issues
  tokens or handles OTP — it only verifies the Firebase ID token the mobile
  app already has, via `firebase-admin`. Rebuilding auth would cost
  engineering time for zero savings (SMS still costs money either way).
- **Database**: [Neon](https://neon.tech) free tier — serverless Postgres
  with PostGIS, auto-wakes on request (no manual unpausing like some free
  tiers require).
- **Hosting**: [Render](https://render.com) free web service, or
  [Fly.io](https://fly.io) free allowance if you want to avoid Render's
  cold-start-after-idle behavior.
- **Chat**: intentionally left on Firestore for now — it already works, and
  migrating it isn't required to get the spec's core relational/geo wins.

## Local setup

```bash
npm install
cp .env.example .env
# fill in DATABASE_URL (Neon, or use `docker compose up -d` for local Postgres)
# fill in FIREBASE_SERVICE_ACCOUNT_JSON (Firebase Console -> Service Accounts)

npm run db:sync   # enables PostGIS, creates tables
npm run dev        # starts the API on http://localhost:4000
```

Optional local Postgres instead of Neon while developing:

```bash
docker compose up -d
# then set DATABASE_URL=postgres://vela:fuse_dev_password@localhost:5432/vela
```

## Auth model

Every request (except `/health`) must include:

```
Authorization: Bearer <firebase-id-token>
```

The middleware verifies it against Firebase, then finds-or-creates a row in
our own `users` table keyed by `firebase_uid`. Profile fields (name,
birthdate, bio, photos, etc.) are then filled in via `PATCH /users/:id`.

## Endpoints implemented (see spec Section 6)

| Method | Endpoint | Status |
|---|---|---|
| GET | `/users/:id` | ✅ |
| PATCH | `/users/:id` | ✅ |
| DELETE | `/users/:id` | ✅ (soft by default, `?hard=true` for permanent) |
| POST | `/users/:id/photos` | ✅ (registers an already-uploaded photo URL) |
| DELETE | `/users/:id/photos/:photoId` | ✅ |
| PATCH | `/users/:id/photos/order` | ✅ |
| GET | `/deck` | ✅ (PostGIS radius + preference filtering) |
| POST | `/swipes` | ✅ (also detects + creates matches) |
| GET | `/matches` | ✅ |
| POST | `/matches/:id/unmatch` | ✅ |
| POST | `/reports`, `/blocks` | ⏳ not yet implemented |

**Not included yet**: the actual photo *file upload* step (this API assumes
a client-side direct upload to S3/R2/Firebase Storage happens first, and
only the resulting URL is registered here — add a signed-upload-URL
endpoint when you're ready to wire that up), and the `blocks`/`reports`
tables referenced in the deck query's exclusion logic.

## Migrating the frontend incrementally

Don't rip out Firestore in one pass. Wrap existing calls behind the same
service interface (`UserService`, `DiscoverService`) and swap the
implementation underneath:

1. Point `UserService` at `GET/PATCH/DELETE /users/:id` — profile screens.
2. Point `DiscoverService` at `GET /deck` and `POST /swipes` — swipe screen.
3. Point `MatchesInboxScreen` at `GET /matches`.
4. Leave chat on Firestore until there's a concrete reason to move it.

Each screen can be migrated and verified independently instead of a
big-bang rewrite.
