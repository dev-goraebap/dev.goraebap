# 스킬 이름 이전

0.16.0부터 내용 스킬의 이름과 범위는 지침 사이트(dev.goraebap.xyz)의 공간과 메뉴를 따릅니다. 이전 판의 스킬 이름을 적어 둔 프로젝트는 AGENTS.md를 새 이름으로 고칩니다. 작업 도구인 goraebap-mode와 onboarding은 이름이 그대로입니다.

| 이전 스킬 | 새 위치 |
| --- | --- |
| `architecture` | `webapp-project` |
| `frontend` | `frontend-engineering` |
| `ui-ux` 중 모션·데이터 상태·라우트 마스킹·입력과 상호작용 | `frontend-interaction` |
| `ui-ux`의 나머지 | `frontend-design-system` |
| `backend` | `backend-engineering` |
| `api` | `backend-engineering`의 API 계약 참고 자료 |
| `database` | `backend-engineering`의 DB와 마이그레이션 참고 자료 |
| goraebap-mode의 Git 작업 참고 자료 | `webapp-project`의 Git 작업 참고 자료 |

각 스킬의 `examples/`에는 주제별 구현 예시가 스택별 절로 들어 있습니다([예시 읽기](../../goraebap-mode/references/examples.md)).

## 절차

1. Git status와 staging을 확인합니다. 바뀐 것이 있으면 사용자에게 알리고 그 파일은 건드리지 않습니다.
2. AGENTS.md의 관리 블록(`<!-- webapp@dev-goraebap:start -->` ~ `<!-- webapp@dev-goraebap:end -->`) 안쪽을 [연결](../SKILL.md#연결)의 블록으로 바꿉니다. 최소 버전은 설치된 플러그인 버전으로 맞춥니다.
3. 관리 블록에 스택 줄이 없고 이전 프로젝트 이름 지정 줄이 남아 있으면, 실제 프로젝트 의존성에 맞는 `- Webapp 스택: <스택 id>` 줄로 바꿉니다.
4. 마커 밖 `## 프로젝트 규칙` 표의 지침 칸에 적힌 이전 이름을 위 표의 새 이름으로 바꿉니다. 규칙의 내용은 고치지 않습니다.
5. 프로젝트 문서가 이전 스킬 이름이나 플러그인 안 경로(`skills/ui-ux/…` 등)를 가리키면 목록으로 보여 주고, 사용자가 확인한 것만 고칩니다.
6. 바꾼 파일과 이름을 바꾼 규칙 줄을 보고합니다.
