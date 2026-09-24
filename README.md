# BK Football Predictions — Web

Vue 3 and Vite frontend for the BK customer experience and dedicated owner control room.

The customer experience is a mobile-first Progressive Web App styled with Tailwind CSS v4. It includes a standalone manifest, generated install icons, an offline application shell, light and dark themes, phone bottom navigation, and an in-app install prompt where supported.

## Run locally

The frontend dev server proxies `/api` and `/media` to Django. Keep both processes running in separate terminals.

Terminal 1:

```powershell
cd ..\bk_footballpredictions_api
.\.venv\Scripts\python.exe manage.py runserver 127.0.0.1:8000
```

Terminal 2:

```powershell
npm install
npm run dev
```

Open the URL printed by Vite, normally `http://127.0.0.1:5173`. If Django is not running, proxied API requests will fail and data-driven sections cannot load.

The seeded local owner signs in through `/login` and is routed to `/owner`.

## Commands

```powershell
npm run dev
npm run build
npm run preview
npm run generate:pwa-assets
```

`generate:pwa-assets` rebuilds the PWA icons from `public/favicon.svg`. Production builds generate `manifest.webmanifest`, `sw.js`, and the Workbox runtime. API, media, owner, authentication, subscription, and premium prediction responses are not runtime-cached.

The MVP scope and post-execution checklist live in [MVP_EXECUTION_PLAN.md](./MVP_EXECUTION_PLAN.md).

## Production

The repositories include a same-origin Namecheap cPanel/Passenger deployment
setup for the Vue PWA, Django API, uploaded media, and MariaDB. See
[DEPLOYMENT.md](./DEPLOYMENT.md) for configuration and launch steps.
