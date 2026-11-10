ALTER TABLE patients
    ADD COLUMN firebase_uid VARCHAR(128)
        REFERENCES firebase_users(firebase_uid) ON DELETE SET NULL;

CREATE UNIQUE INDEX uq_patients_tenant_firebase_uid
    ON patients(tenant_id, firebase_uid)
    WHERE firebase_uid IS NOT NULL;

CREATE INDEX idx_patients_firebase_uid
    ON patients(firebase_uid)
    WHERE firebase_uid IS NOT NULL;
