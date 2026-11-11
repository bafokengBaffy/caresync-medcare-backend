# Backend deployment

The patient service stores document bytes in a private Supabase Storage bucket and document metadata, including a protected CareSync media URL, in Supabase Postgres. Firestore is not used for document media.

Configure these environment variables on the Render patient service only:

- `SUPABASE_STORAGE_ENABLED=true`
- `SUPABASE_URL` — the Supabase project HTTPS URL (not an individual media URL)
- `SUPABASE_SERVICE_ROLE_KEY` — the Supabase service-role key; keep it only in Render/backend secrets
- `SUPABASE_STORAGE_BUCKET=caresync-bucket` — private patient document storage bucket
- `SUPABASE_PROFILE_IMAGE_BUCKET=caresync bucket` — profile-image bucket; configure the matching bucket in Supabase

Keep the patient document bucket private. The service validates the authenticated tenant and patient before listing, uploading, downloading, or deleting a document. Flyway migration `V11__patient_documents.sql` creates the tenant-isolated metadata table. The API returns `/api/v1/patients/{patientId}/documents/{documentId}/content` as the media URL; the gateway and frontend use the Firebase-authenticated API rather than a public bucket URL.

Profile images are uploaded through the authenticated `PATCH /api/v1/profile/image` endpoint. The server validates image signatures and size, removes metadata from JPEG and PNG images where supported, and stores each image under the authenticated Firebase UID with a random filename. If the frontend uses a public image URL, configure the separate profile-image bucket for public reads; keep the service-role key exclusively on the backend. `SUPABASE_STORAGE_ENABLED` must be `true` for storage operations.

## Firebase user sync and initial admin

The patient service mirrors Firebase Authentication users into `firebase_users` and polls Firebase once per minute. Configure `FIREBASE_BOOTSTRAP_ADMIN_EMAIL` in Render to allowlist initial tenant-scoped `ADMIN` users, and `FIREBASE_TENANT_ADMIN_EMAIL` for tenant administrators. Only accounts with an exact, verified email are promoted. Tenant admins receive the `TENANT_ADMIN` custom claim and the `caresync` tenant claim server-side, preserving other claims. Firebase passwords are never read by CareSync or used to assign roles.

Flyway migration `V12__seed_caresync_tenant.sql` creates the default tenant if it does not exist. After the patient service starts successfully with Supabase Postgres configured, wait for the first sync and sign out and back in so Firebase issues a token with the new claims. Remove the applicable allowlist variable from Render after confirming the role; the Firebase custom claim remains in place. Do not assign roles or tenant IDs from browser-provided data.

Firebase Authentication sign-in errors occur before the backend. The Firebase web app must use the same project as the Admin SDK, and Email/Password sign-in must be enabled in Firebase Authentication. The frontend build is configured for project `caresync-medcare-9e0a5`.

## Clinical analytics exports

The clinical service exposes tenant-scoped, manager/admin-only cohort exports at
`GET /api/v1/analytics/clinical-data?fromDate=YYYY-MM-DD&toDate=YYYY-MM-DD` (JSON) and
`GET /api/v1/analytics/clinical-data/csv?fromDate=YYYY-MM-DD&toDate=YYYY-MM-DD` (CSV).
Exports contain age bands, generalized gender groups, structured diagnosis codes, and
appointment-frequency bands. They contain no patient identifiers; cohorts smaller than
five patients are suppressed. Export actions are recorded in the existing audit log.
Date ranges are limited to the previous five years.

Structured diagnoses are recorded through the provider/admin-only
`POST /api/v1/diagnosis-codes` endpoint. The clinical migration
`V10__patient_diagnosis_codes.sql` creates its tenant-isolated storage. Clinical-service
Flyway is currently disabled in the application configuration, so apply this migration
using the project's database deployment process before using diagnosis capture or exports.
The resulting aggregate CSV/JSON can be loaded by `ai-ml/clinical-analytics.ipynb`.
