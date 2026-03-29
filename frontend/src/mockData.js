export const dummyProjects = [
  {
    id: 101,
    name: 'A시 스마트민원 국책과제',
    project_type: 'GOV',
    customer: 'A시청',
    status: 'ACTIVE',
    objective: '민원 자동분류 및 응답시간 단축',
    progress: 68,
    owner: '공공DX팀',
    dueDate: '2026-06-30',
    workflow: [
      {
        code: 'INIT',
        label: '초기기획',
        status: 'done',
        tasks: [
          { id: 'i1', title: '프로젝트 목적 정의', assignee: '김PM', done: true },
          { id: 'i2', title: '범위 확정', assignee: '이기획', done: true },
        ],
      },
      {
        code: 'REQUIREMENT',
        label: '요구사항분석',
        status: 'done',
        tasks: [
          { id: 'r1', title: '현행 프로세스 인터뷰', assignee: '정BA', done: true },
          { id: 'r2', title: 'KPI 정의', assignee: '김PM', done: true },
        ],
      },
      {
        code: 'DATA_PREP',
        label: '데이터준비',
        status: 'doing',
        tasks: [
          { id: 'd1', title: '데이터 품질 점검', assignee: '최DS', done: false },
          { id: 'd2', title: '결측치 보정 룰 수립', assignee: '박DE', done: false },
        ],
      },
      {
        code: 'MODEL_PLAN',
        label: '모델기획',
        status: 'todo',
        tasks: [{ id: 'm1', title: '평가 지표 확정', assignee: '최DS', done: false }],
      },
      {
        code: 'POC',
        label: 'PoC수행',
        status: 'todo',
        tasks: [{ id: 'p1', title: '실증 시나리오 수립', assignee: '김PM', done: false }],
      },
      {
        code: 'REPORT',
        label: '결과정리',
        status: 'todo',
        tasks: [{ id: 're1', title: '중간 보고서 템플릿 작성', assignee: '이기획', done: false }],
      },
    ],
    decisions: [
      {
        id: 'dec-01',
        agenda: '민원 분류 방식 선정',
        options: ['규칙 기반', 'BERT 기반 분류기'],
        selected_option: 'BERT 기반 분류기',
        rationale: '정확도 개선 폭(8%p)과 확장성이 높음',
        approver: '사업총괄',
        status: 'approved',
      },
      {
        id: 'dec-02',
        agenda: '개인정보 마스킹 적용 시점',
        options: ['수집 직후', '학습 직전'],
        selected_option: '수집 직후',
        rationale: '보안감사 대응',
        approver: '',
        status: 'pending',
      },
    ],
    artifacts: [
      { id: 'a1', title: '착수보고서', type: '보고서', version: 'v1.1', status: 'approved' },
      { id: 'a2', title: '요구사항 정의서', type: '요구사항', version: 'v0.9', status: 'review' },
      { id: 'a3', title: '데이터 품질 점검표', type: '검토서', version: 'v0.3', status: 'draft' },
    ],
    risks: [
      { id: 'rk1', level: 'HIGH', text: '원천데이터 누락률 12%로 기준 초과' },
      { id: 'rk2', level: 'MEDIUM', text: '승인 지연으로 모델기획 착수 지연 가능성' },
    ],
    activities: [
      '03/28 데이터 품질 점검표 v0.3 업로드',
      '03/27 의사결정 안건(마스킹 시점) 승인 요청',
      '03/26 요구사항 정의서 v0.9 업데이트',
    ],
  },
  {
    id: 102,
    name: 'B금융 콜봇 PoC',
    project_type: 'POC',
    customer: 'B금융',
    status: 'HOLD',
    objective: '상담 분류 자동화 검증',
    progress: 42,
    owner: 'AI솔루션팀',
    dueDate: '2026-05-15',
    workflow: [],
    decisions: [],
    artifacts: [],
    risks: [{ id: 'rk3', level: 'HIGH', text: '고객사 보안망 반출 승인 대기' }],
    activities: ['03/25 보안망 반출 승인 요청 제출'],
  },
];

export function buildMainMetrics(project) {
  const pendingDecisions = project.decisions.filter((d) => d.status === 'pending').length;
  const missingArtifacts = Math.max(0, 8 - project.artifacts.length);
  const highRisks = project.risks.filter((r) => r.level === 'HIGH').length;

  return {
    progress: project.progress,
    pendingDecisions,
    missingArtifacts,
    highRisks,
  };
}
