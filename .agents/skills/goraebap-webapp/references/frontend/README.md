# 프론트엔드

공통 기준(`index.md`)을 먼저 읽고, 프로젝트 스택에 해당하는 구현 파일만 함께 읽습니다.

스택별 구현 파일: `react-tanstack.md` · `angular.md`

## 플레이북

- [프로젝트 구성](playbooks/project-setup/index.md): 새 프론트엔드 앱을 FSD 레이어, 표준 라이브러리, 품질 검사까지 갖춰 세팅하는 공통 절차입니다.
- [화면·슬라이스 추가](playbooks/new-page-and-slice/index.md): 새 화면이나 기능을 만들 때 어느 레이어와 폴더에 배치하고, 언제 하위 레이어로 승격할지 다루는 공통 절차입니다.

## 레퍼런스

- [디렉토리 구조](reference/directory-structure/index.md): FSD v2.1의 6개 레이어(선택 레이어 포함)와 주소 기반 pages 규칙, 의존성 경계를 정리합니다.
- [구성 요소와 실행 흐름](reference/components-and-flow/index.md): URL 진입과 사용자 동작이 라우트·뷰·모델·서버 상태·통신 구성 요소를 거쳐 흐르는 책임과 경계 규칙입니다.
- [상태 관리와 데이터 흐름](reference/state-and-data-flow/index.md): 상태 소유자 구분, 서버 데이터와 초안 분리, 조회 옵션·캐시 무효화, 검색 디바운스와 요청 취소 기준입니다.
- [라우팅과 화면 전환](reference/routing/index.md): 리소스 주소 계약, intent prefetch·캐시 우선 전환, 지연 진행 막대, 라우팅 마스크 기준입니다.
- [렌더링과 초기 로딩](reference/rendering/index.md): CSR·SSG·SSR 선택 기준, 초기 진입 스플래시와 웹폰트 흔들림 방지, 지연 로딩 코드·데이터 동시 준비 기준입니다.
- [표준 라이브러리](reference/standard-libraries/index.md): 프론트엔드 앱에서 표준 도구를 지정하는 기능 영역과 도입 원칙입니다.
- [코드 스타일과 네이밍](reference/code-style/index.md): 컴포넌트·페이지 파일 명명, 파생값과 부수 효과 분리, 메모이제이션과 TypeScript 위생 기준입니다.
