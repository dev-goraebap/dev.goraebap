# 고래밥 워크플로우 플러그인

프로젝트의 개발 지침과 설치·비교·업데이트 관리 도구를 배포한다. 식별자와 버전은 이 폴더의 package.json이 소유한다.

- skills는 프로젝트에 제공하는 개발 지침이다.
- manager는 명시 호출용 관리 스킬·CLI·동기화 템플릿이다.
- scripts와 tests는 플러그인 검사·배포·회귀 검증을 담당한다.
- dist는 두 에이전트의 생성 배포본이다. 직접 수정하지 않는다.

설치와 사용은 [플러그인 안내](docs/plugin-usage.md)를 따른다. 저장소 루트의 npm run workflow, npm test, npm run check, npm run package:plugins는 이 폴더의 명령에 연결한다. 이 폴더에서는 npm run workflow, npm test, npm run check, npm run package로 같은 도구를 실행할 수 있다.

프론트엔드 구현과 Storybook은 [frontend](../frontend/README.md)에서 관리하며 배포하지 않는다. 스킬에는 사용 기준과 공개 코드 링크만 둔다. 루트의 마켓플레이스 연결 파일을 통해 plugin/dist의 생성본을 설치한다.
