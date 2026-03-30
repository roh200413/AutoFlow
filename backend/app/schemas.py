from datetime import datetime

from pydantic import BaseModel, Field


class ArtifactCreate(BaseModel):
    title: str
    artifact_type: str
    version: str = "v1.0"
    url: str | None = None


class ArtifactRead(ArtifactCreate):
    id: int
    project_id: int
    created_at: datetime

    model_config = {"from_attributes": True}


class DecisionCreate(BaseModel):
    agenda: str
    options: str | None = None
    selected_option: str
    rationale: str | None = None
    approver: str | None = None


class DecisionRead(DecisionCreate):
    id: int
    project_id: int
    created_at: datetime

    model_config = {"from_attributes": True}


class ProjectCreate(BaseModel):
    name: str
    project_type: str
    customer: str | None = None
    status: str = "ACTIVE"
    objective: str | None = None


class StageGateCheckRead(BaseModel):
    id: int
    check_result: bool
    actual_value: str | None
    expected_value: str | None
    note: str | None
    checked_at: datetime
    rule_code: str
    rule_name: str
    severity: str
    recommended_action: str | None


class ProjectStageRead(BaseModel):
    id: int
    stage_name: str
    stage_order: int
    status: str
    completion_rate: float
    owner: str | None
    is_current: bool
    gate_checks: list[StageGateCheckRead] = Field(default_factory=list)


class AlertRead(BaseModel):
    id: int
    stage_name: str | None
    severity: str
    title: str
    message: str
    recommended_action: str | None
    status: str
    triggered_at: datetime

    model_config = {"from_attributes": True}


class AgentReviewRead(BaseModel):
    id: int
    agent_name: str
    review_type: str | None
    summary: str
    issues: str | None
    recommendations: str | None
    confidence_score: float
    reviewed_at: datetime

    model_config = {"from_attributes": True}


class GovernanceSnapshot(BaseModel):
    project_id: int
    stages: list[ProjectStageRead]
    alerts: list[AlertRead]
    agent_reviews: list[AgentReviewRead]


class ProcessMap(BaseModel):
    name: str
    nodes: list[dict]
    edges: list[dict]
    mermaid: str


class ProjectRead(ProjectCreate):
    id: int
    created_at: datetime
    artifacts: list[ArtifactRead] = Field(default_factory=list)
    decisions: list[DecisionRead] = Field(default_factory=list)

    model_config = {"from_attributes": True}


class DashboardSummary(BaseModel):
    total_projects: int
    active_projects: int
    total_artifacts: int
    total_decisions: int
    pending_decisions: int
