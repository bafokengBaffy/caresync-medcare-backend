# CareSync Frontend

React 18 + Vite + TypeScript + Tailwind + Radix UI + React Query.

## Run

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open http://localhost:5000

For local development, update `.env.local` with your Firebase web-app settings if authentication is needed. `VITE_GATEWAY_URL` controls the development `/api` proxy. For production, configure `VITE_API_BASE_URL` and the public `VITE_FIREBASE_*` values in the hosting provider before building; do not put backend secrets in frontend variables.

## Profile image storage

The profile page uploads through the authenticated backend endpoint; configure `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_STORAGE_ENABLED=true`, and `SUPABASE_PROFILE_IMAGE_BUCKET` on the backend. The backend service-role key must never be exposed to the frontend. The reusable `ImageUpload` component can also perform direct Supabase uploads when no backend uploader is supplied; that optional path requires `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, Firebase as a Supabase third-party authentication provider, and Storage RLS restricting writes to each authenticated Firebase UID's folder. The profile-image bucket must allow public reads if the returned public URLs are to display without signed requests.

## Scripts

- `npm run dev` — dev server (proxy /api → gateway)
- `npm run build` — production build
- `npm run typecheck` — TS check
- `npm run lint` / `format`
- `npm run test` / `test:coverage`
- `npm run e2e`
