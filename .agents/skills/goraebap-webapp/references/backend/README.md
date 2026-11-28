# 백엔드

공통 기준(`index.md`)을 먼저 읽고, 프로젝트 스택에 해당하는 구현 파일만 함께 읽습니다.

스택별 구현 파일: `springboot.md`

## 플레이북

- [프로젝트 구성](playbooks/project-setup/index.md): 새 백엔드 서버를 표준 구조와 검증 도구까지 갖춰 세팅하는 공통 절차입니다.

## 레퍼런스

- [디렉토리·패키지 구조](reference/directory-structure/index.md): 백엔드 소스를 업무 영역(컨텍스트)과 기술 기반 영역(shared)으로 분리하는 구조 기준과 의존성 경계 규칙입니다.
- [구성 요소와 실행 흐름](reference/components-and-flow/index.md): 컨텍스트 내부를 구성하는 계층별 구성 요소의 책임, 호출 방향, 금지 규칙입니다.
- [API 설계](reference/api-design/index.md): 백엔드 HTTP API의 경로, 상태 코드, 요청·응답 형식, 목록 페이징, 명세 계약 규칙입니다.
- [에러 처리](reference/error-handling/index.md): 백엔드 API의 에러 응답 형식, 예외 분류, 에러 코드 규칙, 요청 추적(traceId) 기준입니다.
- [데이터 접근](reference/data-access/index.md): 데이터베이스 스키마 관리, 명령(쓰기)과 조회(읽기)의 분리, 컨텍스트 간 테이블 접근, 시간·트랜잭션 규칙입니다.
- [표준 라이브러리](reference/standard-libraries/index.md): 백엔드 서버에서 표준 도구를 지정하는 기능 영역과 도입 원칙입니다.
- [코드 스타일과 네이밍](reference/code-style/index.md): 백엔드 코드의 역할별 네이밍, 불변성과 상태 변경, 예외·import 위생, 코드 품질 도구 역할 분리 기준입니다.
