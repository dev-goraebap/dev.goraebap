---
title: 화면·슬라이스 추가
summary: 새 화면이나 기능을 만들 때 어느 레이어와 폴더에 배치하고, 언제 하위 레이어로 승격할지 다루는 공통 절차입니다.
order: 2
icon: file
---

프레임워크별 라우트 파일 작성법은 스택 전환(`React · TanStack` · `Angular`)을 따르고, 각 단계에서 필요한 레퍼런스([디렉토리 구조](../../reference/directory-structure/index.md) · [구성 요소와 실행 흐름](../../reference/components-and-flow/index.md) · [상태 관리와 데이터 흐름](../../reference/state-and-data-flow/index.md) · [라우팅과 화면 전환](../../reference/routing/index.md) · [코드 스타일과 네이밍](../../reference/code-style/index.md))를 함께 확인합니다.

## 1. URL 경로 확정과 라우트 슬라이스 생성

1. [라우팅과 화면 전환](../../reference/routing/index.md) 기준에 맞춰 새 화면이 열릴 URL 경로와 모달·마스크 여부를 먼저 확정합니다. 모달과 URL 경계가 애매하면 [URL과 라우티드 모달](../../articles/url-and-routed-modals.md)을 참고합니다.
2. `src/pages/` 아래에 URL 경로와 1:1로 대응하는 폴더(라우트 슬라이스)를 만듭니다.
3. 하위 주소 여러 개에 공통 레이아웃·권한 가드·초기 데이터 준비가 필요하면 부모 폴더(또는 경로 없는 레이아웃)에 분리합니다.

## 2. 코로케이션으로 화면과 상태 흐름 구현

처음부터 코드를 여러 레이어로 미리 나누지 않습니다.

1. 이 화면에서만 쓰는 UI 조각, 상태·로직, API 요청은 해당 `pages/<route>/` 폴더 안에 둡니다.
2. [구성 요소와 실행 흐름](../../reference/components-and-flow/index.md)과 [상태 관리와 데이터 흐름](../../reference/state-and-data-flow/index.md)에 맞춰 URL·서버 데이터·초안·로컬 UI 상태의 소유자를 나눕니다. 상태 소유 경계나 이펙트 사용이 애매하면 [상태 소유권 경계](../../articles/state-ownership-boundaries.md)와 [이펙트와 파생 상태](../../articles/effects-and-derived-state.md)를 참고합니다.
3. 파일이 한두 개뿐이라면 굳이 세그먼트 폴더를 나누지 않고, 파일이 늘어나 역할 구분이 필요해질 때 `ui/`, `model/`, `api/`로 정리합니다.

## 3. 재사용 시점에 하위 레이어로 승격

두 개 이상의 라우트 슬라이스가 같은 코드를 필요로 하면 아래 기준에 따라 위치를 옮깁니다. 레이어 분리의 판단 근거가 필요하면 [왜 FSD 레이어인가](../../articles/why-fsd-layers.md)를 참고합니다.

| 상황 | 옮길 위치 |
| --- | --- |
| 같은 부모 경로 아래 형제 화면끼리만 공유하는 조각 | **공통 조상 라우트 폴더** |
| 여러 페이지에서 반복되며 `features`·`entities`를 함께 조합하는 독립 UI 블록 | **`widgets/<widget>/`** |
| 서로 다른 영역의 화면에서 재사용하는 사용자 동작·상호작용 | **`features/<feature>/`** |
| 여러 화면·피처가 공유하는 도메인 모델, 서버 조회 옵션, 표시 컴포넌트 | **`entities/<entity>/`** |
| 업무 지식이 전혀 없는 순수 공용 UI·유틸·API 헬퍼 | **`shared/<segment>/`** |

## 4. 공개 API(`index.ts`) 노출

`widgets/`, `features/`, `entities/`에 슬라이스를 만들었다면 루트에 `index.ts`를 두고 외부에서 필요한 심볼만 명시적으로 re-export합니다.

- 호출하는 쪽은 `@/widgets/<widget>`, `@/features/<feature>`, `@/entities/<entity>`처럼 슬라이스 루트만 import합니다.
- 내부 구현 파일(`ui/...`, `model/...`)을 외부에서 직접 import하지 않습니다.

## 5. 경계 체크리스트 확인

작업을 마무리하기 전에 아래 다섯 가지를 확인합니다.

- [ ] `pages` 안의 파일이 형제 라우트 폴더를 참조하고 있지 않은가?
- [ ] `widgets`·`features`·`entities` 슬라이스가 같은 레이어의 다른 슬라이스를 참조하고 있지 않은가?
- [ ] 외부에서 슬라이스 내부 파일 경로를 직접 import하지 않고 `index.ts`를 통하는가?
- [ ] 하위 레이어가 상위 레이어를 역참조하고 있지 않은가?
- [ ] 타입 검사·린트·빌드가 오류 없이 통과하는가?
