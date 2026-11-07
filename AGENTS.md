# goraebap-workflow

개인 공통 개발 방식과 프로젝트별 변경의 관계를 관리한다. 지침과 문서는 한국어로 쓴다.

스킬과 참고 자료를 쓰거나 고칠 때는 [글쓰기 기준](plugin/skills/goraebap-mode/references/writing.md)을 따른다. 스킬 본문도 그 기준의 본보기로 쓴다. 규칙을 설명하는 문장과 예시에 같은 문체를 적용한다.

- `plugin/skills/`는 프로젝트로 배포하는 개발 지침의 원본이다. 특정 회사의 제품 동작, 접속 정보, 업무 데이터는 넣지 않는다.
- `plugin/manager/skills/`는 개인 플러그인으로 배포하는 관리 지침, `plugin/manager/scripts/`는 그 실행 도구다.
- 프로젝트에서 고친 규칙은 프로젝트 소유다. 공통 원본 반영은 별도 제안으로 검토한다.
- 로컬 개발 맥락이 필요하면 `.local/README.md`를 읽는다. `.local/`은 Git과 배포 패키지에서 제외한다.
- 생성한 `plugin/dist/`는 직접 고치지 않는다. `npm run package:plugins`로 다시 만든다.
- 도구 변경 후 `npm test`, 스킬 변경 후 `npm run check`, 패키징 변경 후 두 플러그인 패키지를 확인한다.
- 커밋·푸시·전역 설치는 사용자가 요청할 때만 한다.

- 플러그인 구현·지침·테스트·생성 배포본은 `plugin/`에 둔다. `frontend/`의 코드·MDX·Story·자산은 플러그인에 포함하지 않는다.
- 루트의 `.claude-plugin/marketplace.json`과 `.agents/plugins/marketplace.json`은 설치 도구가 찾는 연결 파일이며 `plugin/dist`를 가리킨다.
