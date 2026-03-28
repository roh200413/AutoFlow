-- =========================================================
-- 프로젝트 의사결정 지원 툴 - 1차 전체 SQL
-- PostgreSQL 기준
-- =========================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =========================================================
-- updated_at 공통 함수
-- =========================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =========================================================
-- 1. workflow_stages
-- 공통 단계 마스터
-- =========================================================
CREATE TABLE workflow_stages (
    code            VARCHAR(50) PRIMARY KEY,
    name            VARCHAR(100) NOT NULL,
    description     TEXT,
    sort_order      INT NOT NULL
);

INSERT INTO workflow_stages (code, name, description, sort_order) VALUES
('INIT', '초기기획', '프로젝트 시작 및 기본 방향 정의 단계', 1),
('REQUIREMENT', '요구사항분석', '요구사항 수집 및 범위 정의 단계', 2),
('DATA_PREP', '데이터준비', '데이터 확보 및 품질 점검 단계', 3),
('MODEL_PLAN', '모델기획', '모델링 전략 및 접근 방식 검토 단계', 4),
('POC', 'PoC수행', '실증 및 개념검증 단계', 5),
('REPORT', '결과정리', '결과 정리 및 보고 단계', 6);

-- =========================================================
-- 2. projects
-- 프로젝트 기본 정보
-- =========================================================
CREATE TABLE projects (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name                VARCHAR(200) NOT NULL,
    project_type        VARCHAR(50) NOT NULL,      -- GOV, POC, INTERNAL
    current_stage_code  VARCHAR(50) NOT NULL REFERENCES workflow_stages(code),
    status              VARCHAR(30) NOT NULL DEFAULT 'ACTIVE', -- ACTIVE, HOLD, DONE
    description         TEXT,
    created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_projects_stage ON projects(current_stage_code);
CREATE INDEX idx_projects_type ON projects(project_type);
CREATE INDEX idx_projects_status ON projects(status);

CREATE TRIGGER trg_projects_updated_at
BEFORE UPDATE ON projects
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =========================================================
-- 3. project_contexts
-- 프로젝트 현재 상태값 저장
-- 예:
-- has_data = false
-- requirement_defined = true
-- customer_confirmed = false
-- =========================================================
CREATE TABLE project_contexts (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    context_key     VARCHAR(100) NOT NULL,
    context_value   VARCHAR(200),
    updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(project_id, context_key)
);

CREATE INDEX idx_project_contexts_project ON project_contexts(project_id);
CREATE INDEX idx_project_contexts_key ON project_contexts(context_key);

-- =========================================================
-- 4. action_templates
-- 단계별 기본 해야 할 일 템플릿
-- =========================================================
CREATE TABLE action_templates (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stage_code      VARCHAR(50) NOT NULL REFERENCES workflow_stages(code) ON DELETE CASCADE,
    title           VARCHAR(200) NOT NULL,
    description     TEXT,
    is_required     BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order      INT NOT NULL DEFAULT 1
);

CREATE INDEX idx_action_templates_stage ON action_templates(stage_code);

INSERT INTO action_templates (stage_code, title, description, is_required, sort_order) VALUES
('INIT', '프로젝트 목적 정의', '프로젝트의 목적과 기대 결과를 명확히 정리한다.', TRUE, 1),
('INIT', '프로젝트 범위 설정', '이번 프로젝트에서 포함/제외할 범위를 구분한다.', TRUE, 2),

('REQUIREMENT', '현행 프로세스 파악', '현재 업무 흐름과 운영 방식을 정리한다.', TRUE, 1),
('REQUIREMENT', '이해관계자 확인', '고객, 사용자, 내부 담당자 등 주요 이해관계자를 식별한다.', TRUE, 2),
('REQUIREMENT', '입력/출력 정의', '시스템 입력값과 출력값을 정의한다.', TRUE, 3),
('REQUIREMENT', '성공 기준 수립', 'PoC 또는 프로젝트 성공 여부를 판단할 KPI를 정의한다.', TRUE, 4),

('DATA_PREP', '데이터 보유 여부 확인', '데이터 존재 여부와 확보 가능성을 확인한다.', TRUE, 1),
('DATA_PREP', '데이터 스펙 정리', '파일 형식, 수량, 라벨 유무 등 데이터 정보를 정리한다.', TRUE, 2),
('DATA_PREP', '데이터 품질 점검', '결측, 이상치, 클래스 불균형 등을 확인한다.', TRUE, 3),

('MODEL_PLAN', '접근 방식 검토', '지도학습, 비지도학습, 규칙기반 등 접근 방식을 검토한다.', TRUE, 1),
('MODEL_PLAN', '평가 방식 정의', '정확도, 재현율, 오검률 등 평가 지표를 정의한다.', TRUE, 2),

('POC', 'PoC 범위 확정', '검증 범위와 제외 범위를 명확히 정의한다.', TRUE, 1),
('POC', '검증 시나리오 수립', '어떤 기준으로 테스트할지 시나리오를 정리한다.', TRUE, 2),
('POC', '실증 수행', '정의된 시나리오에 따라 PoC를 수행한다.', TRUE, 3),

('REPORT', '결과 정리', '성과, 한계, 후속 과제를 문서화한다.', TRUE, 1),
('REPORT', '보고 자료 작성', '내부/외부 공유용 보고 자료를 작성한다.', TRUE, 2);

-- =========================================================
-- 5. project_actions
-- 실제 프로젝트 액션
-- =========================================================
CREATE TABLE project_actions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    title           VARCHAR(200) NOT NULL,
    description     TEXT,
    source_type     VARCHAR(30) NOT NULL DEFAULT 'MANUAL',    -- TEMPLATE, MANUAL, RULE
    status          VARCHAR(30) NOT NULL DEFAULT 'TODO',      -- TODO, DOING, DONE, HOLD
    priority        VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',    -- LOW, MEDIUM, HIGH, CRITICAL
    due_date        DATE,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_project_actions_project ON project_actions(project_id);
CREATE INDEX idx_project_actions_status ON project_actions(status);
CREATE INDEX idx_project_actions_priority ON project_actions(priority);

CREATE TRIGGER trg_project_actions_updated_at
BEFORE UPDATE ON project_actions
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =========================================================
-- 6. project_workflows
-- 프로젝트별 워크플로우 캔버스
-- =========================================================
CREATE TABLE project_workflows (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name            VARCHAR(200) NOT NULL,
    description     TEXT,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    version_no      INT NOT NULL DEFAULT 1,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_project_workflows_project ON project_workflows(project_id);

CREATE TRIGGER trg_project_workflows_updated_at
BEFORE UPDATE ON project_workflows
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =========================================================
-- 7. project_workflow_nodes
-- 워크플로우 노드(박스)
-- =========================================================
CREATE TABLE project_workflow_nodes (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id         UUID NOT NULL REFERENCES project_workflows(id) ON DELETE CASCADE,

    node_type           VARCHAR(50) NOT NULL,   -- START, END, STAGE, ACTION, DECISION, DOCUMENT
    title               VARCHAR(200) NOT NULL,
    description         TEXT,

    ref_stage_code      VARCHAR(50) REFERENCES workflow_stages(code),
    ref_action_id       UUID REFERENCES project_actions(id) ON DELETE SET NULL,

    pos_x               NUMERIC(10,2) NOT NULL DEFAULT 0,
    pos_y               NUMERIC(10,2) NOT NULL DEFAULT 0,
    width               NUMERIC(10,2) NOT NULL DEFAULT 180,
    height              NUMERIC(10,2) NOT NULL DEFAULT 80,

    style_json          JSONB,
    meta_json           JSONB,

    created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_project_workflow_nodes_workflow ON project_workflow_nodes(workflow_id);
CREATE INDEX idx_project_workflow_nodes_type ON project_workflow_nodes(node_type);
CREATE INDEX idx_project_workflow_nodes_stage ON project_workflow_nodes(ref_stage_code);

CREATE TRIGGER trg_project_workflow_nodes_updated_at
BEFORE UPDATE ON project_workflow_nodes
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =========================================================
-- 8. project_workflow_edges
-- 워크플로우 연결선
-- =========================================================
CREATE TABLE project_workflow_edges (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id         UUID NOT NULL REFERENCES project_workflows(id) ON DELETE CASCADE,

    source_node_id      UUID NOT NULL REFERENCES project_workflow_nodes(id) ON DELETE CASCADE,
    target_node_id      UUID NOT NULL REFERENCES project_workflow_nodes(id) ON DELETE CASCADE,

    edge_type           VARCHAR(50) NOT NULL DEFAULT 'NORMAL', -- NORMAL, CONDITIONAL, OPTIONAL
    label               VARCHAR(200),
    condition_text      TEXT,

    sort_order          INT NOT NULL DEFAULT 1,
    style_json          JSONB,

    created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CHECK (source_node_id <> target_node_id)
);

CREATE INDEX idx_project_workflow_edges_workflow ON project_workflow_edges(workflow_id);
CREATE INDEX idx_project_workflow_edges_source ON project_workflow_edges(source_node_id);
CREATE INDEX idx_project_workflow_edges_target ON project_workflow_edges(target_node_id);
