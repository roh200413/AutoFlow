import { useMemo, useState } from 'react';
import { alertRules, projects, signalLabels, stageLabels, stageOrder } from './mockData';

const menus = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'project-detail', label: 'Project Detail' },
  { key: 'stage-board', label: '단계별 체크보드' },
  { key: 'decision-center', label: '의사결정 센터' },
  { key: 'alert-center', label: '알람 센터' },
  { key: 'spec', label: 'Spec / Document' },
  { key: 'signal', label: 'Signal Definition' },
  { key: 'agent', label: 'AI Agent 제안' },
];

export default function AutoFlowApp() {
  const [selectedProjectId, setSelectedProjectId] = useState(projects[0].id);
  const [page, setPage] = useState('dashboard');
  const [selectedStage, setSelectedStage] = useState(stageOrder[0]);
  const [gateDecision, setGateDecision] = useState(null);

  const project = useMemo(
    () => projects.find((item) => item.id === selectedProjectId) ?? projects[0],
    [selectedProjectId]
  );

  const blockerCount = project.alerts.filter((alert) => alert.severity === 'blocker').length;
  const warningCount = project.alerts.filter((alert) => alert.severity === 'warning').length;
  const pendingDecisions = project.decisions.filter((decision) => decision.status !== '승인').length;

  const stageInfo = project.stages.find((stage) => stage.stage === selectedStage);

  function simulateStageTransition() {
    if (blockerCount > 0) {
      setGateDecision({
        status: 'blocked',
        title: '다음 단계 진입 차단',
        reason: 'Blocker 알람이 존재하여 자동 차단되었습니다.',
        options: ['보류', '리스크 승인 후 진행', '담당자 지정 후 재검토'],
      });
      return;
    }

    if (warningCount > 0) {
      setGateDecision({
        status: 'conditional',
        title: '조건부 진행',
        reason: 'Warning이 존재합니다. 승인 후 진행하거나 보류를 선택하세요.',
        options: ['진행 가능', '보류', '리스크 승인 후 진행'],
      });
      return;
    }

    setGateDecision({
      status: 'pass',
      title: '진행 가능',
      reason: '필수 게이트 조건 충족. 다음 단계로 이동 가능합니다.',
      options: ['다음 단계 이동'],
    });
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <section className="box brand">
          <p className="eyebrow">AutoFlow</p>
          <h1>AI Decision Operating System</h1>
          <p>단계별 진입 조건과 리스크를 감시하며 PO의 결정을 강제·보조합니다.</p>
        </section>

        <section className="box">
          <p className="label">프로젝트 선택</p>
          <select
            className="select"
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
          >
            {projects.map((item) => (
              <option key={item.id} value={item.id}>{item.name}</option>
            ))}
          </select>
        </section>

        <nav className="box nav-menu">
          {menus.map((menu) => (
            <button
              key={menu.key}
              className={`menu-btn ${page === menu.key ? 'active' : ''}`}
              onClick={() => setPage(menu.key)}
            >
              {menu.label}
            </button>
          ))}
        </nav>
      </aside>

      <main className="content">
        {page === 'dashboard' && (
          <DashboardPage
            project={project}
            blockerCount={blockerCount}
            warningCount={warningCount}
            pendingDecisions={pendingDecisions}
            onTryTransition={simulateStageTransition}
            gateDecision={gateDecision}
          />
        )}
        {page === 'project-detail' && <ProjectDetailPage project={project} />}
        {page === 'stage-board' && (
          <StageBoardPage
            project={project}
            selectedStage={selectedStage}
            setSelectedStage={setSelectedStage}
            stageInfo={stageInfo}
          />
        )}
        {page === 'decision-center' && <DecisionCenterPage project={project} />}
        {page === 'alert-center' && <AlertCenterPage project={project} />}
        {page === 'spec' && <SpecPage project={project} />}
        {page === 'signal' && <SignalDefinitionPage />}
        {page === 'agent' && <AgentPage project={project} />}
      </main>
    </div>
  );
}

