# Webcraft 개발

웹 개발 지침 플러그인 `webcraft`의 원본입니다. 마켓플레이스 이름은 `dev-goraebap`이며 설치 식별자는 `webcraft@dev-goraebap`입니다. 설치·연결·갱신 방법은 [사용 안내](docs/plugin-usage.md)에 있습니다.

`skills/`가 지침 원본이고, `scripts/`와 `tests/`는 검사·패키징을 담당합니다. `dist/`는 생성물이므로 직접 고치지 않습니다. 사이트·블로그·실행 견본은 이 패키지에 넣지 않습니다.

저장소 루트에서 다음 명령을 실행합니다.

```text
npm run check
npm test
npm run package:plugins
```

Claude와 Codex 배포본은 모두 `dist/`에 생성합니다. 새 플러그인은 이 폴더에 섞지 않고 상위 `plugins/`의 별도 폴더에 둡니다. 플러그인을 더하면 루트 마켓플레이스 연결 파일에도 등록합니다.
