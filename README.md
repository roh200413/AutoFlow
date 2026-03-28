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
