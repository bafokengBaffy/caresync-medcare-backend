# Backend deployment

The patient service stores document bytes in a private Supabase Storage bucket and document metadata, including a protected CareSync media URL, in Supabase Postgres. Firestore is not used for document media.

Configure these environment variables on the Render patient service only:

- `SUPABASE_STORAGE_ENABLED=true`
- `SUPABASE_URL` — the Supabase project HTTPS URL (not an individual media URL)
- `SUPABASE_SERVICE_ROLE_KEY` — the Supabase service-role key; keep it only in Render/backend secrets
- `SUPABASE_STORAGE_BUCKET=caresync-bucket`

Keep the bucket private. The service validates the authenticated tenant and patient before listing, uploading, downloading, or deleting a document. Flyway migration `V11__patient_documents.sql` creates the tenant-isolated metadata table. The API returns `/api/v1/patients/{patientId}/documents/{documentId}/content` as the media URL; the gateway and frontend use the Firebase-authenticated API rather than a public bucket URL.
