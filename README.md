# Life Dashboard

A personal life dashboard: finance tracking (debit/credit, subscriptions, groceries,
remittances), savings goals, freeform plans, and (in a later phase) Google Calendar sync.

## Stack

- **FastAPI** — API layer
- **SQLAlchemy** — ORM
- **PostgreSQL** — database
- **React + Vite + TypeScript** — frontend, styled with Tailwind CSS, data via
  React Query, charts via Recharts

## Project structure

```
life_dashboard/
├── app/
│   ├── main.py              # FastAPI app, router wiring, startup
│   ├── database.py          # engine, session, Base
│   ├── models/               # SQLAlchemy models
│   │   ├── transaction.py
│   │   ├── subscription.py
│   │   ├── goal.py
│   │   └── plan.py
│   ├── schemas/               # Pydantic request/response schemas
│   │   ├── transaction.py
│   │   ├── subscription.py
│   │   ├── goal.py
│   │   └── plan.py
│   └── routers/               # API endpoints
│       ├── transactions.py
│       ├── subscriptions.py
│       ├── goals.py
│       └── plans.py
├── frontend/                  # React + Vite dashboard UI
│   ├── src/
│   │   ├── components/        # layout, ui primitives, charts
│   │   ├── hooks/              # React Query hooks per resource
│   │   ├── lib/                 # api client, types, formatting, theme
│   │   └── pages/               # Dashboard, Transactions, Subscriptions, Goals, Plans
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
   `DATABASE_URL` with your credentials:
   ```bash
   cp .env.example .env
   ```

4. Run the app:
   ```bash
   uvicorn app.main:app --reload
   ```

5. Visit the interactive API docs at http://localhost:8000/docs to try out
   any endpoint directly.

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
   already configured for this origin in `app/main.py`).

Build for production with `npm run build` (output in `frontend/dist`); type-check
with `npx tsc -b` and lint with `npx oxlint`.

## What's built (Phase 1 + 2)

- Full CRUD for transactions, subscriptions, goals, and plans, backend and frontend
- `GET /transactions/summary` — spend grouped by category, for dashboard charts
- Health check at `GET /health`
- Dashboard UI: monthly spend/income, subscription run-rate, goals progress,
  spending-by-category chart, upcoming subscriptions, recent transactions
- Dedicated pages per resource (Transactions, Subscriptions, Goals, Plans) with
  filtering, create/edit modals, and delete confirmation
- Light/dark theme, responsive down to phone width

## What's next

- **Phase 3**: Google Calendar OAuth + sync (read meetings in, push subscription/plan
  reminders out — see commented dependencies in `requirements.txt`)
- **Phase 4**: tie goals/plans together more (e.g. auto-update goal progress from
  transactions tagged toward that goal)
- **Phase 5**: scheduled jobs (APScheduler) for calendar sync + due-date reminders,
  deploy to Railway/Render/Fly.io

## Known gaps (intentional for now, single-user local use)

- No auth/authz on any route — add it before exposing this outside localhost.
- No FK cascade behavior defined between subscriptions and their transactions;
  deleting a subscription with linked transactions currently relies on Postgres'
  default FK constraint behavior rather than an explicit `ondelete` policy.
- No server-side validation prevents a negative transaction amount.
- `GET /transactions/summary` sums debits and credits together per category; the
  frontend dashboard instead computes its own debit-only category breakdown
  client-side to avoid netting spend against income.

## Security notes

- Never commit `.env` (backend or frontend) — both are covered by `.gitignore`.
- When Google OAuth is added in Phase 3, store refresh tokens encrypted, not plaintext.
- No auth is wired up yet since this is single-user; add it before exposing this
  outside localhost.
