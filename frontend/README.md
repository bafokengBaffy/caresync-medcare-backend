# CareSync Frontend

React 18 + Vite + TypeScript + Tailwind + Radix UI + React Query.

## Run

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open http://localhost:5173

For local development, update `.env.local` with your Firebase web-app settings if authentication is needed. `VITE_GATEWAY_URL` controls the development `/api` proxy. For production, configure `VITE_API_BASE_URL` and the public `VITE_FIREBASE_*` values in the hosting provider before building; do not put backend secrets in frontend variables.

## Scripts

- `npm run dev` — dev server (proxy /api → gateway)
- `npm run build` — production build
- `npm run typecheck` — TS check
- `npm run lint` / `format`
- `npm run test` / `test:coverage`
- `npm run e2e`
