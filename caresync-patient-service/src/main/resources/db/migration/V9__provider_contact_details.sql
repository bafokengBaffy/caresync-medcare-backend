ALTER TABLE providers
    ADD COLUMN IF NOT EXISTS email VARCHAR(320),
    ADD COLUMN IF NOT EXISTS phone_number VARCHAR(32),
    ADD COLUMN IF NOT EXISTS npi VARCHAR(16),
    ADD COLUMN IF NOT EXISTS years_of_experience INTEGER,
    ADD COLUMN IF NOT EXISTS bio TEXT;

ALTER TABLE providers
    ADD CONSTRAINT chk_provider_experience_nonnegative
    CHECK (years_of_experience IS NULL OR years_of_experience >= 0);
