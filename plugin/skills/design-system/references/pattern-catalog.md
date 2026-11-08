# 패턴의 글·코드·실행 견본

화면을 만들기 전에 해당 패턴의 사용 기준, 구현 파일, 실행 견본을 함께 읽습니다. 글은 선택 기준과 지킬 조건, 코드는 배치와 동작, 견본은 상태와 화면 크기를 바꾸어 확인하는 데 씁니다.

## 범주와 원본

| 범주 | 소유하는 내용 | 지침 | 코드 |
| --- | --- | --- | --- |
| Foundations (디자인 기초) | 테마·색상, 글자, 간격·크기, 면·경계·그림자·곡률, 아이콘, 모션 | [테마](theme.md), [글자](typography.md), [간격](spacing.md), [면](surfaces.md), [아이콘](icons.md), [모션](motion.md) | [foundations](https://github.com/dev-goraebap/goraebap-workflow/tree/main/kit/reference/foundations) |
| Primitives (기본 부품) | Astryx 부품의 쓰임과 변형 | [기본 부품](basic-components.md) | Astryx 직접 사용 |
| Composites (조합 부품) | 다이얼로그·곁에 여는 내용·검색·필터·표시·속성·올리기·상태·본문 칸 | [조합 부품](composed-components.md), [다이얼로그](dialog.md), [검색·필터·표시](search-filter.md) | [composites](https://github.com/dev-goraebap/goraebap-workflow/tree/main/kit/reference/composites) |
| Layouts (레이아웃) | 앱 셸·사이드바·모바일 탐색·페이지 머리·툴바·목록·상세·설정·옆 패널 | [앱 셸](app-layout.md), [페이지 배치](layout-patterns.md) | [layouts](https://github.com/dev-goraebap/goraebap-workflow/tree/main/kit/reference/layouts) |
| Patterns (사용 패턴) | 여러 화면에 걸리는 동작 계약: 라우트 마스킹, 조건의 주소, 대기·빈 상태·실패, 행 클릭·키보드 | [라우트 마스킹](route-masking.md), [데이터 상태](data-states.md), [입력과 상호작용](interaction-patterns.md) | [patterns](https://github.com/dev-goraebap/goraebap-workflow/tree/main/kit/reference/patterns) |
| Playground (플레이그라운드) | 앞의 요소로 만든 기능 단위 앱 16개: 인박스, 이슈, 로그인, 문서함, 설정, 일정, 결재 신청, 권한 설정, 댓글·대화, 활동 기록, 가져오기, 오류·권한 페이지, 폴더 탐색, 태그 관리, 사용자 관리, 처음 시작 | [생성 양식](creation-form.md), [미리보기 패널](peek.md), 이 문서 | [playground](https://github.com/dev-goraebap/goraebap-workflow/tree/main/kit/samples/playground) |

Primitives와 Composites는 재사용 코드의 단위입니다. Layouts와 Patterns는 공간과 행동의 기준이며 더 큰 부품이라는 이유로 분류하지 않습니다. 기능 하나를 작은 앱 하나로 묶어 본뜰 수 있게 한 것은 Playground이고, 여러 앱이 함께 지키는 여는 방식·상태·조작이면 Patterns입니다. Playground는 앱마다 느낌이 확실히 다른 화면만 다루고 같은 모양의 화면은 한 앱에서만 다룹니다. Patterns의 견본은 따로 화면을 만들지 않고 Playground 앱을 그 상태로 띄웁니다. 기존 앱과 느낌이 다른 화면이 필요하면 Playground에 새 앱을 더합니다. 같은 구현을 여러 설명에서 참조하되 코드와 규칙의 원본은 한 곳에 둡니다. 파일 배치는 공식 FSD 지침에 맡기고 상태·캐시·URL·초안은 frontend 지침을 따릅니다. 접근성·반응형·키보드·문구는 모든 범주의 공통 검토 기준이며 [문구·본문과 검증](content-and-review.md)을 따릅니다.

## 원본과 갱신

SKILL.md는 지침을 찾는 입구입니다. 규칙의 원본은 이 스킬의 Markdown입니다. 저장소의 가이드 사이트(`kit/guide`)는 같은 규칙을 사람이 읽도록 풀어 쓴 해설이며, 규칙이 바뀌면 스킬을 먼저 고치고 가이드를 다시 씁니다. references의 Markdown이 판단 기준과 확인할 동작을 소유합니다. 가이드는 규칙 옆에 실제 키트로 그린 견본을 띄우고 규칙을 다시 정하지 않습니다. 견본에는 실제 부품·시작 상태·가상 데이터만 두며 제품 동작을 견본 안에서 다시 구현하지 않습니다. 조작 검증은 견본과 따로 테스트 파일에 둡니다.

규칙을 바꾸면 Markdown, 키트 코드, 견본과 검증을 함께 고칩니다. 색·간격을 견본 전용 CSS로 보정하지 않고 테마와 부품에서 고칩니다. 출처·비교·제작 기록은 Git과 배포에서 제외한 개발 자료에 둡니다.

키트 코드는 공개 저장소의 frontend에 두고 플러그인 패키지에 넣지 않습니다. 설치된 지침에서는 위 링크로 필요한 파일만 읽습니다. 채택할 때는 패딩·슬롯·상태 경계를 재현할 만큼만 프로젝트의 공통 UI 위치로 옮깁니다. 채택한 코드는 그 프로젝트 소유이며 원본 저장소에서 import하지 않습니다.

## 실행과 검토

워크플로우 저장소에서 `npm ci` 후 `npm run guide`로 가이드(4451)를 엽니다. 견본은 규칙 문서 안과 "견본" 메뉴에 있습니다. `kit:check`는 타입, `kit:test`는 모든 견본이 그려지는지와 조작 검증을 Chromium에서 검사합니다. 테스트용 브라우저가 없으면 `npx playwright install chromium`으로 준비합니다.

라이트·다크는 가이드의 테마 선택을 따릅니다. 모드별 견본이나 견본 안의 테마 전환을 만들지 않습니다. 휴대폰 견본을 따로 만들지 않습니다. 가이드의 견본 틀에서 데스크톱(1024px)과 휴대폰(390px)을 바꿔 같은 견본을 보고, 검사도 모든 견본을 두 기기로 그립니다. 대표 견본은 사용자가 조작하기 전에 초점을 옮기지 않습니다. 자동 검증과 사람이 본 시각·키보드·실기기 범위를 구분해 기록합니다.

프로젝트의 비밀값·실제 계정·업무 데이터를 견본에 넣지 않습니다. 서버 응답은 경계에서 모의 저장소로 대체하고, 예제를 실행해도 실제 업무가 생기지 않게 합니다.

## 견본의 배치와 높이

Primitives는 실제 크기로 가로·세로 가운데 둡니다. 크기·변형·상태는 같은 조건에서 나란히 비교하고 설명은 견본 바깥에 둡니다. 문서 견본의 높이는 내용만큼만 씁니다.

Composites는 검토할 동작에 필요한 맥락만 둡니다. 대화상자·팝오버는 열기 버튼과 그 조합만 보이며 가짜 사이드바·페이지·목록을 배경으로 넣지 않습니다. 대화상자 견본은 문서의 독립 iframe에서 열고 닫을 수 있는 높이를 둡니다. 전체 화면 맥락은 레이아웃과 이어지는 사용 흐름을 설명할 때만 씁니다. 제작·검증 설명을 견본 화면에 넣지 않습니다.
