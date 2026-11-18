# dev-goraebap

웹 개발 지침 플러그인 **Webcraft**와 그 매뉴얼을 관리합니다.

- [Webcraft 매뉴얼](https://goraebap.xyz/)

## Webcraft

Webcraft는 웹 앱의 구현·버그 수정·구조 변경을 위한 절차와 프론트엔드·디자인 시스템·백엔드·API·DB·아키텍처 지침을 제공합니다. 플러그인 식별자는 `webcraft@dev-goraebap`입니다. 설치와 사용법은 [매뉴얼](https://goraebap.xyz/getting-started/)을 따릅니다.

## 저장소 구성

| 위치 | 역할 |
| --- | --- |
| `plugins/webcraft/` | 플러그인 지침 원본·패키징 도구·테스트·생성 배포본 |
| `site/` | 매뉴얼 사이트(Starlight). 원문은 `site/src/content/docs/`의 MDX |
| `site/public/r/` | shadcn 레지스트리 `@webcraft` JSON |
| `docs/decisions.md` | 결정 기록 |
| `deploy/site.sh` | 홈서버 배포 |

매뉴얼은 `site/`에서 `npm ci` 후 `npm run dev`로 띄워 봅니다. 플러그인 개발은 [플러그인 개발 안내](plugins/webcraft/README.md)를, 에이전트 작업 규칙은 [AGENTS.md](AGENTS.md)를 따릅니다.
