# Life Dashboard

A personal life dashboard: finance tracking (debit/credit, subscriptions, groceries,
remittances), savings goals, freeform plans, and (in a later phase) Google Calendar sync.
Multi-user with per-account data isolation, plus an admin view across every account.

## Stack

- **FastAPI** — API layer
- **SQLAlchemy** — ORM
- **PostgreSQL** — database
- **JWT auth** (bcrypt + PyJWT) — email/password accounts, per-user data isolation
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
│   │   └── security.py        # password hashing, JWT encode/decode
│   ├── models/               # SQLAlchemy models
│   │   ├── user.py
│   │   ├── transaction.py
│   │   ├── subscription.py
│   │   ├── goal.py
│   │   └── plan.py
│   ├── schemas/               # Pydantic request/response schemas
│   │   ├── user.py
│   │   ├── admin.py
│   │   ├── transaction.py
│   │   ├── subscription.py
│   │   ├── goal.py
│   │   └── plan.py
│   └── routers/               # API endpoints
│       ├── auth.py            # register / login / me
│       ├── admin.py           # admin-only: list/view every account
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
│   │                             Subscriptions, Goals, Plans, admin/
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
   `DATABASE_URL` with your credentials. Also generate a real `JWT_SECRET_KEY`
   (the example value is a placeholder, not usable as-is):
   ```bash
   cp .env.example .env
   python -c "import secrets; print(secrets.token_urlsafe(48))"  # paste into .env
   ```

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
> port) and update `frontend/.env`'s `VITE_API_BASE_URL` to match.

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
  only view it.

## What's built (Phase 1 + 2)

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
- Light/dark theme, responsive down to phone width

## What's next

- **Phase 3**: Google Calendar OAuth + sync (read meetings in, push subscription/plan
  reminders out — see commented dependencies in `requirements.txt`)
- **Phase 4**: tie goals/plans together more (e.g. auto-update goal progress from
  transactions tagged toward that goal)
- **Phase 5**: scheduled jobs (APScheduler) for calendar sync + due-date reminders,
  deploy to Railway/Render/Fly.io

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

## Security notes

- Never commit `.env` (backend or frontend) — both are covered by `.gitignore`.
  This includes `JWT_SECRET_KEY` - generate your own, never reuse the example.
- When Google OAuth is added in Phase 3, store refresh tokens encrypted, not plaintext.
- Auth is wired up (see "Accounts & admin"), but there's still no rate limiting,
  email verification, or password reset flow - add those before exposing this
  beyond a small trusted group.
