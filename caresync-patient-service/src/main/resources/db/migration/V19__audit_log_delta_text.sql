ALTER TABLE audit_logs
    ALTER COLUMN delta TYPE TEXT
    USING delta::TEXT;
