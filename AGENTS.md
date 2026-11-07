# goraebap-workflow

개인 공통 개발 방식과 프로젝트별 변경의 관계를 관리한다. 지침과 문서는 한국어로 쓴다.

스킬과 참고 자료를 쓰거나 고칠 때는 [글쓰기 기준](plugin/skills/goraebap-mode/references/writing.md)을 따른다. 스킬 본문도 그 기준의 본보기로 쓴다. 규칙을 설명하는 문장과 예시에 같은 문체를 적용한다.

- `plugin/skills/`는 프로젝트로 배포하는 개발 지침의 원본이다. 특정 회사의 제품 동작, 접속 정보, 업무 데이터는 넣지 않는다.
- 프로젝트는 지침 사본을 두지 않고 AGENTS.md로 플러그인을 가리킨다. 프로젝트만 다르게 하는 규칙은 그 프로젝트 AGENTS.md의 "프로젝트 규칙"에 두며, 공통 원본 반영은 별도 제안으로 검토한다.
- 로컬 개발 맥락이 필요하면 `.local/README.md`를 읽는다. `.local/`은 Git과 배포 패키지에서 제외한다.
- 생성한 `plugin/dist/`는 직접 고치지 않는다. `npm run package:plugins`로 다시 만든다.
- 도구 변경 후 `npm test`, 스킬 변경 후 `npm run check`, 패키징 변경 후 두 플러그인 패키지를 확인한다.
- 커밋·푸시·전역 설치는 사용자가 요청할 때만 한다.

- 키트(`frontend/reference`)로 화면을 만들거나 고치면 끝내기 전에 design-system 스킬의 [문구·본문과 검증](plugin/skills/design-system/references/content-and-review.md) 검증 절차로 대조한다. 데이터 상태·모션·콘텐츠 폭·키보드·데스크톱과 휴대폰·라이트와 다크를 실제 화면에서 확인하고, 확인한 것과 못 한 것을 나눠 보고한다. 가이드(`site/`)도 키트로 그린 화면이므로 같다.
- 화면 규칙의 원본은 `plugin/skills/design-system`의 Markdown이다. `site/`(키트로 그린 React 가이드)는 플러그인 지침 전체를 보여 주는 사이트이며 플러그인에 포함하지 않는다. 지침 문서는 스킬 Markdown을 그대로 보여 주고, 화면 해설은 `site/content`에 둔다. 규칙을 바꾸면 스킬을 먼저 고치고 가이드는 다시 쓴다.
- 플러그인 구현·지침·테스트·생성 배포본은 `plugin/`에 둔다. `frontend/`의 코드·견본·테스트·자산과 `site/`는 플러그인에 포함하지 않는다.
- 루트의 `.claude-plugin/marketplace.json`과 `.agents/plugins/marketplace.json`은 설치 도구가 찾는 연결 파일이며 `plugin/dist`를 가리킨다.
