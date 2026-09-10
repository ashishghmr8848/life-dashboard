# Life Dashboard

A personal life dashboard: finance tracking (debit/credit, subscriptions, groceries,
remittances), savings goals, freeform plans, and Google Calendar sync for
subscription/plan due-dates. Multi-user with per-account data isolation, plus an
admin view across every account.

## Stack

- **FastAPI** — API layer
- **SQLAlchemy** — ORM
- **PostgreSQL** — database
- **JWT auth** (bcrypt + PyJWT) — email/password accounts, per-user data isolation
- **Google Calendar API** (OAuth2) — push subscription/plan due-dates as reminders
- **React + Vite + TypeScript** — frontend, styled with Tailwind CSS, data via
  React Query, charts via Recharts

## Project structure

```
life_dashboard/
├── app/
│   ├── main.py              # FastAPI app, router wiring, startup
│   ├── database.py          # engine, session, Base
│   ├── auth.py                # get_current_user / get_current_admin dependencies
│   ├── core/
│   │   ├── security.py        # password hashing, JWT encode/decode
│   │   └── crypto.py           # Fernet encrypt/decrypt for stored Google tokens
│   ├── integrations/
│   │   ├── google_calendar.py  # OAuth flow + Calendar API event create/update/delete
│   │   └── sync_hooks.py       # best-effort push, called from the subscription/plan routers
│   ├── models/               # SQLAlchemy models
│   │   ├── user.py
│   │   ├── google_integration.py
│   │   ├── transaction.py
│   │   ├── subscription.py
│   │   ├── goal.py
│   │   └── plan.py
│   ├── schemas/               # Pydantic request/response schemas
│   │   ├── user.py
│   │   ├── admin.py
│   │   ├── integration.py
│   │   ├── transaction.py
│   │   ├── subscription.py
│   │   ├── goal.py
│   │   └── plan.py
│   └── routers/               # API endpoints
│       ├── auth.py            # register / login / me
│       ├── admin.py           # admin-only: list/view every account
│       ├── integrations.py    # Google Calendar connect/callback/status/sync
│       ├── transactions.py
│       ├── subscriptions.py
│       ├── goals.py
│       └── plans.py
├── frontend/                  # React + Vite dashboard UI
│   ├── src/
│   │   ├── components/        # layout, ui primitives, charts, route guards
│   │   ├── context/            # AuthContext (session, login/register/logout)
│   │   ├── hooks/              # React Query hooks per resource
│   │   ├── lib/                 # api client, types, formatting, theme
│   │   └── pages/               # Login, Register, Dashboard, Transactions,
│   │                             Subscriptions, Goals, Plans, Settings, admin/
│   └── .env.example
├── requirements.txt
└── .env.example
```

## Setup

### Backend

1. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # Windows: venv\Scripts\activate
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Create a Postgres database and copy `.env.example` to `.env`, updating
   `DATABASE_URL` with your credentials. Also generate real values for
   `JWT_SECRET_KEY` and `GOOGLE_TOKEN_ENCRYPTION_KEY` (the example values are
   placeholders, not usable as-is):
   ```bash
   cp .env.example .env
   python -c "import secrets; print(secrets.token_urlsafe(48))"                          # -> JWT_SECRET_KEY
   python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"  # -> GOOGLE_TOKEN_ENCRYPTION_KEY
   ```
   Google Calendar sync (`GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`) is optional -
   the app runs fine without it, "Connect Google Calendar" in Settings just shows
   a clear "not configured" message until you set it up (see below).

4. Run the app:
   ```bash
   uvicorn app.main:app --reload
   ```

5. Visit the interactive API docs at http://localhost:8000/docs to try out
   any endpoint directly. Auth-protected routes need a token: register or log
   in via `/auth/register` or `/auth/login`, then use the "Authorize" button
   in the docs UI with the returned `access_token`.

Tables are auto-created on startup for now (`Base.metadata.create_all`).
Once the schema stabilizes, switch to Alembic migrations:
```bash
alembic init alembic
# then configure alembic/env.py to use app.database.Base.metadata
```

> **Note:** if something else on your machine is already bound to port 8000
> (e.g. a Docker container), start uvicorn with `--port 8001` (or any free
> port) and update `frontend/.env`'s `VITE_API_BASE_URL`, and `.env`'s
> `GOOGLE_REDIRECT_URI`, to match.

### Frontend

1. Install dependencies:
   ```bash
   cd frontend
   npm install
   ```

2. Copy the env file (defaults to the backend at `http://localhost:8000`):
   ```bash
   cp .env.example .env
   ```

3. Run the dev server:
   ```bash
   npm run dev
   ```

4. Visit http://localhost:5173 — the backend must be running (CORS is
   already configured for this origin in `app/main.py`). You'll land on the
   sign-in page; use "Sign up" to create an account.

Build for production with `npm run build` (output in `frontend/dist`); type-check
with `npx tsc -b` and lint with `npx oxlint`.

### Google Calendar setup

Optional - everything else works without it. Connects at the account level
(Settings → Google Calendar), one Google account per Life Dashboard account.