function DashboardPage({ project, blockerCount, warningCount, pendingDecisions, onTryTransition, gateDecision }) {
  const stageStatusText = {
    pass: '진행 가능',
    conditional: '조건부 진행',
    blocked: '진행 불가',
  };

  return (
    <section className="page">
      <header className="page-head">
        <h2>프로젝트 대시보드</h2>
        <p>숫자보다 먼저 단계 진입 가능 여부와 리스크를 보여줍니다.</p>
      </header>

      <div className="stats-grid">
        <StatCard title="현재 단계" value={stageLabels[project.currentStage]} desc="현재 운영 단계" />
        <StatCard title="다음 단계 진입" value={stageStatusText[project.stageEntryStatus]} desc={stageLabels[project.nextStage]} />
        <StatCard title="Blocker / Warning" value={`${blockerCount} / ${warningCount}`} desc="미해결 알람" />
        <StatCard title="미결 의사결정" value={`${pendingDecisions}건`} desc="최근 의사결정 대기" />
        <StatCard title="모델 픽스 여부" value={project.modelFixed ? 'Fixed' : '미확정'} desc={project.modelStatus} />
        <StatCard title="데이터 확보율" value={`${project.dataCoverage}%`} desc="라벨 포함 데이터 기준" />
      </div>

      <article className="box action-box">
        <h3>다음 단계 이동 시뮬레이션</h3>
        <p className="muted">게이트 조건을 자동 점검하고 경고/차단/대안을 제시합니다.</p>
        <button className="primary" onClick={onTryTransition}>다음 단계 이동 시도</button>

        {gateDecision && (
          <div className={`gate-result ${gateDecision.status}`}>
            <h4>{gateDecision.title}</h4>
            <p>{gateDecision.reason}</p>
            <div className="chips-inline">
              {gateDecision.options.map((option) => (
                <span key={option} className="chip">{option}</span>
              ))}
            </div>
          </div>
        )}
      </article>
    </section>
  );
}

function ProjectDetailPage({ project }) {
  return (
    <section className="page">
      <header className="page-head">
        <h2>{project.name}</h2>
        <p>{project.summary}</p>
      </header>

      <div className="two-col">
        <article className="box">
          <h3>Signal 상태</h3>
          <ul className="list">
            {Object.entries(project.signals).map(([key, value]) => (
              <li key={key}>
                <span>{signalLabels[key]}</span>
                <span className={`chip ${value ? 'ok' : 'warn'}`}>{value ? '확정' : '미확정'}</span>
              </li>
            ))}
          </ul>
        </article>

        <article className="box">
          <h3>핵심 리스크</h3>
          <ul className="list simple">
            {project.blockers.map((blocker) => (
              <li key={blocker}>[Blocker] {blocker}</li>
            ))}
            {project.warnings.map((warning) => (
              <li key={warning}>[Warning] {warning}</li>
            ))}
          </ul>
        </article>
      </div>
    </section>
  );
}

