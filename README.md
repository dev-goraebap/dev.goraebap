# dev-goraebap

웹 개발 지침 플러그인 **Webcraft**(`webcraft@dev-goraebap`)를 관리합니다.

## Webcraft

Webcraft는 웹 앱의 구현·버그 수정·구조 변경을 위한 절차와 프론트엔드·디자인 시스템·백엔드·API·DB·아키텍처 지침을 제공합니다.

## 설치

에이전트에게 부탁할 때는 이렇게 말합니다.

> Webcraft 플러그인(webcraft@dev-goraebap)을 설치해 줘. 마켓플레이스 주소는 https://github.com/dev-goraebap/dev.goraebap 이야.

Claude Code에서는 마켓플레이스를 더한 뒤 플러그인을 설치합니다.

```
/plugin marketplace add dev-goraebap/dev.goraebap --scope user
/plugin install webcraft@dev-goraebap --scope user
```

Codex에서는 다음을 실행합니다.

```
codex plugin marketplace add https://github.com/dev-goraebap/dev.goraebap.git --ref main
codex plugin add webcraft@dev-goraebap
```

## 업데이트

Claude Code에서는 마켓플레이스와 플러그인을 차례로 갱신한 뒤 새 세션을 엽니다.

```
claude plugin marketplace update dev-goraebap
claude plugin update webcraft@dev-goraebap
```

Codex에서는 다음을 실행합니다.

```
codex plugin marketplace upgrade dev-goraebap
```

## 대표 예제

지침을 적용한 대표 프로젝트는 [cowork](https://github.com/dev-goraebap/cowork)입니다. 지침의 코드 링크는 cowork의 고정 커밋을 가리킵니다.

## 저장소 구성

| 위치 | 역할 |
| --- | --- |
| `plugins/webcraft/` | 플러그인 지침 원본·패키징 도구·테스트·생성 배포본 |
| `examples/cowork/` | cowork 서브모듈. 읽기 전용이며 지침 링크 검사에 씁니다 |
| `docs/decisions.md` | 결정 기록 |

저장소는 `git clone --recurse-submodules`로 받거나, 받은 뒤 `git submodule update --init`을 실행합니다.

플러그인 개발은 [플러그인 개발 안내](plugins/webcraft/README.md)를, 에이전트 작업 규칙은 [AGENTS.md](AGENTS.md)를 따릅니다.
