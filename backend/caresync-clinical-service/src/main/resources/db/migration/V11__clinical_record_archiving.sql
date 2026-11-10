ALTER TABLE dental_charts ADD COLUMN archived_at TIMESTAMPTZ;
ALTER TABLE eye_exams ADD COLUMN archived_at TIMESTAMPTZ;

CREATE INDEX idx_dental_charts_active_tenant_date
    ON dental_charts (tenant_id, chart_date DESC) WHERE archived_at IS NULL;
CREATE INDEX idx_eye_exams_active_tenant_date
    ON eye_exams (tenant_id, exam_date DESC) WHERE archived_at IS NULL;
