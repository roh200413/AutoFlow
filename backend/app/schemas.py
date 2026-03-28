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
