from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from .database import Base, engine, get_db
from .models import (
    AgentReview,
    Alert,
    Artifact,
    Decision,
    Project,
    ProjectStage,
    StageGateCheck,
    StageGateRule,
)
from .schemas import (
    ArtifactCreate,
    ArtifactRead,
    DashboardSummary,
    DecisionCreate,
    DecisionRead,
    GovernanceSnapshot,
    ProcessMap,
    ProjectCreate,
    ProjectRead,
    ProjectStageRead,
    StageGateCheckRead,
)

Base.metadata.create_all(bind=engine)

app = FastAPI(title="AutoFlow Project Governance API", version="0.2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def seed_governance_baseline():
    db = next(get_db())
    try:
        if db.query(StageGateRule).count() == 0:
            db.add_all(
                [
                    StageGateRule(
                        stage_name="requirements",
                        rule_code="requirement_doc_exists",
                        rule_name="요구사항 문서 등록",
                        severity="blocker",
                        condition_expression="requirement_doc_exists == true",
                        recommended_action="요구사항 정의서 업로드",
                    ),
                    StageGateRule(
                        stage_name="data_collection",
                        rule_code="minimum_labeled_data",
                        rule_name="최소 라벨 데이터",
                        severity="blocker",
                        condition_expression="labeled_count >= 1000",
                        recommended_action="샘플 데이터 추가 수집",
                    ),
                    StageGateRule(
                        stage_name="deployment_ready",
                        rule_code="model_fixed",
                        rule_name="모델 픽스 여부",
                        severity="blocker",
                        condition_expression="model_status == fixed",
                        recommended_action="모델 비교표 생성 후 승인",
                    ),
                ]
            )
            db.commit()
    finally:
        db.close()


@app.get("/health")
def health_check():
    return {"status": "ok"}


@app.get("/api/projects", response_model=list[ProjectRead])
def list_projects(db: Session = Depends(get_db)):
    return (
        db.query(Project)
        .options(joinedload(Project.artifacts), joinedload(Project.decisions))
        .order_by(Project.created_at.desc())
        .all()
    )


@app.post("/api/projects", response_model=ProjectRead, status_code=201)
def create_project(payload: ProjectCreate, db: Session = Depends(get_db)):
    project = Project(**payload.model_dump())
    db.add(project)
    db.commit()
    db.refresh(project)
    return project


@app.get("/api/projects/{project_id}", response_model=ProjectRead)
def get_project(project_id: int, db: Session = Depends(get_db)):
    project = (
        db.query(Project)
        .options(joinedload(Project.artifacts), joinedload(Project.decisions))
        .filter(Project.id == project_id)
        .first()
    )
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


@app.post("/api/projects/{project_id}/artifacts", response_model=ArtifactRead, status_code=201)
def add_artifact(project_id: int, payload: ArtifactCreate, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    artifact = Artifact(project_id=project_id, **payload.model_dump())
    db.add(artifact)
    db.commit()
    db.refresh(artifact)
    return artifact


@app.post("/api/projects/{project_id}/decisions", response_model=DecisionRead, status_code=201)
def add_decision(project_id: int, payload: DecisionCreate, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    decision = Decision(project_id=project_id, **payload.model_dump())
    db.add(decision)
    db.commit()
    db.refresh(decision)
    return decision


@app.get("/api/dashboard", response_model=DashboardSummary)
def dashboard(db: Session = Depends(get_db)):
    total_projects = db.query(func.count(Project.id)).scalar() or 0
    active_projects = db.query(func.count(Project.id)).filter(Project.status == "ACTIVE").scalar() or 0
    total_artifacts = db.query(func.count(Artifact.id)).scalar() or 0
    total_decisions = db.query(func.count(Decision.id)).scalar() or 0
    pending_decisions = db.query(func.count(Project.id)).filter(Project.status == "HOLD").scalar() or 0

    return DashboardSummary(
        total_projects=total_projects,
        active_projects=active_projects,
        total_artifacts=total_artifacts,
        total_decisions=total_decisions,
        pending_decisions=pending_decisions,
    )


@app.get("/api/projects/{project_id}/governance", response_model=GovernanceSnapshot)
def project_governance(project_id: int, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    stages = db.query(ProjectStage).filter(ProjectStage.project_id == project_id).order_by(ProjectStage.stage_order).all()

    stage_reads = []
    for stage in stages:
        checks = (
            db.query(StageGateCheck)
            .join(StageGateRule, StageGateRule.id == StageGateCheck.gate_rule_id)
            .filter(StageGateCheck.project_stage_id == stage.id)
            .all()
        )
        mapped_checks = [
            StageGateCheckRead(
                id=check.id,
                check_result=check.check_result,
                actual_value=check.actual_value,
                expected_value=check.expected_value,
                note=check.note,
                checked_at=check.checked_at,
                rule_code=check.gate_rule.rule_code,
                rule_name=check.gate_rule.rule_name,
                severity=check.gate_rule.severity,
                recommended_action=check.gate_rule.recommended_action,
            )
            for check in checks
        ]
        stage_reads.append(
            ProjectStageRead(
                id=stage.id,
                stage_name=stage.stage_name,
                stage_order=stage.stage_order,
                status=stage.status,
                completion_rate=stage.completion_rate,
                owner=stage.owner,
                is_current=stage.is_current,
                gate_checks=mapped_checks,
            )
        )

    alerts = db.query(Alert).filter(Alert.project_id == project_id).order_by(Alert.triggered_at.desc()).all()
    agent_reviews = (
        db.query(AgentReview).filter(AgentReview.project_id == project_id).order_by(AgentReview.reviewed_at.desc()).all()
    )

    return GovernanceSnapshot(project_id=project_id, stages=stage_reads, alerts=alerts, agent_reviews=agent_reviews)


@app.get("/api/process-map", response_model=ProcessMap)
def process_map():
    nodes = [
        {"id": "requirements", "label": "요구사항 분석"},
        {"id": "data_collection", "label": "데이터 확보"},
        {"id": "data_preprocessing", "label": "데이터 정제"},
        {"id": "labeling", "label": "라벨링"},
        {"id": "model_design", "label": "모델 설계"},
        {"id": "model_training", "label": "모델 개발"},
        {"id": "validation", "label": "검증"},
        {"id": "deployment_ready", "label": "배포 준비"},
        {"id": "operations_retro", "label": "운영/회고"},
    ]
    edges = [
        {"from": "requirements", "to": "data_collection", "gate": "요구사항/KPI 정의"},
        {"from": "data_collection", "to": "data_preprocessing", "gate": "최소 샘플/품질"},
        {"from": "data_preprocessing", "to": "labeling", "gate": "정제 완료"},
        {"from": "labeling", "to": "model_design", "gate": "라벨 기준 확정"},
        {"from": "model_design", "to": "model_training", "gate": "입출력 스펙 확정"},
        {"from": "model_training", "to": "validation", "gate": "베이스라인/모델 픽스"},
        {"from": "validation", "to": "deployment_ready", "gate": "KPI 충족/승인"},
        {"from": "deployment_ready", "to": "operations_retro", "gate": "배포 승인"},
    ]

    mermaid = """
flowchart LR
    A[요구사항 분석] -->|요구사항/KPI 정의| B[데이터 확보]
    B -->|최소 샘플/품질| C[데이터 정제]
    C -->|정제 완료| D[라벨링]
    D -->|라벨 기준 확정| E[모델 설계]
    E -->|입출력 스펙 확정| F[모델 개발]
    F -->|베이스라인/모델 픽스| G[검증]
    G -->|KPI 충족/승인| H[배포 준비]
    H -->|배포 승인| I[운영/회고]
""".strip()

    return ProcessMap(name="AutoFlow Stage Gate Process", nodes=nodes, edges=edges, mermaid=mermaid)