1. Go to [console.cloud.google.com](https://console.cloud.google.com) and
   create a project (or reuse one you already have).
2. **APIs & Services → Library** → enable the **Google Calendar API**.
3. **APIs & Services → OAuth consent screen** → configure it. For personal/family
   use, choose "External," fill in the required fields, and add each Google
   account that will use this (including your own) as a **test user** - no
   Google review is needed while it stays in testing mode.
4. **APIs & Services → Credentials → Create Credentials → OAuth client ID**,
   type **Web application**. Under "Authorized redirect URIs," add exactly the
   value of `GOOGLE_REDIRECT_URI` in your `.env` (e.g.
   `http://localhost:8000/integrations/google/callback` - or `:8001` if
   that's the port you're actually running on; see the note above).
5. Copy the generated **Client ID** and **Client secret** into `.env`'s
   `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`, then restart the backend.
6. In the app: Settings → "Connect Google Calendar." You'll be sent to Google's
   consent screen and back; the redirect specifically requires `localhost` or
   `127.0.0.1` to work without HTTPS, which Google supports natively for local
   development - no tunnel or public domain needed.

Once connected, every subscription and every dated plan gets a matching
all-day event on your primary calendar (creating/editing one updates the
same event rather than duplicating it), kept in sync automatically as you
edit them, plus a manual "Sync now" for anything that existed before you
connected.

## Accounts & admin

- Anyone can self-register via the Sign Up page (`POST /auth/register`). There's
  no invite step.
- **The very first account ever registered becomes admin automatically.** Every
  account after that is a regular user. There's no other bootstrap step - if you
  need a second admin, promote one from the admin panel (or directly in the
  database via `UPDATE users SET is_admin = true WHERE email = '...'`).
- Every transaction, subscription, goal, and plan belongs to exactly one user.
  Regular users can only ever see or modify their own data - every router filters
  by the authenticated user's id, and looking up another user's record by id
  returns a plain 404, not a permissions error (so ids never leak existence).
- Admins get an "Admin" nav link and `/admin`: an overview of every account
  (spend, income, subscription run-rate, transaction/goal counts) with a
  read-only drill-in per account, plus the ability to promote/demote admin
  access or enable/disable an account. Admins can't demote or disable
  themselves (no accidental lockout). Admins cannot edit another user's data,
  only view it. Google Calendar connections are per-account and not visible
  to admins at all.

## What's built (Phase 1 + 2 + 3)

- Full CRUD for transactions, subscriptions, goals, and plans, backend and frontend
- `GET /transactions/summary` — spend grouped by category, for dashboard charts
- Health check at `GET /health`
- Multi-user auth (register/login/me) with per-user data isolation, and an
  admin overview across every account (see "Accounts & admin" above)
- Dashboard UI: monthly spend/income, subscription run-rate, goals progress,
  spending-by-category chart, daily spend trend, upcoming subscriptions,
  recent transactions, quick-add for both expenses and income
- Dedicated pages per resource (Transactions, Subscriptions, Goals, Plans) with
  filtering, create/edit modals, and delete confirmation
- "Log charge" on a subscription - records the actual transaction (so it counts
  toward Spend) and rolls the subscription's next due date forward
- **Google Calendar sync** (push only): subscriptions and dated plans sync to
  the connected Google account as all-day reminder events, automatically on
  create/edit, plus a manual re-sync (see "Google Calendar setup" above)
- Light/dark theme, responsive down to phone width

## What's next

- Pull calendar events *in* (read-only view of upcoming Google Calendar events
  on the dashboard) - the push direction was built first per the original scope
- **Phase 4**: tie goals/plans together more (e.g. auto-update goal progress from
  transactions tagged toward that goal)
- **Phase 5**: scheduled jobs (APScheduler) for due-date reminders that don't
  depend on the app being open, deploy to Railway/Render/Fly.io

## Known gaps

- No FK cascade behavior defined between subscriptions and their transactions;
  deleting a subscription with linked transactions currently relies on Postgres'
  default FK constraint behavior rather than an explicit `ondelete` policy.
- No server-side validation prevents a negative transaction amount.
- `GET /transactions/summary` sums debits and credits together per category; the
  frontend dashboard instead computes its own debit-only category breakdown
  client-side to avoid netting spend against income.
- No email verification, password reset, or rate limiting on login attempts.
- The frontend stores the JWT in `localStorage` (standard for a cross-origin
  SPA+API in local dev), which is more exposed to XSS than an httpOnly cookie
  would be. Reasonable for personal/family use on trusted machines; worth
  revisiting (e.g. httpOnly cookie + matching domain/HTTPS) before exposing
  this beyond localhost to people you don't trust with each other's sessions.
- Google sync is push-only and best-effort: a sync failure (API hiccup, a
  revoked grant) never blocks saving the subscription/plan itself, but also
  isn't retried automatically - "Sync now" is the recovery path. If Google's
  consent screen stays in "testing" mode (see setup steps), only accounts
  added as test users can connect, and Google expires testing-mode refresh
  tokens after 7 days - publish the OAuth consent screen (Google's own review
  process) before relying on this beyond your own testing.

## Security notes

- Never commit `.env` (backend or frontend) — both are covered by `.gitignore`.
  This includes `JWT_SECRET_KEY` and `GOOGLE_TOKEN_ENCRYPTION_KEY` - generate
  your own, never reuse the example values.
- Google refresh tokens are stored encrypted at rest (`app/core/crypto.py`,
  Fernet symmetric encryption), never in plaintext - satisfies the note this
  file used to carry as a to-do for when Phase 3 got built.
- The OAuth flow requests only `calendar.events` scope (create/update/delete
  events we made) plus `openid`/`userinfo.email` to show which account is
  connected - never broader calendar read access.
- Auth is wired up (see "Accounts & admin"), but there's still no rate limiting,
  email verification, or password reset flow - add those before exposing this
  beyond a small trusted group.
