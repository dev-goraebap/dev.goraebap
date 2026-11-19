# Webapp 개발

웹 개발 지침 플러그인 `webapp`의 원본입니다. 마켓플레이스 이름은 `dev-goraebap`이며 설치 식별자는 `webapp@dev-goraebap`입니다. 설치·연결·갱신 방법은 [사용 안내](docs/plugin-usage.md)에 있습니다.

`skills/`가 핵심 지침 원본이고, `adapters/`가 스택별 오픈소스 프로젝트 어댑터 스냅샷입니다. `scripts/`와 `tests/`는 검사·패키징을 담당합니다. 핵심 지침은 스택과 특정 어댑터 없이 판단 기준만 담고, 프로젝트는 AGENTS.md의 `Webapp 어댑터:` 줄로 따를 어댑터를 정합니다. `dist/`는 생성물이므로 직접 고치지 않습니다. 사이트·블로그는 이 패키지에 넣지 않습니다.

이 폴더(`plugins/webapp/`)에서 다음 명령을 실행합니다.

```text
npm run check
npm run check:links
npm test
npm run package
```

Claude, Codex, Antigravity 배포본은 모두 `dist/`에 생성합니다. 새 플러그인은 이 폴더에 섞지 않고 상위 `plugins/`의 별도 폴더에 둡니다. 플러그인을 더하면 루트 마켓플레이스 연결 파일에도 등록합니다.
