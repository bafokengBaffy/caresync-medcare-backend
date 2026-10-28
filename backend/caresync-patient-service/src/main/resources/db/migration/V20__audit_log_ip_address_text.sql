ALTER TABLE audit_logs
    ALTER COLUMN ip_address TYPE VARCHAR(255)
    USING ip_address::TEXT;
