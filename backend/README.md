# Backend deployment

The patient service stores document bytes in a private Supabase Storage bucket and document metadata, including a protected CareSync media URL, in Supabase Postgres. Firestore is not used for document media.

Configure these environment variables on the Render patient service only:

- `SUPABASE_STORAGE_ENABLED=true`
- `SUPABASE_URL` — the Supabase project HTTPS URL (not an individual media URL)
- `SUPABASE_SERVICE_ROLE_KEY` — the Supabase service-role key; keep it only in Render/backend secrets
- `SUPABASE_STORAGE_BUCKET=caresync-bucket`

Keep the bucket private. The service validates the authenticated tenant and patient before listing, uploading, downloading, or deleting a document. Flyway migration `V11__patient_documents.sql` creates the tenant-isolated metadata table. The API returns `/api/v1/patients/{patientId}/documents/{documentId}/content` as the media URL; the gateway and frontend use the Firebase-authenticated API rather than a public bucket URL.

## Firebase user sync and initial admin

The patient service mirrors Firebase Authentication users into `firebase_users` and polls Firebase once per minute. Configure `FIREBASE_BOOTSTRAP_ADMIN_EMAIL` in Render to allowlist the initial administrator; only a Firebase user with that exact, verified email is promoted. The service assigns the `ADMIN` custom claim and the `caresync` tenant claim server-side, preserving other claims. Firebase passwords are never read by CareSync or used to assign roles.

Flyway migration `V12__seed_caresync_tenant.sql` creates the default tenant if it does not exist. After the patient service starts successfully with Supabase Postgres configured, wait for the first sync and sign out and back in so Firebase issues a token with the new claims. Remove `FIREBASE_BOOTSTRAP_ADMIN_EMAIL` from Render after confirming the role; the Firebase custom claim remains in place. Do not assign roles or tenant IDs from browser-provided data.

Firebase Authentication sign-in errors occur before the backend. The Firebase web app must use the same project as the Admin SDK, and Email/Password sign-in must be enabled in Firebase Authentication. The frontend build is configured for project `caresync-medcare-9e0a5`.
