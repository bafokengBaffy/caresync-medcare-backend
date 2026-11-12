CREATE TABLE IF NOT EXISTS subscription_plans (
    code VARCHAR(64) PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    tier VARCHAR(24) NOT NULL CHECK (tier IN ('starter','professional','enterprise','custom')),
    description VARCHAR(1000) NOT NULL DEFAULT '',
    currency VARCHAR(3) NOT NULL DEFAULT 'ZAR' CHECK (currency IN ('ZAR','USD','EUR','GBP')),
    amount_minor BIGINT NOT NULL CHECK (amount_minor >= 0),
    billing_interval VARCHAR(16) NOT NULL CHECK (billing_interval IN ('monthly','quarterly','annual')),
    trial_days INTEGER NOT NULL DEFAULT 14 CHECK (trial_days BETWEEN 0 AND 60),
    seat_limit INTEGER CHECK (seat_limit IS NULL OR seat_limit >= 1),
    features JSONB NOT NULL DEFAULT '[]'::jsonb,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tenant_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL UNIQUE REFERENCES tenants(id) ON DELETE RESTRICT,
    plan_code VARCHAR(64) NOT NULL REFERENCES subscription_plans(code),
    pending_plan_code VARCHAR(64) REFERENCES subscription_plans(code),
    pending_plan_effective_at TIMESTAMPTZ,
    status VARCHAR(24) NOT NULL DEFAULT 'trialing' CHECK (status IN ('trialing','active','past_due','paused','canceled','expired','suspended')),
    current_period_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    current_period_end TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '1 month'),
    trial_ends_at TIMESTAMPTZ,
    cancel_at_period_end BOOLEAN NOT NULL DEFAULT FALSE,
    canceled_at TIMESTAMPTZ,
    seats_allocated INTEGER NOT NULL DEFAULT 1 CHECK (seats_allocated BETWEEN 1 AND 100000),
    payment_method VARCHAR(24) NOT NULL DEFAULT 'manual',
    dunning_attempts INTEGER NOT NULL DEFAULT 0 CHECK (dunning_attempts >= 0),
    last_payment_at TIMESTAMPTZ,
    coupon_code VARCHAR(40),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS subscription_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subscription_id UUID NOT NULL REFERENCES tenant_subscriptions(id) ON DELETE CASCADE,
    actor_id VARCHAR(128) NOT NULL,
    actor_name VARCHAR(320) NOT NULL DEFAULT '',
    action VARCHAR(32) NOT NULL,
    description VARCHAR(1000) NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_subscription_events_time ON subscription_events(subscription_id, occurred_at DESC);

INSERT INTO subscription_plans(code,name,tier,description,currency,amount_minor,billing_interval,trial_days,seat_limit,features)
VALUES
 ('starter','Starter','starter','Core clinic operations for small teams','ZAR',49900,'monthly',14,5,'[{"key":"patients","label":"Patient management","included":true},{"key":"appointments","label":"Appointments","included":true}]'),
 ('professional','Professional','professional','Expanded clinical workflows and team capacity','ZAR',129900,'monthly',14,25,'[{"key":"patients","label":"Patient management","included":true},{"key":"appointments","label":"Appointments","included":true},{"key":"reports","label":"Advanced reporting","included":true}]'),
 ('enterprise','Enterprise','enterprise','Platform-wide workflows for large care networks','ZAR',399900,'monthly',30,NULL,'[{"key":"patients","label":"Patient management","included":true},{"key":"appointments","label":"Appointments","included":true},{"key":"reports","label":"Advanced reporting","included":true},{"key":"integrations","label":"Priority integrations","included":true}]')
ON CONFLICT (code) DO NOTHING;

-- Do not manufacture subscription records for existing tenants. A billing
-- provider or an explicitly authorized provisioning action must create them.
