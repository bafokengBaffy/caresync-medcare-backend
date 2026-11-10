ALTER TABLE firebase_users
    ADD COLUMN deleted_at TIMESTAMPTZ;

CREATE INDEX idx_firebase_users_deleted_at
    ON firebase_users(deleted_at)
    WHERE deleted_at IS NOT NULL;
