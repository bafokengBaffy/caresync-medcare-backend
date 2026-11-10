ALTER TABLE appointments
    ALTER COLUMN patient_id DROP NOT NULL,
    ADD COLUMN guest_name VARCHAR(200),
    ADD COLUMN guest_email VARCHAR(320),
    ADD COLUMN guest_phone VARCHAR(32),
    ADD COLUMN guest_location VARCHAR(500),
    ADD CONSTRAINT chk_appointment_guest_identity
        CHECK (
            patient_id IS NOT NULL
            OR (guest_name IS NOT NULL AND guest_email IS NOT NULL AND guest_phone IS NOT NULL)
        );

CREATE INDEX idx_appointments_tenant_guest_email
    ON appointments (tenant_id, lower(guest_email))
    WHERE patient_id IS NULL;
