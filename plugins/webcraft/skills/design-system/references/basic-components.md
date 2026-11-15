---
arc42: "8.8"
---

# Primitives (기본 부품)

버튼·라벨·아바타·입력처럼 독립된 UI 역할을 가진 부품은 키트의 shadcn 부품(`@/shared/ui/<이름>`)을 import합니다. 이름만 바꾼 래퍼를 만들어 API를 복제하지 않습니다. 고래밥의 기준은 변형·크기와 쓰임 구분이며, 부품 API(조합, 폼 `Field`, `render` 등)는 shadcn 공식 문서와 스킬을 따릅니다. 요소를 바꿀 때는 `asChild`가 아니라 `render` prop을 씁니다(`<Button render={<Link to="..." />} nativeButton={false}>`).

| 부품 | 쓰는 곳 | 기준 |
| --- | --- | --- |
| Button | 실행 동작 | 크기·종류와 관계없이 알약(`rounded-full`)입니다. 일반 제출·확인은 기본 알약(`default`), 취소는 테두리 없는 `ghost`, 되돌리기 어려운 동작은 `destructive`. 페이지의 만들기만 `create`, 툴바의 둥근 도구는 `tool`/`view-active`, 뷰 알약은 `view`/`view-active` |
| Button(`size="icon"`) | 아이콘만 있는 동작 | 이름과 툴팁을 둡니다. 열린 메뉴·켜진 상태는 Bold Duotone |
| Badge `label` 변형 | 분류·라벨 | 둥근 알약. 링크가 될 수 있습니다(`render`). 실행 도구를 라벨처럼 꾸미지 않습니다 |
| Badge | 개수 | 개수에만 씁니다. 상태는 Badge `label` 변형으로 보입니다 |
| ToolDot | 조건 있음 | 도구 모서리의 점. 이름(`label`)을 함께 둡니다. 상태 점 부품은 따로 두지 않습니다 |
| Avatar | 사람 | 원형. 사람은 사진과 이름을 함께 보이고, 지정 안 됨도 같은 자리와 폭을 지킵니다 |
| Input·Textarea·Select | 이름 있는 값 | 데스크톱 36px·13px, 휴대폰 48px·16px. 입력 칸이라 모서리는 10px입니다. 폼 배치는 Field·FieldGroup으로 합니다. 큰 목록은 Select 대신 검색이 있는 고르기를 씁니다 |
| Select 팝업 | 고르기의 선택지 | 여는 단추의 폭에 묶이지 않고 가장 긴 항목의 폭을 따릅니다(최소는 단추 폭과 9rem 중 큰 쪽). 항목은 최소 36px이며 잘려 보이지 않습니다 |
| Dialog | 열기·닫기·초점 경계 | 제품 화면은 [공통 다이얼로그](dialog.md)를 씁니다. Dialog를 직접 쓰지 않습니다 |

## 조작 면

secondary 단추, `tool`, 보기 탭, 속성 알약, 셀렉트, 필터는 같은 조작 면 토큰(`bg-control`·`hover:bg-control-hover`·`bg-control-on`·`border-control-border`)을 씁니다. 값은 라이트·다크 모두 글자색을 면 색에 섞어 만듭니다. 화면마다 채움의 진하기를 따로 정하지 않습니다.

| 토큰 | 쓰임 | 값 |
| --- | --- | --- |
| `control`(`--color-control`) | 기본 채움 | 글자 5% |
| `control-hover` | 포인터 아래 | 글자 9% |
| `control-on` | 고른 것·켜진 것 | 글자 14% |
| `control-border` | 조작 면의 테두리 | 글자 11% |

단추는 알약이고 초타원(squircle)을 쓰지 않습니다. 묶음 안 단추의 모양(크기·변형)은 자손 선택자로 덮어쓰지 않고 묶음이 내려 주는 설정(`ButtonStyleProvider`)으로 정합니다. 포털로 뜨는 메뉴·팝오버 안에서는 이 설정을 끊습니다(`ButtonStyleReset`). 끊지 않으면 툴바의 작은 단추 설정이 그 툴바에서 연 메뉴의 단추까지 줄입니다.

역할·권한(보기·편집·관리)은 글자만이 아니라 아이콘과 함께 보입니다. 같은 이름의 역할이 화면마다 같은 아이콘을 씁니다.

제목·본문을 쓰는 양식의 입력은 이 표가 아니라 [생성 양식](creation-form.md)을 따릅니다. 날짜는 키트의 [DateCalendar·DatePicker](https://github.com/dev-goraebap/dev.goraebap/blob/main/apps/site/src/shared/ui/date-picker.tsx)(react-day-picker)를 공통으로 쓰고(브라우저 기본 날짜 선택기를 섞지 않습니다), 시간은 직접 입력과 목록을 함께 제공하는 공통 입력으로 받습니다.

모바일 실행 버튼의 최소 너비와 줄 여백은 [간격과 크기](spacing.md)를 따릅니다. 프로필 그림은 28~32px로 두고 누르는 영역을 별도로 최소 44px 확보합니다. 입력의 날짜 열기 버튼, 분할 선택 버튼의 각 항목, 순서 변경 손잡이도 누르는 영역을 확인합니다. 컨트롤 바깥 상자만 커지고 실제 선택 항목은 작게 남지 않게 합니다.

## 견본

Primitives는 실제 크기로 가운데 둡니다. 크기·변형·상태(비활성·처리 중·읽기 전용)를 같은 조건에서 나란히 비교하고, 문서 견본의 높이는 내용만큼만 씁니다. 버튼 이름·입력 라벨·키보드 초점을 확인합니다.
