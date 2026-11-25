---
name: goraebap-guidelines
description: 이 저장소에서 Webapp 플러그인의 지침 글(web/apps/blog/content, plugins/webapp/skills)·스택별 예시·패키징을 쓰거나 고칠 때 읽습니다. 지침 문장, 예시, dist, 결정 기록을 바꾸는 작업에 씁니다.
---

# 지침 글 쓰기와 패키징

## 원본

- 지침 원본은 사이트 `web/apps/blog/content/`의 md·mdx입니다. 폴더 하나가 사이트 메뉴 하나이고, SKILL.md가 있는 폴더가 스킬 하나입니다.
- 아직 content로 옮기지 않은 스킬은 `plugins/webapp/skills/`가 원본입니다. 같은 스킬을 두 곳에 두지 않습니다(패키징이 막습니다). 지금 content에 있는 스킬은 `frontend-engineering`입니다.
- 특정 회사 제품의 동작·업무 데이터·접속 정보는 넣지 않습니다.

## content 글

- 공통 글(`<문서>.mdx`, `<문서>/index.mdx`)에는 모든 스택에서 참인 문장만 씁니다. 스택 이름은 `npm run check`가 막습니다.
- 스택마다 다른 부분은 `<Slot name>`으로 두고 스택 파일(`<문서>/react.mdx`·`angular.mdx`·`spring.mdx`)의 `<Fill name>`이 채웁니다. 스택 파일 맨 위에는 `<Fill>`만 둡니다.
- 사람에게만 보일 글은 `<Story>`, 그림은 `<Diagram>`으로 감쌉니다. 플러그인에서는 지워지므로 판단에 필요한 내용은 그 밖에도 씁니다. `<Callout>`은 안의 글만 남습니다.
- 플러그인에는 SKILL.md에서 링크로 닿는 문서만 들어갑니다. 링크는 실제 파일을 가리키는 상대 경로로 겁니다(아직 옮기지 않은 스킬은 `plugins/webapp/skills/...`). 변환기(`plugins/webapp/scripts/content-skills.mjs`)가 배포 위치로 다시 씁니다.
- 머리말: 문서는 `title`·`icon`·`group`·`order`·`summary`·`arc42`, SKILL.md는 `name`·`description`·`arc42`.

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
| 도구·패키징 | `npm test` |
| 무엇이든 지침을 바꿨으면 | `npm run package` 후 `dist/`를 같은 커밋에 |

`plugins/webapp/dist/`는 직접 고치지 않습니다. CI(`check.yml`)가 다시 만든 결과와 커밋된 dist가 다르면 실패합니다. 루트 `.claude-plugin/marketplace.json`과 `.agents/plugins/marketplace.json`은 생성 배포본을 가리키는 연결 파일입니다. 마켓플레이스 이름은 `dev-goraebap`, 플러그인 이름은 `webapp`입니다.

content를 고쳤으면 사이트도 확인합니다([goraebap-blog](../goraebap-blog/SKILL.md)).

## 결정 기록

되돌리기 어려운 결정과 기각한 대안은 [docs/decisions.md](../../../docs/decisions.md)에 한 줄씩 남깁니다.
