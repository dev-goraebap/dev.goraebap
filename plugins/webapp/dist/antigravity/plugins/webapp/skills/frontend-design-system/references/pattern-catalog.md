---
arc42: "8.8"
---

# 패턴의 글과 코드

화면을 만들기 전에 해당 패턴의 사용 기준과 구현 예시를 함께 읽습니다. 글은 선택 기준과 지킬 조건, 코드는 배치와 동작을 확인하는 데 씁니다. 주제별 구현 발췌와 원본 위치는 각 스킬의 `examples/`에 있습니다([예시 읽기](../../goraebap-mode/references/examples.md)).

## 범주와 원본

| 범주 | 소유하는 내용 | 지침 |
| --- | --- | --- |
| Foundations (디자인 기초) | 테마·색상, 글자, 간격·크기, 면·경계·그림자·곡률, 아이콘, 모션 | [테마](theme.md), [글자](typography.md), [간격](spacing.md), [면](surfaces.md), [아이콘](icons.md), [모션](../../frontend-interaction/references/motion.md) |
| Primitives (기본 컴포넌트) | 컴포넌트 라이브러리 컴포넌트의 쓰임과 변형 | [기본 컴포넌트](basic-components.md) |
| Composites (조합 컴포넌트) | 다이얼로그·팝오버·검색·필터·표시·속성·올리기·상태·본문 칸 | [조합 컴포넌트](composed-components.md), [다이얼로그](dialog.md), [검색·필터·표시](search-filter.md) |
| Layouts (레이아웃) | 앱 셸·공간·사이드바·모바일 탐색·페이지 머리·칸 머리·툴바·목록·표·상세·설정·옆 패널 | [앱 셸](app-layout.md), [페이지 배치](layout-patterns.md) |
| Patterns (사용 패턴) | 여러 화면에 걸리는 동작 계약: 리소스 화면 패턴(List-Detail·Drill-down·Routed Modal), 라우트 마스킹, 조건의 주소, 대기·빈 상태·실패, 행 클릭·키보드 | [리소스 화면 패턴](resource-patterns.md), [라우트 마스킹](../../frontend-interaction/references/route-masking.md), [데이터 상태](../../frontend-interaction/references/data-states.md), [입력과 상호작용](../../frontend-interaction/references/interaction-patterns.md) |

Primitives와 Composites는 재사용 코드의 단위입니다. Layouts와 Patterns는 공간과 행동의 기준이며 더 큰 컴포넌트라는 이유로 분류하지 않습니다. 여러 화면이 함께 지키는 여는 방식·상태·조작은 Patterns입니다. 같은 구현을 여러 설명에서 참조하되 코드와 규칙의 원본은 한 곳에 둡니다. 파일 배치와 상태·캐시·URL·초안은 [프론트엔드 엔지니어링](../../frontend-engineering/SKILL.md) 지침을 따릅니다. 접근성·반응형·키보드·문구는 모든 범주의 공통 검토 기준이며 [문구·본문과 검증](content-and-review.md)을 따릅니다.

## 원본과 갱신

SKILL.md는 지침을 찾는 입구입니다. 규칙의 원본은 이 스킬의 Markdown입니다. references의 Markdown이 판단 기준과 확인할 동작을 소유합니다. `examples/`의 코드는 규칙을 적용한 견본이며 규칙을 다시 정하지 않습니다. 규칙이 바뀌면 스킬을 먼저 고치고 예시를 맞춥니다.

규칙을 바꾸면 Markdown과 참고 키트 코드를 함께 고칩니다. 색·간격은 화면마다 보정하지 않고 테마와 컴포넌트에서 고칩니다. 출처·비교·제작 기록은 Git과 배포에서 제외한 개발 자료에 둡니다.

참고 키트 코드는 예시가 가리키는 공개 저장소에 두고 플러그인 패키지에 넣지 않습니다. 설치된 지침에서는 예시 파일의 고정 커밋 링크로 필요한 파일만 읽습니다. 채택할 때는 필요한 컴포넌트 파일만 복사합니다([레퍼런스 사용과 갱신](reference-kit.md)). 복사한 코드는 그 프로젝트 소유이며 원본 저장소에서 import하지 않습니다.

## 실행과 검토

프로젝트는 화면 규칙을 검사하는 스크립트를 두고 lint·타입 검사·빌드와 함께 한 명령으로 돌립니다. 화면 규칙 검사는 다음을 막습니다.

- 층 방향을 거스르는 import, 같은 층의 다른 조각 import, 페이지에서 다른 주소의 파일 import
- 팔레트 색, 다크 변형으로 색 덮어쓰기, 직접 쓴 색 값, 형제 사이 간격 유틸리티(간격은 부모의 gap으로), `!important`, CSS 모듈
- 인라인 스타일(데이터에서 온 값처럼 이유를 주석으로 남긴 곳만 허용)
- 아이콘 세트의 직접 import(공통 아이콘 모듈로), 역할로 지은 유틸 파일의 import

키트·본문 편집기·테마 파일에는 색·간격 규칙을 걸지 않고 층과 import 검사만 겁니다. 자동 검증과 사람이 본 시각·키보드·실기기 범위를 구분해 기록합니다.

프로젝트의 비밀값·실제 계정·업무 데이터를 예제에 넣지 않습니다. 서버 응답은 경계에서 모의 저장소로 대체하고, 예제를 실행해도 실제 업무가 생기지 않게 합니다.
