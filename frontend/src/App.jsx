import { useMemo, useState } from 'react';
import { buildMainMetrics, dummyProjects } from './mockData';

export default function App() {
  const [selectedProjectId, setSelectedProjectId] = useState(dummyProjects[0]?.id ?? null);
  const selectedProject = useMemo(
    () => dummyProjects.find((project) => project.id === selectedProjectId) ?? dummyProjects[0],
    [selectedProjectId]
  );

  const metrics = buildMainMetrics(selectedProject);

  return (
    <main className="container">
      <header className="hero">
        <div>
          <h1>프로젝트 메인 · 워크플로우 캔버스</h1>
          <p>산출물, 의사결정, 리스크를 한 화면에서 점검하는 운영 관제형 메인 페이지</p>
        </div>
        <select
          value={selectedProject.id}
          onChange={(e) => setSelectedProjectId(Number(e.target.value))}
          aria-label="프로젝트 선택"
        >
          {dummyProjects.map((project) => (
            <option key={project.id} value={project.id}>
              [{project.project_type}] {project.name}
            </option>
          ))}
        </select>
      </header>

      <section className="grid metrics">
        <MetricCard label="진행률" value={`${metrics.progress}%`} />
        <MetricCard label="승인 대기 의사결정" value={`${metrics.pendingDecisions}건`} warn={metrics.pendingDecisions > 0} />
        <MetricCard label="누락 산출물" value={`${metrics.missingArtifacts}건`} warn={metrics.missingArtifacts > 0} />
        <MetricCard label="High 리스크" value={`${metrics.highRisks}건`} warn={metrics.highRisks > 0} />
      </section>

      <section className="panel project-summary">
        <h2>{selectedProject.name}</h2>
        <div className="summary-grid">
          <p><span>고객사</span><strong>{selectedProject.customer || '-'}</strong></p>
          <p><span>담당 조직</span><strong>{selectedProject.owner || '-'}</strong></p>
          <p><span>상태</span><strong>{selectedProject.status}</strong></p>
          <p><span>목표일</span><strong>{selectedProject.dueDate}</strong></p>
        </div>
        <p className="objective"><b>목표:</b> {selectedProject.objective}</p>
      </section>

      <section className="panel">
        <div className="section-head">
          <h2>워크플로우 진행 현황</h2>
          <button type="button">+ 액션 추가</button>
        </div>
        <div className="workflow-board">
          {selectedProject.workflow.map((stage) => (
            <article key={stage.code} className={`stage ${stage.status}`}>
              <header>
                <h3>{stage.label}</h3>
                <span>{stage.tasks.length}개</span>
              </header>
              <ul>
                {stage.tasks.map((task) => (
                  <li key={task.id}>
                    <p>{task.title}</p>
                    <small>{task.assignee}</small>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="grid lower">
        <article className="panel">
          <h2>의사결정 큐</h2>
          <ul className="list">
            {selectedProject.decisions.map((decision) => (
              <li key={decision.id}>
                <div>
                  <strong>{decision.agenda}</strong>
                  <p>{decision.selected_option}</p>
                  <small>{decision.rationale}</small>
                </div>
                <span className={`badge ${decision.status}`}>{decision.status}</span>
              </li>
            ))}
          </ul>
        </article>

        <article className="panel">
          <h2>산출물 상태</h2>
          <ul className="list">
            {selectedProject.artifacts.map((artifact) => (
              <li key={artifact.id}>
                <div>
                  <strong>{artifact.title}</strong>
                  <p>{artifact.type}</p>
                </div>
                <span className={`badge ${artifact.status}`}>{artifact.version}</span>
              </li>
            ))}
          </ul>
        </article>

        <article className="panel">
          <h2>리스크/최근 활동</h2>
          <h3>리스크</h3>
          <ul className="list simple">
            {selectedProject.risks.map((risk) => (
              <li key={risk.id}>[{risk.level}] {risk.text}</li>
            ))}
          </ul>
          <h3>최근 활동</h3>
          <ul className="list simple">
            {selectedProject.activities.map((activity) => (
              <li key={activity}>{activity}</li>
            ))}
          </ul>
        </article>
      </section>
    </main>
  );
}

function MetricCard({ label, value, warn = false }) {
  return (
    <article className={`metric-card ${warn ? 'warn' : ''}`}>
      <p>{label}</p>
      <strong>{value}</strong>
    </article>
  );
}
