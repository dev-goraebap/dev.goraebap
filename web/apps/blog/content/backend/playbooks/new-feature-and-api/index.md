---
title: 새 기능·API 추가
summary: 새 백엔드 기능이나 API 엔드포인트를 컨텍스트 배치, 쓰기·읽기 분리, 계약, 데이터 접근, 검증까지 한 흐름으로 구현하는 공통 절차입니다.
order: 2
icon: code
---

스택별 코드 작성법은 각 레퍼런스의 스택 파일을 함께 읽습니다. 설계 경계가 애매한 단계에서는 연결된 아티클을 참고해 판단합니다.

## 1. 컨텍스트와 패키지 위치 결정

[디렉토리·패키지 구조](../../reference/directory-structure/index.md)에 따라 이 기능이 속할 컨텍스트와 내부 폴더 위치를 먼저 정합니다.

1. 기존 컨텍스트의 책임에 속하면 그 컨텍스트의 `application/` 아래에 배치하고, 독립된 업무 경계면 새 컨텍스트를 만듭니다.
2. 기능이 둘 이상으로 늘어나면 `application/<feature>/` 아래에 피처별로 묶고, 공통 예외·포트는 `application/` 루트에 둡니다.
3. 다른 컨텍스트의 기능이 필요하면 상대 컨텍스트의 공개 계약(`*Facade` 등)만 참조합니다.
4. 타입별·피처별 배치나 컨텍스트 경계가 애매하면 [타입별 패키징과 피처별 패키징](../../articles/type-vs-feature-packaging.md)과 [컨텍스트와 레이어 설계](../../articles/context-and-layers.md)를 참고합니다.

## 2. 쓰기(Command)와 읽기(Query) 경로 구분

[구성 요소와 실행 흐름](../../reference/components-and-flow/index.md)을 기준으로 요청의 성격을 먼저 나눕니다.

1. **상태 변경(쓰기)**: `Controller → Service(트랜잭션) → Domain 애그리거트 · Repository 포트` 흐름을 따릅니다.
2. **화면 조회·목록·검색·집계(읽기)**: 애그리거트를 거치지 않고 `application`의 `*Query` 포트와 `infrastructure`의 읽기 전용 구현체로 분리합니다.
3. 쓰기와 읽기를 한 경로에 둘지 나눌지 애매하면 [커맨드와 쿼리 분리](../../articles/command-and-query.md)를 참고합니다.

## 3. API 계약과 오류 정의

[API 설계](../../reference/api-design/index.md)와 [오류 처리](../../reference/error-handling/index.md) 기준으로 외부 인터페이스를 고정합니다.

1. 리소스 중심 URL, HTTP 메서드, 요청·응답 DTO, 상태 코드를 정합니다.
2. 입력 검증은 진입 계층(Controller)에서 수행하고, 도메인 불변식은 `domain` 모델이 검증합니다.
3. 실패 상황마다 컨텍스트 전용 에러 코드와 표준 문제 응답(`Problem Details`) 매핑을 정의합니다.

## 4. 도메인 모델과 데이터 접근 구현

[데이터 접근](../../reference/data-access/index.md) 기준으로 영속성 계층을 연결합니다.

1. 테이블 변경이 필요하면 버전 순서에 맞는 스키마 마이그레이션 파일을 먼저 추가합니다.
2. 상태 변경은 애그리거트 루트 단위의 `*Repository` 포트와 구현체로 처리합니다.
3. 복잡한 조인·필터·페이지네이션 조회는 SQL 중심 쿼리 구현체로 작성합니다. 데이터 접근 방식이 애매하면 [SQL 우선 데이터 접근](../../articles/sql-first-data-access.md)을 참고합니다.

## 5. 코드 스타일과 경계 확인

[코드 스타일과 네이밍](../../reference/code-style/index.md)을 검토하고 작업을 마무리하기 전에 아래 항목을 확인합니다.

- [ ] Controller가 비즈니스 로직이나 Repository 직접 호출을 담고 있지 않은가?
- [ ] 같은 컨텍스트 안의 Service끼리 서로 직접 호출하고 있지 않은가?
- [ ] 다른 컨텍스트의 내부 패키지(`application`, `domain`, `infrastructure`)를 침범하지 않았는가?
- [ ] `domain` 계층이 웹·DB·DI 프레임워크에 의존하지 않는가?
- [ ] 포맷·린트·정적 분석·단위 테스트·통합 테스트가 모두 통과하는가?
