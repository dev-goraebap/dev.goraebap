# dev-goraebap

웹 앱 풀스택 구현 기준 플러그인 **`fullstack`**(`goraebap-mode`, `frontend-engineering`, `frontend-uiux`, `backend-engineering`)과 같은 기준을 사람이 읽는 사이트([dev.goraebap.xyz](https://dev.goraebap.xyz))를 함께 관리하는 저장소입니다.

## 설계 방식

- **단일 원본에서 사이트와 플러그인을 함께**: 지침 글의 원본은 `web/apps/blog/content/`입니다. 같은 문서가 사이트 페이지가 되고, `plugins/fullstack/`에서 빌드하면 Claude Code·Codex·Antigravity용 `fullstack` 플러그인과 마켓플레이스 파일이 생성됩니다.
- **Diátaxis 분면과 공통·스택 분리**: 튜토리얼·플레이북·아티클·레퍼런스·용어집으로 나누고, 특정 프레임워크에 묶이지 않는 공통 기준(`index.md`)과 스택 구현(`react-tanstack`·`angular`·`springboot`)을 파일로 분리합니다.
- **명시 호출 전용 · 구현 기준 집중**: 모든 스킬은 의도치 않게 개입하지 않도록 명시 호출 전용으로 패키징합니다. 요구사항·명세·리뷰 같은 작업 절차는 외부 하네스에 맡깁니다([ADR 0002](docs/adr/0002-implementation-only.md)).
- **디자인 시스템 레지스트리**: 스타일 레시피와 프레임워크별 어댑터(React, Angular)를 [dev.goraebap.xyz/r](https://dev.goraebap.xyz/r/registry.json)에서 제공합니다.

## 저장소 구성

| 경로 | 내용 |
| --- | --- |
| `web/apps/blog/` | 지침 사이트 `dev.goraebap.xyz` (React)와 지침 단일 원본 `content/` |
| `plugins/fullstack/` | `content/`에서 Claude·Codex·Antigravity용 `fullstack` 플러그인 빌드·검사 (`dist/` 커밋) |
| `.claude-plugin/` · `.agents/plugins/` | Claude Code · Codex 마켓플레이스 매니페스트 |
| `web/apps/react-tanstack-demo/` | React 어댑터(`ui-react`) 라이브 데모 앱 (블로그 iframe 연동) |
| `web/apps/angular-demo/` | Angular 어댑터(`ui-angular`) 라이브 데모 앱 (블로그 iframe 연동) |
| `web/packages/` | 디자인 시스템 레시피(`design-system`)와 React·Angular 어댑터(`ui-react`, `ui-angular`) |
| `docs/guides/` · `docs/adr/` | 저장소 작업 가이드와 되돌리기 어려운 아키텍처 결정 기록(ADR) |

## 플러그인 설치

### Claude Code

저장소 루트의 `.claude-plugin/marketplace.json`을 통해 설치합니다.

```bash
/plugin marketplace add dev-goraebap/dev.goraebap
/plugin install fullstack@dev-goraebap
```

### Codex

저장소 루트의 `.agents/plugins/marketplace.json`을 통해 `fullstack` 플러그인을 활성화합니다.

### Antigravity

`plugins/fullstack/dist/antigravity/plugins/fullstack/` 디렉토리를 `~/.gemini/config/plugins/fullstack/`에 배치하면 자동으로 로드됩니다.

설치 후 필요에 따라 `/fullstack:goraebap-mode`, `/fullstack:frontend-engineering`, `/fullstack:frontend-uiux`, `/fullstack:backend-engineering`을 명시 호출해 사용합니다.

## 로컬 실행과 검사

```bash
# 의존성 설치 (최초 1회)
cd web && pnpm install
cd ../plugins/fullstack && npm ci

# 로컬 개발 서버 (루트)
sh dev.sh [all|blog|react-demo|angular-demo]

# 웹 검사 · 빌드 (web/)
pnpm lint && pnpm typecheck && pnpm build

# 플러그인 빌드 · 검사 (plugins/fullstack/)
npm run build && npm run check
```
