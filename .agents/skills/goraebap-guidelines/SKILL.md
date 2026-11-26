---
name: goraebap-guidelines
description: 이 저장소에서 지침 글(web/apps/blog/content, plugins/webapp/skills)·스택별 예시·스킬 goraebap-webapp 빌드를 쓰거나 고칠 때 읽습니다. 지침 문장, 예시, 스킬 산출물, 결정 기록을 바꾸는 작업에 씁니다.
---

# 지침 글 쓰기와 스킬 빌드

## 원본

- 지침 원본은 사이트 `web/apps/blog/content/`의 md·mdx이고, content 경로가 곧 사이트 주소입니다(ADR 0008): `content/reference/frontend/<묶음>/<문서>`는 `/reference/frontend/<묶음>/<문서>/<스택>`, `content/design-system/<문서>`는 `/design-system/<문서>/<스택>`입니다. Reference › Frontend의 묶음은 structure(구조)·routing(라우팅)·state(상태 관리)·rendering(렌더링)·code-style(코드 규칙)이고, 순서와 이름은 사이트의 `SECTION_GROUPS`가 정합니다.
- SKILL.md가 있는 폴더가 메뉴 안내입니다(`content/reference/frontend/SKILL.md`, `content/design-system/SKILL.md`). 빌드하면 스킬 `.agents/skills/goraebap-webapp/references/` 아래 같은 경로(앞의 `reference/`를 뗀 것)가 됩니다. 예: `references/frontend/routing/navigation/`, `references/design-system/theme/`.
- 스킬의 `SKILL.md`(영역 안내)는 빌드 대상이 아니라 손으로 관리합니다. 영역을 더하면 함께 고칩니다.
- content에 없는 지침(webapp-project, goraebap-mode, onboarding)은 `plugins/webapp/skills/`가 원본이고 사이트만 읽습니다. 같은 지침 폴더는 두 곳에 함께 있을 수 있지만, 같은 문서(content의 문서 이름과 같은 `references/<이름>.md`·`examples/<이름>.md`)는 두 곳에 두지 않습니다(빌드가 막습니다). 지침을 content로 옮기면 옛 문서는 그 자리에서 지웁니다.
- 특정 회사 제품의 동작·업무 데이터·접속 정보는 넣지 않습니다.

## content 글

- 공통 글(`<문서>.mdx`, `<문서>/index.mdx`)에는 모든 스택에서 참인 문장만 씁니다. 스택 이름은 `npm run check`가 막습니다.
- 스택마다 다른 부분은 `<Slot name>`으로 두고 스택 파일(`<문서>/react.mdx`·`angular.mdx`·`spring.mdx`)의 `<Fill name>`이 채웁니다. 스택 파일 맨 위에는 `<Fill>`만 둡니다.
- 사람에게만 보일 글은 `<Story>`, 그림은 `<Diagram>`으로 감쌉니다. 스킬에서는 지워지므로 판단에 필요한 내용은 그 밖에도 씁니다. `<Callout>`은 안의 글만 남습니다.
- 사이트는 본문의 용어를 자동으로 용어집에 잇습니다(`web/apps/blog/src/shared/lib/glossary.ts`의 자동 연결 목록). 다른 뜻으로 흔히 쓰여 자동 연결에서 뺀 말(비활성, 변형, Primary 등)은 `<Term id="용어 id">표시</Term>`로 직접 잇고, 스킬에서는 글자만 남습니다. 다른 컴포넌트 이름은 그 문서로 가는 링크로 겁니다.
- 스킬에는 메뉴 SKILL.md에서 링크로 닿는 문서만 들어갑니다. 링크는 실제 파일을 가리키는 상대 경로로 겁니다. 변환기(`plugins/webapp/scripts/content-skills.mjs`)가 스킬 안 위치로 다시 쓰고, `plugins/webapp/skills/...`를 가리키는 링크는 글자만 남깁니다.
- 공통 글의 `<Slot>`은 스킬에서 스택 글(`<스택>.md`)의 같은 이름 절을 가리키는 한 줄이 됩니다.
- 머리말: 문서는 `title`·`icon`·`group`·`order`·`summary`, SKILL.md는 `name`·`description`.

## 예시

- 예시는 공개 오픈소스 프로젝트에서만 발췌하고, 원본 저장소의 고정 커밋 주소(`https://github.com/<owner>/<repo>/blob/<40자리 커밋>/...`)로 `출처:` 줄을 겁니다. 서브모듈은 두지 않습니다.
- 고치는 법은 [예시 읽기](../../../plugins/webapp/skills/goraebap-mode/references/examples.md)를 따릅니다.

## 글쓰기

[글쓰기 기준](../../../plugins/webapp/skills/goraebap-mode/references/writing.md)과 [글쓰기 맡기기](../../../plugins/webapp/skills/goraebap-mode/references/writer.md)를 따릅니다. 결정 기록 밖의 문서에는 변천 없이 지금 상태만 씁니다.

## 검사와 생성물

`plugins/webapp/`에서 실행합니다(처음 한 번 `npm ci`).

| 바꾼 것 | 실행 |
| --- | --- |
| content·skills 글, 예시 | `npm run check` |
| 예시의 고정 커밋 링크 | `npm run check:links` (온라인) |
| content를 바꿨으면 | `npm run build` 후 `.agents/skills/goraebap-webapp/`을 같은 커밋에 |

`.agents/skills/goraebap-webapp/references/`는 직접 고치지 않습니다. `npm run check`가 content에서 다시 만든 결과와 커밋된 파일이 다르면 실패하고, CI(`check.yml`)도 같은 검사를 돌립니다.

content를 고쳤으면 사이트도 확인합니다([goraebap-blog](../goraebap-blog/SKILL.md)).

## 결정 기록

되돌리기 어려운 결정은 `docs/adr/`에 ADR로 남깁니다. 언제 남기는지와 형식은 [도메인 문서](../../../docs/agents/domain.md)와 `/domain-modeling`을 따릅니다.
