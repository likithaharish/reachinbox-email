# ReachInbox Scheduler (Frontend)

React + TypeScript + Tailwind dashboard for the ReachInbox email scheduling assignment.

This frontend talks to the backend API over:
`VITE_API_BASE_URL` (you must deploy backend separately).

## Prerequisites

- Node.js 18+

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Env:
   - Copy `env.example` to `.env`
3. Run:
   ```bash
   npm run dev
   ```

## Configuration

`VITE_API_BASE_URL` - Backend base URL, e.g. `http://localhost:5177` or `https://your-api-domain.com`.

## What this frontend provides

- Real Google OAuth login (redirect handled by the backend)
- Dashboard tabs:
  - Scheduled Emails
  - Sent Emails
- Compose New Email modal:
  - Subject + Body
  - CSV/text upload and lead email extraction
  - Start time, delay between emails, hourly limit

## Deploy (Vercel)

1. Import this repo in Vercel
2. Set env: `VITE_API_BASE_URL=https://<your-render-api-url>`
3. Deploy
