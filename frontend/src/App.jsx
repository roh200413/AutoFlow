import { useEffect, useMemo, useState } from 'react';
import {
  createArtifact,
  createDecision,
  createProject,
  fetchDashboard,
  fetchProjects,
} from './api';

const PROJECT_TYPES = ['GOV', 'POC', 'INTERNAL'];

export default function App() {
  const [dashboard, setDashboard] = useState(null);
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(null);

  const [projectForm, setProjectForm] = useState({
    name: '',
    project_type: 'POC',
    customer: '',
    objective: '',
    status: 'ACTIVE',
  });

  const [artifactForm, setArtifactForm] = useState({
    title: '',
    artifact_type: '회의록',
    version: 'v1.0',
    url: '',
  });

  const [decisionForm, setDecisionForm] = useState({
    agenda: '',
    options: '',
    selected_option: '',
    rationale: '',
    approver: '',
  });

  const selectedProject = useMemo(
    () => projects.find((p) => p.id === selectedProjectId) ?? null,
    [projects, selectedProjectId]
  );

  async function refreshAll() {
    const [dashboardData, projectData] = await Promise.all([
      fetchDashboard(),
      fetchProjects(),
    ]);
    setDashboard(dashboardData);
    setProjects(projectData);
    if (!selectedProjectId && projectData.length > 0) {
      setSelectedProjectId(projectData[0].id);
    }
  }

  useEffect(() => {
    refreshAll().catch((err) => alert(err.message));
  }, []);

  async function onCreateProject(e) {
    e.preventDefault();
    await createProject(projectForm);
    setProjectForm({
      name: '',
      project_type: 'POC',
      customer: '',
      objective: '',
      status: 'ACTIVE',
    });
    await refreshAll();
  }

  async function onCreateArtifact(e) {
    e.preventDefault();
    if (!selectedProjectId) return;
    await createArtifact(selectedProjectId, artifactForm);
    setArtifactForm({ title: '', artifact_type: '회의록', version: 'v1.0', url: '' });
    await refreshAll();
  }

  async function onCreateDecision(e) {
    e.preventDefault();
    if (!selectedProjectId) return;
    await createDecision(selectedProjectId, decisionForm);
    setDecisionForm({ agenda: '', options: '', selected_option: '', rationale: '', approver: '' });
    await refreshAll();
  }

  return (
    <main className="container">
      <h1>AutoFlow · 프로젝트 산출물/의사결정 관리</h1>

      <section className="grid dashboard">
        <Card title="총 프로젝트" value={dashboard?.total_projects ?? 0} />
        <Card title="진행중 프로젝트" value={dashboard?.active_projects ?? 0} />
        <Card title="산출물 수" value={dashboard?.total_artifacts ?? 0} />
        <Card title="의사결정 수" value={dashboard?.total_decisions ?? 0} />
      </section>

      <section className="panel">
        <h2>프로젝트 등록</h2>
        <form onSubmit={onCreateProject} className="form-grid">
          <input
            placeholder="프로젝트명"
            value={projectForm.name}
            onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })}
            required
          />
          <select
            value={projectForm.project_type}
            onChange={(e) => setProjectForm({ ...projectForm, project_type: e.target.value })}
          >
            {PROJECT_TYPES.map((type) => (
              <option key={type}>{type}</option>
            ))}
          </select>
          <input
            placeholder="고객사"
            value={projectForm.customer}
            onChange={(e) => setProjectForm({ ...projectForm, customer: e.target.value })}
          />
          <input
            placeholder="목적"
            value={projectForm.objective}
            onChange={(e) => setProjectForm({ ...projectForm, objective: e.target.value })}
          />
          <button type="submit">등록</button>
        </form>
      </section>

      <section className="layout-2">
        <aside className="panel">
          <h2>프로젝트 목록</h2>
          <ul className="list">
            {projects.map((project) => (
              <li key={project.id}>
                <button
                  className={project.id === selectedProjectId ? 'active' : ''}
                  onClick={() => setSelectedProjectId(project.id)}
                >
                  [{project.project_type}] {project.name}
                </button>
              </li>
            ))}
          </ul>
        </aside>

        <section className="panel">
          <h2>프로젝트 상세</h2>
          {selectedProject ? (
            <>
              <p><b>고객사:</b> {selectedProject.customer || '-'}</p>
              <p><b>목적:</b> {selectedProject.objective || '-'}</p>

              <h3>산출물 등록</h3>
              <form onSubmit={onCreateArtifact} className="form-grid">
                <input
                  placeholder="산출물명"
                  value={artifactForm.title}
                  onChange={(e) => setArtifactForm({ ...artifactForm, title: e.target.value })}
                  required
                />
                <input
                  placeholder="유형(예: 회의록, 보고서)"
                  value={artifactForm.artifact_type}
                  onChange={(e) => setArtifactForm({ ...artifactForm, artifact_type: e.target.value })}
                  required
                />
                <input
                  placeholder="버전"
                  value={artifactForm.version}
                  onChange={(e) => setArtifactForm({ ...artifactForm, version: e.target.value })}
                />
                <input
                  placeholder="URL"
                  value={artifactForm.url}
                  onChange={(e) => setArtifactForm({ ...artifactForm, url: e.target.value })}
                />
                <button type="submit">산출물 추가</button>
              </form>

              <h3>의사결정 등록</h3>
              <form onSubmit={onCreateDecision} className="form-grid">
                <input
                  placeholder="안건"
                  value={decisionForm.agenda}
                  onChange={(e) => setDecisionForm({ ...decisionForm, agenda: e.target.value })}
                  required
                />
                <input
                  placeholder="선택안"
                  value={decisionForm.selected_option}
                  onChange={(e) => setDecisionForm({ ...decisionForm, selected_option: e.target.value })}
                  required
                />
                <input
                  placeholder="검토 대안"
                  value={decisionForm.options}
                  onChange={(e) => setDecisionForm({ ...decisionForm, options: e.target.value })}
                />
                <input
                  placeholder="결정 사유"
                  value={decisionForm.rationale}
                  onChange={(e) => setDecisionForm({ ...decisionForm, rationale: e.target.value })}
                />
                <input
                  placeholder="승인자"
                  value={decisionForm.approver}
                  onChange={(e) => setDecisionForm({ ...decisionForm, approver: e.target.value })}
                />
                <button type="submit">의사결정 추가</button>
              </form>

              <h3>산출물</h3>
              <ul className="list compact">
                {selectedProject.artifacts.map((item) => (
                  <li key={item.id}>{item.artifact_type} · {item.title} ({item.version})</li>
                ))}
              </ul>

              <h3>의사결정</h3>
              <ul className="list compact">
                {selectedProject.decisions.map((item) => (
                  <li key={item.id}>{item.agenda} → {item.selected_option}</li>
                ))}
              </ul>
            </>
          ) : (
            <p>프로젝트를 선택하세요.</p>
          )}
        </section>
      </section>
    </main>
  );
}

function Card({ title, value }) {
  return (
    <div className="card">
      <p>{title}</p>
      <strong>{value}</strong>
    </div>
  );
}
