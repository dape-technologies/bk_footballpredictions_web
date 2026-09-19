# BK Football Predictions — Web

Vue 3 and Vite frontend for the BK customer experience and dedicated owner control room.

## Run locally

Start the Django API on `127.0.0.1:8000`, then run:

```powershell
npm install
npm run dev
```

Open `http://127.0.0.1:5173`. Vite proxies `/api` and `/media` requests to Django.

The seeded local owner signs in through `/login` and is routed to `/owner`.

## Commands

```powershell
npm run dev
npm run build
npm run preview
```

The MVP scope and post-execution checklist live in [MVP_EXECUTION_PLAN.md](./MVP_EXECUTION_PLAN.md).
