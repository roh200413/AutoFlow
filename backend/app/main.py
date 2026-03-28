from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from .database import Base, engine, get_db
from .models import Artifact, Decision, Project
from .schemas import (
    ArtifactCreate,
    ArtifactRead,
    DashboardSummary,
    DecisionCreate,
    DecisionRead,
    ProjectCreate,
    ProjectRead,
)

Base.metadata.create_all(bind=engine)

app = FastAPI(title="AutoFlow Project Governance API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


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
