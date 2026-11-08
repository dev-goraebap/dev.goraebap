# goraebap-workflow

웹 플랫폼 개발 지침(프론트엔드·디자인 시스템·백엔드·API·DB·아키텍처)을 담은 개인 플러그인입니다. 프로젝트는 지침 사본을 두지 않고 AGENTS.md로 이 플러그인을 가리키며, 프로젝트만 다르게 하는 규칙은 AGENTS.md의 "프로젝트 규칙" 표에 적습니다.

## 저장소 구성

```text
plugin/
  skills/                       개발 지침의 원본(goraebap-mode 입구, 영역별 지침, 프로젝트 연결 manage-workflow)
  scripts/                      지침 검사·패키지 생성
  tests/                        배포본 검증
  docs/                         플러그인 사용 안내
  dist/                         Claude·Codex 생성 배포본
  package.json                  플러그인 식별자·버전
kit/
  reference/                    채택할 수 있는 공통 UI 키트(기초·조합·레이아웃·패턴)
  samples/                      범주별 견본·조작 검증과 Playground 화면 템플릿
  guide/                        지침을 사람이 읽기 쉽게 보여 주는 가이드 사이트
  scripts/                      Solar 아이콘 매핑 생성
.claude-plugin/marketplace.json  Claude 설치용 연결
.agents/plugins/marketplace.json Codex 설치용 연결
```

플러그인에는 Markdown 지침만 포함합니다. 프론트엔드 구현·견본·가이드 사이트는 kit에서 별도로 관리하고, 지침은 공개 소스 링크로 연결합니다.

## 설치

Claude Code:

```text
/plugin marketplace add dev-goraebap/goraebap-workflow --scope user
/plugin install goraebap-workflow@goraebap-workflow --scope user
```

Codex:

```text
codex plugin marketplace add https://github.com/dev-goraebap/goraebap-workflow.git --ref main
codex plugin add goraebap-workflow@goraebap-workflow
```

지침은 에이전트가 작업에 맞춰 스스로 불러 씁니다. 작업 입구는 goraebap-mode이고, 영역별 지침은 frontend·design-system·backend·api·database·architecture입니다. 플러그인을 갱신하면 연결된 모든 프로젝트가 새 지침을 따릅니다.

## 프로젝트 연결

프로젝트에서 manage-workflow에 연결을 요청하면 AGENTS.md에 다음 블록을 넣습니다. 프로젝트에 지침 사본·동기화 스크립트·훅을 만들지 않습니다.

```markdown
## 개발 지침

이 프로젝트는 goraebap-workflow 플러그인(0.5.0 이상)의 지침을 따른다. 작업을 시작할 때 goraebap-mode를 읽고, 바꾸는 영역의 지침을 함께 읽는다. 아래 프로젝트 규칙이 지침과 다르면 프로젝트 규칙을 따른다.

## 프로젝트 규칙

| 지침 | 지침의 기준 | 이 프로젝트 | 이유 |
| --- | --- | --- | --- |
```

- 프로젝트 규칙은 지침과 다른 결정만 한 줄씩 적습니다. 길면 `.agents/rules/<지침>.md`로 빼고 표에서 링크합니다([프로젝트 규칙](plugin/skills/manage-workflow/references/project-rules.md)).
- 다른 프로젝트에도 맞는 규칙은 manage-workflow의 회수로 플러그인 원본 수정을 제안합니다. 원본은 요청할 때 이 저장소에서 고칩니다.
- 예전 판처럼 `.agents/skills`에 지침 사본과 동기화 훅이 있는 프로젝트는 [사본에서 전환](plugin/skills/manage-workflow/references/migrate-from-copies.md)으로 바꿉니다. 사본에서 고친 부분은 프로젝트 규칙으로 옮깁니다.

## 개발과 배포

```text
npm run check
npm test
npm run package:plugins
```

생성 패키지는 지침 Markdown과 사용 안내만 담습니다. 로컬 참고 자료는 Git과 배포에서 제외합니다. 패키지를 다시 만든 뒤 설치된 플러그인은 마켓플레이스 갱신과 플러그인 갱신으로 따로 올립니다.

## 가이드 사이트

`kit/guide/`는 플러그인 지침을 사람이 읽기 쉽게 보여 주는 사이트입니다. 사이트 이름은 "웹 플랫폼 매뉴얼"이며, 메뉴는 공통·클라이언트·서버 세 영역으로 묶습니다. 키트로 만드는 업무 앱과 같은 스택(Vite + React + TanStack Router + MDX)의 SPA입니다. `npm ci` 후 `npm run guide`로 4451 포트에서 열고, `npm run guide:build`로 빌드, `npm run kit:check`로 타입을 검사합니다.

- 지침 문서는 `plugin/skills`의 Markdown을 원본 그대로 빌드합니다. 사본을 두지 않으므로 스킬을 고치면 사이트도 바뀝니다. 스킬 안의 상대 링크는 사이트 주소로 바뀝니다.
- 화면 해설·견본 문서는 `kit/guide/content`의 MDX입니다. 해설은 스킬 규칙의 풀이이며, 규칙이 바뀌면 스킬을 먼저 고치고 해설을 다시 씁니다. 조사 메모는 사이트에 두지 않습니다.
- 견본은 `sample.html`을 iframe으로 띄워 실제 기기 폭으로 그립니다. 첫 방문 덮개와 전환(지금 문서 유지, 180ms 덮개, 160ms 교차 페이드)은 키트 규칙대로입니다.
- 메뉴·제목·주소는 빌드 때 `kit/guide/content-plugin.ts`가 만듭니다.

## 화면 패턴 카탈로그

[패턴 지침](plugin/skills/design-system/references/pattern-catalog.md)은 Foundations·Primitives·Composites·Layouts·Patterns·Playground의 사용 기준을 키트 코드와 실행 견본에 연결합니다. 견본은 가이드에서 봅니다. `npm run kit:check`는 타입을, `npm run kit:test`는 견본 그리기와 조작 검증을 Chromium에서 검사합니다. 견본은 선택형 레퍼런스이며 프로젝트에 자동 설치하지 않습니다.

[키트와 견본](kit/README.md)은 Foundations (디자인 기초)·Primitives (기본 부품)·Composites (조합 부품)·Layouts (레이아웃)·Patterns (사용 패턴)·Playground (플레이그라운드)의 견본을 관리합니다. 별도 앱 서버는 두지 않습니다. Playground는 목록·목록 + 미리보기·상세·작성·문서 편집·자료 올리기·설정 템플릿을 보이며, 견본마다 메모리 라우터와 모의 저장소를 새로 만듭니다. 파일 구조는 공식 FSD 지침에 맡기고 자체 검사기는 유지하지 않습니다. `kit/`는 개발·검토용 소스이며 플러그인 패키지에 자동으로 포함하지 않습니다.
