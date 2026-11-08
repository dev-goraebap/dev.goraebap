# dev-goraebap

개발하며 배운 것을 기록하는 블로그와 웹 개발 지침 플러그인 **Webcraft**를 함께 관리합니다. 블로그와 Webcraft 가이드는 하나의 사이트로 구성합니다.

- [사이트](https://goraebap.xyz/)
- [블로그](https://goraebap.xyz/blog/)
- [Webcraft 가이드와 실행 견본](https://goraebap.xyz/webcraft/)

## Webcraft

Webcraft는 웹 앱의 구현·버그 수정·구조 변경을 위한 절차와 프론트엔드·디자인 시스템·백엔드·API·DB·아키텍처 지침을 제공합니다. 플러그인 식별자는 `webcraft@dev-goraebap`입니다.

Codex에서는 다음 명령으로 설치합니다.

```text
codex plugin marketplace add https://github.com/dev-goraebap/dev.goraebap.git --ref main
codex plugin add webcraft@dev-goraebap
```

Claude Code 설치와 프로젝트 연결·기존 지침 사본 전환은 [플러그인 사용 안내](plugins/webcraft/docs/plugin-usage.md)를 따릅니다. 프로젝트별로 다른 결정은 AGENTS.md의 프로젝트 규칙에 남깁니다.

## 저장소 구성

| 위치 | 역할 |
| --- | --- |
| `plugins/webcraft/` | 플러그인 지침 원본·패키징 도구·테스트·생성 배포본 |
| `site/src/` | 블로그와 Webcraft를 함께 제공하는 React 사이트. FSD 계층으로 구성합니다 |
| `site/content/blog/posts/` | 블로그 글과 원본 이미지 |
| `site/content/` | Webcraft 화면 해설과 견본 문서 |
| `site/samples/` | 실제 동작을 검증하는 실행 견본 |

사이트 실행·글 추가·배포 방법은 [사이트 개발 안내](site/README.md), 플러그인 개발은 [플러그인 개발 안내](plugins/webcraft/README.md)를 따릅니다. 에이전트 작업 규칙은 [AGENTS.md](AGENTS.md)에 있습니다.
