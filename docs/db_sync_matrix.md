# DB Sync Matrix (Backend ↔ Frontend Gate/Alert Process)

## 목적
프론트에서 사용하는 게이트/알람/에이전트 데이터를 백엔드 DB 모델과 동기화 가능한 구조로 매핑한다.

## 핵심 매핑

| Frontend 개념 | Backend 모델 | 핵심 필드 |
|---|---|---|
| 프로젝트 기본 정보 | `Project` | `name`, `project_type`, `status`, `objective` |
| 단계 목록 | `ProjectStage` | `stage_name`, `stage_order`, `status`, `completion_rate`, `is_current` |
| 단계별 규칙 | `StageGateRule` | `rule_code`, `rule_name`, `severity`, `condition_expression`, `recommended_action` |
| 단계별 규칙 점검 결과 | `StageGateCheck` | `check_result`, `actual_value`, `expected_value`, `note` |
| 리스크 알람 | `Alert` | `severity`, `title`, `message`, `recommended_action`, `status` |
| AI 리뷰 결과 | `AgentReview` | `agent_name`, `review_type`, `summary`, `issues`, `recommendations`, `confidence_score` |
| 의사결정 로그 | `Decision` | `agenda`, `selected_option`, `rationale`, `approver` |
| 산출물 | `Artifact` | `artifact_type`, `title`, `version`, `url` |

## API 연동 포인트
- `GET /api/projects/{project_id}/governance`
  - 단계/게이트체크/알람/에이전트리뷰를 통합 제공
- `GET /api/process-map`
  - 단계 흐름 노드/엣지 + Mermaid 다이어그램 텍스트 제공

## 현재 상태
- 모델/스키마/API는 게이트/알람/에이전트 구조를 수용하도록 확장됨.
- 프론트는 현재 더미데이터 기반이며, 차기 단계에서 `governance` API로 교체 필요.
