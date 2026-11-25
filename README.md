# dev-goraebap

여러 프로젝트를 진행하며 정리한 아키텍처·구조·코딩 스타일·UI/UX 개발 기준을 에이전트 플러그인으로 관리하는 개인 개발 하네스이자 마켓플레이스(`dev-goraebap`)입니다.

프로젝트마다 스킬과 지침을 새로 만들거나 복사해 두지 않고, 이 저장소에서 분야별 플러그인을 한곳에서 관리합니다. 각 프로젝트는 `AGENTS.md`로 필요한 플러그인을 가리켜 일관된 개발 방식을 따릅니다.

## 설계 방식

- **글 하나에서 사이트와 스킬을 함께**: 지침 글의 원본은 사이트([dev.goraebap.xyz](https://dev.goraebap.xyz))의 `web/apps/blog/content/`입니다. 같은 글이 사이트 페이지가 되고, 패키징 때 스킬로 바뀝니다. 아직 옮기지 않은 스킬은 `plugins/webapp/skills/`에 있습니다.
- **지침과 예시 분리**: 공통 글은 특정 기술 스택이나 라이브러리에 묶이지 않는 판단 기준만 담습니다. 스택별 구현은 공개 오픈소스 고정 커밋에서 발췌한 코드로 스택 파일(사이트)이나 `examples/`(스킬)에 둡니다. 사이트는 고른 스택의 글만 보이고, 프로젝트는 AGENTS.md의 `Webapp 스택:` 줄로 자기 스택의 예시만 읽습니다.
- **디자인 시스템 레지스트리**: 스타일 레시피와 프레임워크별 어댑터(React, Angular)를 [dev.goraebap.xyz/r](https://dev.goraebap.xyz/r/registry.json)에서 통째로 받아 씁니다.
- **분야별 플러그인 확장**: 플랫폼이나 분야가 다르면 `plugins/` 아래에 별도 플러그인으로 관리합니다.

## 저장소 구성

| 경로 | 내용 |
| --- | --- |
| `plugins/webapp/` | Webapp 플러그인의 패키징·검사 도구와 생성 배포본(`dist/`) |
| `web/apps/blog/` | 지침 사이트 dev.goraebap.xyz (React) |
| `web/apps/sso/` | 계정·로그인 화면 (Angular) |
| `web/packages/` | 디자인 시스템 레시피와 React·Angular 어댑터 |
| `server/` | sso의 API (Spring) |

로컬 실행은 `web/`에서 `pnpm install`을 한 뒤 루트에서 `sh dev.sh [all|blog|sso|server]`로 합니다.

## 플러그인 목록

| 플러그인 | 식별자 | 다루는 범위 | 예시 스택 | 안내 |
| --- | --- | --- | --- | --- |
| **Webapp** | `webapp@dev-goraebap` | 웹 앱 개발 절차, 아키텍처, API, DB, 백엔드, 프론트엔드, UI/UX | React · Angular · Spring | [사용 안내](plugins/webapp/docs/plugin-usage.md) · [개발 안내](plugins/webapp/README.md) |

## 설치

에이전트에게 부탁할 때는 이렇게 말합니다.

> dev-goraebap 마켓플레이스(https://github.com/dev-goraebap/dev.goraebap)에서 `webapp@dev-goraebap` 플러그인을 설치해 줘.

Claude Code에서는 마켓플레이스를 등록한 뒤 필요한 플러그인을 설치합니다.

```text
/plugin marketplace add dev-goraebap/dev.goraebap --scope user
/plugin install webapp@dev-goraebap --scope user
```

Codex에서는 다음을 실행합니다.

```text
codex plugin marketplace add https://github.com/dev-goraebap/dev.goraebap.git --ref main
codex plugin add webapp@dev-goraebap
```

Antigravity에서는 패키징된 플러그인 폴더(`plugins/webapp/dist/antigravity/plugins/webapp`)를 사용자 플러그인 경로(`~/.gemini/config/plugins/webapp`)에 복사하거나 연결하면 자동으로 불러옵니다.

## 업데이트

Claude Code에서는 마켓플레이스와 플러그인을 갱신한 뒤 `/reload-plugins`를 입력하거나 새 세션을 엽니다.

```text
claude plugin marketplace update dev-goraebap
claude plugin update webapp@dev-goraebap
```

Codex에서는 다음을 실행합니다.

```text
codex plugin marketplace upgrade dev-goraebap
```

Antigravity에서는 저장소를 최신으로 받은 뒤 `plugins/webapp/dist/antigravity/plugins/webapp`을 `~/.gemini/config/plugins/webapp`에 다시 반영합니다(심링크·정션으로 연결해 두면 `git pull`만으로 갱신됩니다).
