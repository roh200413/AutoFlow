const API_BASE = '';

export async function fetchDashboard() {
  const res = await fetch(`${API_BASE}/api/dashboard`);
  if (!res.ok) throw new Error('대시보드 조회 실패');
  return res.json();
}

export async function fetchProjects() {
  const res = await fetch(`${API_BASE}/api/projects`);
  if (!res.ok) throw new Error('프로젝트 조회 실패');
  return res.json();
}

export async function createProject(payload) {
  const res = await fetch(`${API_BASE}/api/projects`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('프로젝트 생성 실패');
  return res.json();
}

export async function createArtifact(projectId, payload) {
  const res = await fetch(`${API_BASE}/api/projects/${projectId}/artifacts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('산출물 등록 실패');
  return res.json();
}

export async function createDecision(projectId, payload) {
  const res = await fetch(`${API_BASE}/api/projects/${projectId}/decisions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('의사결정 등록 실패');
  return res.json();
}
