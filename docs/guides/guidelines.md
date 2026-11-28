# 지침 글 쓰기와 `fullstack` 플러그인 빌드

## 단일 원본 (`web/apps/blog/content/`)

지침의 단일 원본은 사이트 `web/apps/blog/content/`입니다. `plugins/fullstack/`에서 빌드하면 Claude Code · Codex · Antigravity용 `fullstack` 플러그인과 루트 마켓플레이스 파일이 생성됩니다.

| 원본 (`web/apps/blog/content/`) | 빌드되는 스킬 (`fullstack`) | 형식 |
| --- | --- | --- |
| `webapp/{playbooks,articles,reference}/` | `goraebap-mode` (전역 오케스트레이터) | Diátaxis 순수 MD (`tutorials/`는 사람 전용으로 제외) |
| `design-system/` | `frontend-uiux` | MDX + `<Slot>/<Fill>` (`react.mdx` · `angular.mdx`) |
| `frontend/{playbooks,articles,reference}/` | `frontend-engineering` | Diátaxis 순수 MD (`react-tanstack.md` · `angular.md`) |
| `backend/{playbooks,articles,reference}/` | `backend-engineering` | Diátaxis 순수 MD (`springboot.md`) |

- 각 스킬은 `SKILL.md`(얇은 라우터)와 같은 레벨에 `playbooks/`, `articles/`, `reference/`를 평탄하게 둡니다.
- 모든 스킬은 명시 호출 전용으로 패키징합니다(Claude `disable-model-invocation: true`, Codex `agents/openai.yaml`, Antigravity `description` 명시 호출 안내).
- 특정 회사 제품의 동작·업무 데이터·접속 정보는 넣지 않습니다.

## MDX 문서 (`content/design-system/`) 규칙

- 공통 글(`.mdx`, `index.mdx`)에는 모든 스택에서 참인 문장만 씁니다. 스택 이름은 `npm run check`가 막습니다.
- 스택마다 다른 부분은 `<Slot name>`으로 두고 스택 파일(`react.mdx` · `angular.mdx`)의 `<Fill name>`이 채웁니다.
- `<Story>`, `<Diagram>`, `<Demo>`는 스킬 빌드 시 제거되므로 판단 기준은 본문 텍스트에도 남깁니다. `<Callout>`과 `<Term>`은 안의 글자만 남습니다.
- `group: 플레이북`인 문서는 스킬의 `playbooks/`로, `group: 아티클`인 문서는 `articles/`로, 나머지는 `reference/`로 빌드됩니다.
- 예시 발췌를 공개 오픈소스에서 가져올 때는 40자리 고정 커밋 주소(`https://github.com/<owner>/<repo>/blob/<40자리 커밋>/...`)를 사용합니다.

## 빌드와 검사

`plugins/fullstack/`에서 실행합니다(처음 한 번 `npm ci`).

| 바꾼 것 | 실행 |
| --- | --- |
| `content/` 지침 글 수정 | `npm run build` 후 `plugins/fullstack/dist/`와 루트 마켓플레이스 파일을 함께 커밋 |
| 플러그인·링크·순수성 검사 | `npm run check` |
| 예시의 GitHub 고정 커밋 링크 | `npm run check:links` (온라인) |

`plugins/fullstack/dist/`는 직접 고치지 않습니다. `npm run check`가 `content/`에서 다시 만든 결과와 커밋된 `dist/`가 다르면 실패합니다. `content/`를 고쳤으면 `docs/guides/blog.md`에 따라 사이트 빌드도 확인합니다.

## 결정 기록

되돌리기 어려운 결정은 `docs/adr/`에 ADR로 남깁니다. 형식은 `docs/agents/domain.md`를 따릅니다.
