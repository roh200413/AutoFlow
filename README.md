# AutoFlow

프로젝트 산출물 및 의사결정 관리 도구의 기본 구현입니다.

## 구성
- `backend/`: FastAPI API 서버
- `frontend/`: React(Vite) 웹 UI
- `docs/`: 제안서 문서
- `db/`: 초기 SQL 초안

## 빠른 시작
### 1) Backend
```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### 2) Frontend
```bash
cd frontend
npm install
npm run dev
```

브라우저: `http://localhost:5173`

## 현재 메인 페이지 구성
- 프로젝트 대시보드: 현재 단계, 다음 단계 진입 가능 여부, Blocker/Warning, 모델 픽스, 데이터 확보율
- 단계별 체크보드: 단계별 Gate 조건/충족률/미충족 항목/권장 액션
- 의사결정 센터: 상태(초안/검토중/승인/보류), 근거, 영향 범위, 승인 정보
- 알람 센터: Blocker/Warning/Info 필터 + 룰셋(20개) 관제
- Spec / Document: 문서와 Signal 추출값 연결
- Signal Definition / AI Agent 제안: 판단 기준 정의 + Agent 리뷰


## 게이트/알람 연동 API
- `GET /api/projects/{project_id}/governance` : 단계별 게이트 체크 + 알람 + Agent 리뷰 통합 조회
- `GET /api/process-map` : 단계 프로세스 도식(node/edge + mermaid) 조회

## 도식/동기화 문서
- `docs/process_stage_gate_flow.mmd` : 단계 진입 게이트 흐름도
- `docs/db_sync_matrix.md` : 프론트-백엔드 DB 동기화 매핑표
