-- AutoFlow Governance Sync Schema (MVP)
-- PostgreSQL

CREATE TABLE IF NOT EXISTS project_stages (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    stage_name      VARCHAR(100) NOT NULL,
    stage_order     INT NOT NULL,
    status          VARCHAR(30) NOT NULL DEFAULT 'TODO',
    completion_rate NUMERIC(5,2) NOT NULL DEFAULT 0,
    owner_name      VARCHAR(100),
    is_current      BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS stage_gate_rules (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stage_name              VARCHAR(100) NOT NULL,
    rule_code               VARCHAR(100) UNIQUE NOT NULL,
    rule_name               VARCHAR(200) NOT NULL,
    required                BOOLEAN NOT NULL DEFAULT TRUE,
    severity                VARCHAR(20) NOT NULL,
    condition_expression    TEXT,
    recommended_action      TEXT,
    created_at              TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS stage_gate_checks (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id          UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    project_stage_id    UUID NOT NULL REFERENCES project_stages(id) ON DELETE CASCADE,
    gate_rule_id        UUID NOT NULL REFERENCES stage_gate_rules(id) ON DELETE CASCADE,
    check_result        BOOLEAN NOT NULL,
    actual_value        VARCHAR(200),
    expected_value      VARCHAR(200),
    note                TEXT,
    checked_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS alerts (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id          UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    stage_name          VARCHAR(100),
    severity            VARCHAR(20) NOT NULL,
    title               VARCHAR(200) NOT NULL,
    message             TEXT NOT NULL,
    recommended_action  TEXT,
    status              VARCHAR(20) NOT NULL DEFAULT 'open',
    triggered_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    resolved_at         TIMESTAMP
);

CREATE TABLE IF NOT EXISTS agent_reviews (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id          UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    agent_name          VARCHAR(100) NOT NULL,
    review_type         VARCHAR(100),
    summary             TEXT NOT NULL,
    issues              TEXT,
    recommendations     TEXT,
    confidence_score    NUMERIC(5,2),
    reviewed_at         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
