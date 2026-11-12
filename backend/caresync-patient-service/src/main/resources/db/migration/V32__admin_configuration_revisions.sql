ALTER TABLE admin_configurations
    ADD COLUMN revision BIGINT NOT NULL DEFAULT 1 CHECK (revision >= 1);
