# Life Dashboard

A personal life dashboard: finance tracking (debit/credit, subscriptions, groceries,
remittances), savings goals, and freeform plans. Multi-user with per-account data
isolation, plus an admin view across every account.

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
│   ├── Dockerfile              # build: vite build → nginx:alpine serving dist/
│   ├── nginx.conf.template     # SPA fallback + reverse-proxy, envsubst's $BACKEND_ORIGIN
│   └── .env.example
├── jenkins/                    # local Jenkins image (Docker CLI, Terraform, JCasC)
├── terraform/                  # Render provisioning (main.tf, variables.tf, ...)
├── scripts/
│   └── verify.sh                # poll the live app until it responds
├── Dockerfile                  # backend image
├── docker-compose.yml          # local dev stack: db + backend + frontend
├── docker-compose.jenkins.yml  # local Jenkins
├── Jenkinsfile
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

## Docker

Run the whole stack (Postgres + backend + frontend) locally with:
```bash
docker compose up --build
```
Frontend at http://localhost, backend at http://localhost:8000. The frontend
image's nginx reverse-proxies `/auth`, `/transactions`, `/subscriptions`,
`/goals`, `/plans`, `/admin`, and `/health` to `$BACKEND_ORIGIN` (see
`frontend/nginx.conf.template`, envsubst'd in at container start - defaults
to `http://backend:8000`, the compose network hostname), so the built
frontend calls same-origin relative paths rather than hardcoding a backend
host. The same image is what Render deploys (see CI/CD below) - only
`BACKEND_ORIGIN` differs, set to the backend service's public Render URL.

> If port 8000 or 80 is already taken by something else on your machine, override
> the host side: `BACKEND_PORT=8010 FRONTEND_PORT=8080 docker compose up --build`.

## CI/CD: Claude Code → Docker → GitHub → Jenkins → Terraform → Render → Docker Hub → Deploy → Verify

Render builds and deploys straight from this repo's Dockerfiles (each
`render_web_service` in `terraform/main.tf` points at a `dockerfile_path`
with `auto_deploy = true`) - there's no separate SSH-into-a-server deploy
step or cloud IAM setup. `terraform apply` creates/updates the two web
services (backend, frontend) and a Postgres instance; Render's own
auto-deploy is what actually builds and runs them.

```
Docker images (Dockerfile, frontend/Dockerfile)
        ↓ git push
GitHub (this repo)
        ↓ Jenkins polls/clones on build; Render builds straight from here too
Jenkins pipeline (Jenkinsfile)
  ├─ Test        - backend import smoke test + frontend lint/typecheck
  ├─ Build images - docker build backend + frontend (still pushed to Docker
  │                 Hub as a versioned artifact, independent of Render)
  ├─ Push        - docker push to Docker Hub (ashishghmr8848/life-dashboard-*)
  │                                    [stages below run only when the job is
  │                                     started with PROVISION_RENDER=true]
  ├─ Terraform    - terraform apply (terraform/) creates/updates the Render
  │                 web services + Postgres instance
  └─ Verify       - scripts/verify.sh polls backend_url/health and
                    frontend_url until both respond, failing the build if
                    they don't (Render's first build can take a few minutes)
```

**Run Jenkins locally** (self-contained, nothing external required beyond a
GitHub token for cloning this repo):
```bash
cp .env.jenkins.example .env.jenkins   # fill in JENKINS_ADMIN_PASSWORD + GITHUB_TOKEN
docker compose -f docker-compose.jenkins.yml up -d --build
```
Open http://localhost:8080, log in with `JENKINS_ADMIN_USER` /
`JENKINS_ADMIN_PASSWORD`. Jenkins Configuration as Code (`jenkins/casc.yaml`)
auto-creates the `life-dashboard` pipeline job pointed at this repo's
`Jenkinsfile`, and a `github-creds` credential for cloning it - that's all it
sets up for you. To actually push images or deploy, add these credentials
yourself under **Manage Jenkins → Credentials** first (deliberately not
automated - they're real secrets):

| Credential ID | Type | Used for |
|---|---|---|
| `dockerhub-creds` | Username/password | A Docker Hub access token, for `docker push` |
| `render-api-key` | Secret text | Render API key (Account Settings), for `terraform apply`/`destroy` |
| `render-owner-id` | Secret text | Your Render owner id (`usr-...` or `tea-...`, same page) |
| `life-dashboard-jwt-secret` | Secret text | Real `JWT_SECRET_KEY` for the deployed backend |

**Provisioning Render is opt-in per build** — the job's `PROVISION_RENDER`
parameter defaults to `false`, so a normal build only builds/tests/pushes
images. Check it to also run Terraform and verify the deployed services;
check `DESTROY_AFTER_VERIFY` alongside it to have the job tear them back
down once verification passes, for a one-shot demo run. The `free` plan
(the default in `terraform/variables.tf`) doesn't bill, but does spin the
service down after inactivity and cold-start on the next request, and
Render's free Postgres expires after a fixed period - fine for a demo,
upgrade `plan`/`db_plan` to `starter` for anything longer-lived.

To run Terraform by hand instead of through Jenkins:
```bash
cd terraform
cp terraform.tfvars.example terraform.tfvars   # fill in your values
export RENDER_API_KEY=...      # from Render's Account Settings
export RENDER_OWNER_ID=...     # usr-... or tea-..., same page
export TF_VAR_jwt_secret_key=$(python -c "import secrets; print(secrets.token_urlsafe(48))")
terraform init
terraform apply
```

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

- Tie goals/plans together more (e.g. auto-update goal progress from
  transactions tagged toward that goal)
- Scheduled jobs (APScheduler) for due-date reminders, deploy to
  Railway/Render/Fly.io

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
- Auth is wired up (see "Accounts & admin"), but there's still no rate limiting,
  email verification, or password reset flow - add those before exposing this
  beyond a small trusted group.