function StageBoardPage({ project, selectedStage, setSelectedStage, stageInfo }) {
  return (
    <section className="page">
      <header className="page-head">
        <h2>단계별 체크보드</h2>
        <p>단계 완료 조건, 미충족 항목, 담당자, 관련 문서를 구조적으로 점검합니다.</p>
      </header>

      <div className="two-col">
        <article className="box">
          <h3>단계 목록</h3>
          <div className="list buttons">
            {stageOrder.map((stage) => (
              <button
                key={stage}
                className={selectedStage === stage ? 'selected' : ''}
                onClick={() => setSelectedStage(stage)}
              >
                <span>{stageLabels[stage]}</span>
                <small>{stage === project.currentStage ? '현재' : ''}</small>
              </button>
            ))}
          </div>
        </article>

        <article className="box">
          <h3>{stageLabels[selectedStage]} · 게이트 규칙</h3>
          {stageInfo ? (
            <>
              <p className="muted">담당자: {stageInfo.owner} · 충족률: {stageInfo.completionRate}%</p>
              <ul className="list simple">
                {stageInfo.gateChecks.map((check) => (
                  <li key={check.ruleCode}>
                    <strong>{check.ruleName}</strong>
                    <p>기준: {check.expected}</p>
                    <p>현재: {check.actual}</p>
                    <p>결과: {check.passed ? '통과' : `미통과 (${check.severity})`}</p>
                    <p>AI 권장 액션: {check.recommendedAction}</p>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="muted">해당 단계의 체크 데이터가 아직 없습니다.</p>
          )}
        </article>
      </div>
    </section>
  );
}

function DecisionCenterPage({ project }) {
  return (
    <section className="page">
      <header className="page-head">
        <h2>의사결정 센터</h2>
        <p>초안/검토중/승인/보류 상태와 근거, 영향 범위를 관리합니다.</p>
      </header>

      <article className="box">
        <ul className="list simple">
          {project.decisions.map((decision) => (
            <li key={decision.id}>
              <strong>{decision.title}</strong>
              <p>상태: {decision.status} · 유형: {decision.type}</p>
              <p>근거: {decision.reason}</p>
              <p>영향: {decision.impact}</p>
              <p>승인자: {decision.approver} · 일시: {decision.date}</p>
            </li>
          ))}
        </ul>
      </article>
    </section>
  );
}

function AlertCenterPage({ project }) {
  const [filter, setFilter] = useState('all');
  const filtered = project.alerts.filter((alert) => filter === 'all' || alert.severity === filter);

  return (
    <section className="page">
      <header className="page-head">
        <h2>알람 센터</h2>
        <p>단순 알림함이 아닌 리스크 관제판 형태로 Blocker/Warning/Info를 관리합니다.</p>
      </header>

      <article className="box">
        <div className="filter-row">
          {['all', 'blocker', 'warning', 'info'].map((severity) => (
            <button
              key={severity}
              className={`chip-btn ${filter === severity ? 'active' : ''}`}
              onClick={() => setFilter(severity)}
            >
              {severity.toUpperCase()}
            </button>
          ))}
        </div>

        <ul className="list simple">
          {filtered.map((alert) => (
            <li key={alert.id}>
              <strong>[{alert.severity.toUpperCase()}] {alert.title}</strong>
              <p>원인/메시지: {alert.message}</p>
              <p>영향 단계: {stageLabels[alert.stage] ?? alert.stage}</p>
              <p>추천 액션: {alert.recommendedAction}</p>
            </li>
          ))}
        </ul>
      </article>

      <article className="box">
        <h3>기본 룰셋 (20개)</h3>
        <div className="rules-grid">
          {alertRules.map((rule) => (
            <div key={rule.no} className="rule-item">
              <strong>#{rule.no} [{rule.severity}]</strong>
              <p>{rule.title}</p>
            </div>
          ))}
        </div>
      </article>
    </section>
  );
}

function SpecPage({ project }) {
  return (
    <section className="page">
      <header className="page-head">
        <h2>Spec / Document</h2>
        <p>문서 자체보다 Signal 변환 결과 중심으로 확인합니다.</p>
      </header>

      <article className="box">
        <ul className="list simple">
          {project.docs.map((doc) => (
            <li key={doc.name}>
              <strong>{doc.name}</strong>
              <p>{doc.type}</p>
              <div className="chips-inline">
                {doc.extracted.map((item) => (
                  <span key={item} className="chip">{item}</span>
                ))}
              </div>
            </li>
          ))}
        </ul>
      </article>
    </section>
  );
}

function SignalDefinitionPage() {
  return (
    <section className="page">
      <header className="page-head">
        <h2>Signal Definition</h2>
        <p>게이트 판정에 사용되는 핵심 신호를 정의합니다.</p>
      </header>

      <article className="box signal-grid">
        {Object.entries(signalLabels).map(([key, label]) => (
          <div key={key} className="signal-card">
            <strong>{label}</strong>
            <p className="muted">signal key: {key}</p>
          </div>
        ))}
      </article>
    </section>
  );
}

function AgentPage({ project }) {
  return (
    <section className="page">
      <header className="page-head">
        <h2>AI Agent 제안</h2>
        <p>Gate Review / Data Readiness / Schedule Impact / Decision Gap 관점으로 개입합니다.</p>
      </header>

      <article className="box">
        <ul className="list simple">
          {project.agentReviews.map((review) => (
            <li key={review.agent}>
              <strong>{review.agent}</strong>
              <p>요약: {review.summary}</p>
              <p>이슈: {review.issues.join(', ')}</p>
              <p>권장 액션: {review.recommendations.join(', ')}</p>
              <p>신뢰도: {(review.confidence * 100).toFixed(0)}%</p>
            </li>
          ))}
        </ul>
      </article>
    </section>
  );
}

function StatCard({ title, value, desc }) {
  return (
    <article className="box stat-card">
      <p className="muted">{title}</p>
      <strong>{value}</strong>
      <p className="muted">{desc}</p>
    </article>
  );
}
