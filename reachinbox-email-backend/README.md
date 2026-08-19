# ReachInbox Scheduler (Backend)

Express + TypeScript backend for the ReachInbox email scheduling assignment.

It provides:
- Scheduling API (`POST /api/v1/email-batches`)
- Dashboard APIs:
  - `GET /api/v1/emails/scheduled`
  - `GET /api/v1/emails/sent`
- Real Google OAuth (Passport) with sessions
- BullMQ + Redis worker that sends emails via Ethereal SMTP
- Persistent state in **PostgreSQL** (Prisma)

The UI is deployed from a separate repo: `reachinbox-email-frontend/`.

## Prerequisites

- Node.js 18+
- Redis
- PostgreSQL

## Setup

1. Install:
   ```bash
   npm install
   ```
2. Env:
   - Copy `env.example` to `.env`
   - Fill in:
     - `DATABASE_URL` (PostgreSQL)
     - `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
     - `GOOGLE_CALLBACK_URL`
     - Ethereal SMTP values
3. Ethereal credentials:
   ```bash
   npm run create-ethereal
   ```
   Copy the printed `ETHEREAL_SMTP_*` values into `.env`.

## Database migrations

```bash
npm run prisma:generate
npm run prisma:migrate
```

For production:
```bash
npx prisma migrate deploy
```

## Run

In one terminal:
```bash
npm run dev
```

In another terminal:
```bash
npm run dev:worker
```

### Single-process mode (free deploy friendly)

Set in `.env`:
```env
START_WORKER_IN_PROCESS=true
```

Then only run:
```bash
npm run dev
```

## Optional: local Docker

```bash
docker compose up -d
```

Docker Compose starts:
- PostgreSQL (port `5432`)
- Redis (port `6379`)

Local `DATABASE_URL`:
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/reachinbox_scheduler?schema=public
```

## Configuration notes (production)

- `FRONTEND_URL` must be set to your Vercel frontend URL (used for CORS + OAuth redirect flow).
- `GOOGLE_CALLBACK_URL` must be set to: `https://<your-api-domain>/auth/google/callback`

## Deploy (Render + Vercel, free-friendly)

### Database (Render Postgres free)
1. Create a **Free Render Postgres** database
2. Copy the **External Database URL** into `DATABASE_URL`
3. Run `npx prisma migrate deploy` once

### API (Render Web Service free)
- Set `START_WORKER_IN_PROCESS=true` so you don't need a paid worker service
- Note: Render **free web services block SMTP (port 587)** — scheduling/auth works, but email sending may fail on Render free. For full email demo, use Fly.io or run worker locally.

### Frontend (Vercel)
- Repo: `reachinbox-email-frontend`
- Env: `VITE_API_BASE_URL=https://<your-api-domain>`
