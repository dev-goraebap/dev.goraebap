# Composites (조합 부품)

여러 기본 부품을 묶어 반복해 쓰는 단위입니다. 조합은 값과 동작을 props로 받고 제품의 API·라우트·업무 정책을 직접 소유하지 않습니다. Playground 템플릿과 견본은 같은 조합을 import하며 그 안에 같은 UI를 다시 만들지 않습니다. FSD의 widgets와 같은 분류가 아닙니다.

| 조합 | 소유하는 책임 | 코드 |
| --- | --- | --- |
| 공통 다이얼로그·확인 창·짧은 양식 | 위치·여백·스크롤·닫기·초점 | [dialog](https://github.com/dev-goraebap/goraebap-workflow/tree/main/kit/reference/composites/dialog), [기준](dialog.md) |
| 곁에 여는 내용 | 데스크톱 팝오버 ↔ 휴대폰 바텀시트, 시트 손잡이 여백 | [popup](https://github.com/dev-goraebap/goraebap-workflow/tree/main/kit/reference/composites/popup) |
| 동작 메뉴·행 메뉴 | 아이콘·이름·고른 표시, 고른 뒤 닫기 | 같은 폴더 |
| 검색·필터·표시 도구 | 열기·닫기·지우기, 적용 줄, 기본과 다른 표시 | [search](https://github.com/dev-goraebap/goraebap-workflow/tree/main/kit/reference/composites/search), [filter](https://github.com/dev-goraebap/goraebap-workflow/tree/main/kit/reference/composites/filter), [기준](search-filter.md) |
| 속성 알약 | 빈 값·필수·값 고르기, 상세 열에서 행 모양 | [property](https://github.com/dev-goraebap/goraebap-workflow/tree/main/kit/reference/composites/property) |
| 활동·댓글 피드 | 이벤트 한 줄 기록, 댓글 카드·한 단계 답글·수정·삭제·인용, 입력 칸 | [activity](https://github.com/dev-goraebap/goraebap-workflow/tree/main/kit/reference/composites/activity) |
| 행 순서 바꾸기 | 드래그 손잡이·`Alt`+방향키 이동·`Esc` 취소·위치 음성 안내 | [reorder](https://github.com/dev-goraebap/goraebap-workflow/tree/main/kit/reference/composites/reorder) |
| 파일 올리기 칸 | 고르기·끌어 놓기·형식과 크기 확인 | [upload](https://github.com/dev-goraebap/goraebap-workflow/tree/main/kit/reference/composites/upload) |
| 상태 화면 | 빈 목록·결과 없음·없는 대상·실패의 그림과 문구 | [state](https://github.com/dev-goraebap/goraebap-workflow/tree/main/kit/reference/composites/state), [기준](data-states.md) |
| 본문 칸 | 종이 위의 리치 본문 | [editor](https://github.com/dev-goraebap/goraebap-workflow/tree/main/kit/reference/composites/editor) |
| 그룹 머리 | 그룹 이름·개수·접기, 스크롤에 붙는 띠 | [list-group](https://github.com/dev-goraebap/goraebap-workflow/tree/main/kit/reference/composites/list-group) |

## 곁에 여는 내용

버튼 곁에 여는 것은 데스크톱에서 팝오버, 휴대폰에서 언제나 바텀시트입니다. 휴대폰에 팝오버를 두지 않습니다. 내용은 고른 뒤 닫을 수 있도록 `close`를 받습니다. `AdaptivePopover`에 `isOpen`을 주면 바깥에서 열림을 제어하고 `onOpenChange`에서 변경을 받아 외부 상태에 반영합니다. 외부 제어 없이 최초에 열어 둘 때는 `defaultOpen`을 쓰며, `trigger`를 대신 클릭하는 우회는 쓰지 않습니다. 시트의 손잡이는 위 24px에 겹치므로 내용은 그 아래에서 시작하고 좌우 12px, 아래 20px을 씁니다. 이 여백은 한 부품(SheetBody)에 두어 시트마다 다시 쓰지 않습니다. 내용이 짧으면 시트가 화면 대부분을 차지하지 않게 하고(hug), 검색·긴 목록은 키보드를 고려해 높게(tall) 엽니다.

주소가 없는 시트는 브라우저의 닫기 요청(CloseWatcher와 같은 장치)으로 안드로이드 뒤로가기와 Esc에 닫힙니다. 네이티브 `<dialog>`를 `showModal()`로 여는 시트(Astryx BottomSheet의 기본, 배경 막 있음)는 지원 브라우저에서 이 요청을 `cancel`로 이미 받으므로 따로 등록하지 않습니다. 겹쳐 등록하면 한 번에 두 번 닫힙니다. 직접 만든 시트나 배경 막 없는 시트만 CloseWatcher를 등록합니다. 외부 제어 API가 시트 열림을 주소 쿼리에 저장하라는 규칙은 아니며, 열림 상태를 쿼리에 두지 않습니다. 짧은 조작마다 방문 기록이 쌓이고 새로고침하면 시트가 다시 열리기 때문입니다. 닫기 요청을 지원하지 않는 브라우저(iOS 사파리 등)에서는 뒤로가기가 이전 페이지로 갈 수 있으므로, 시트마다 보이는 닫기 버튼을 두고 잃으면 아까운 입력은 시트에 담지 않습니다. 입력이 길면 주소가 있는 화면으로 엽니다. 시트는 쌓지 않습니다.

## 선택지 목록

작은 고정 선택지는 그대로 나열하고, 8개를 넘으면 위에 검색 칸을 두어 초점을 줍니다. 검색 전에는 처음 8개와 이미 고른 항목, 검색하면 최대 50개, 나머지는 개수로 알립니다. 전부 렌더링하지 않습니다. 이 수치는 서버 한도와 별개이며 프로젝트가 조절합니다. 하나 고르기는 고른 뒤 닫고 끝에 체크, 여럿 고르기는 열린 채 앞에 상자를 둡니다. 휴대폰 행은 44px입니다.

## 속성 알약

작성·상세의 속성(종류·분류·날짜·담당·첨부)은 24px(휴대폰 32px) 알약입니다. 비었으면 속성의 아이콘과 이름을 보이고 정하면 값을 보입니다. 필수 속성은 빈 값에 `*`와 접근 가능한 이름 "(필수)"로 표시되며(`isRequired`), `isInvalid`에는 제출 검사 결과를 전달해 오류를 표시합니다. `DatePill`은 Astryx `Calendar`로 날짜를 고르고 `isRequired`와 `isInvalid`를 지원하며, `dateStyle`은 기본 `relative`이고 날짜 자체가 중요한 일정·신청·예약에서는 월·일·요일을 표시하는 `absolute`를 씁니다. 시작일과 종료일을 함께 받는 기간에서는 한쪽이 비어 있을 때 고른 날짜로 다른 쪽도 같이 채워 하루 기간부터 시작합니다. 긴 값은 최대 폭에서 말줄임하고 전체 값을 title로 남깁니다. 넓은 상세의 오른쪽 열에서는 같은 요소가 테두리 없는 행으로 바뀝니다. 읽기 전용이면 값만 보입니다.

## 활동·댓글 피드

상세 화면 아래의 이력과 의견은 `ActivityFeed`로 함께 둡니다. 생성·수정 같은 상태 이력은 세로 선 위의 조용한 한 줄 이벤트로 보이고, 댓글은 카드로 구분합니다. 키트 견본에서는 사람 아바타로 `PersonAvatar`(18가지 SVG 얼굴)를 쓰며, 제품은 자체 아바타를 쓸 수 있습니다. 댓글 카드 안에는 한 단계 답글과 답글 열기·입력 칸을 두며, 본인이 쓴 댓글·답글은 카드 메뉴에서 고치거나 확인 창을 거쳐 지울 수 있습니다. 본문 구절 인용(`Quote`)과 하단 `ChatComposer` 입력을 지원합니다.

## 행 순서 바꾸기

결재선이나 목록에서 행의 순서를 바꿀 때는 `useRowReorder`의 드래그 손잡이(`grip`)를 씁니다. 행마다 위·아래 이동 버튼을 따로 두지 않습니다. 손잡이를 포인터로 끌어 옮기거나 손잡이에 초점을 두고 `Alt` + 위·아래 방향키로 한 칸씩 옮기며, 드래그 중 `Esc`를 누르면 원래 순서로 되돌립니다. 옮긴 결과는 라이브 영역으로 알립니다.

## 파일 올리기 칸

고르기와 끌어 놓기를 함께 받습니다. 파일을 끌어올 때만 반응하고, 형식·크기·빈 파일·한 개 제한에 걸린 파일 이름을 칸 아래에 알립니다. 칸은 파일을 넘길 뿐 올리지 않습니다. 올리는 중 표시·실패·제출 막기는 제품의 첨부 계약과 함께 정합니다.

## 본문 칸

제목·본문 양식의 본문은 프로젝트가 채택한 리치에디터를 테두리와 서식 도구 막대 없이 종이처럼 둡니다. 서식은 에디터의 단축키·입력 규칙·선택 도구로 합니다. 본문 글자는 화면 글자(13px)보다 한 단계 큰 본문(15px, `--text-large-size`)이고 제목은 `--text-heading-2-size`입니다. 쓰는 칸과 그 글을 읽는 상세 본문은 같은 크기로 둡니다. 키트의 Tiptap 예시는 자리를 보이기 위한 것이며 특정 에디터를 기본 의존성으로 복사하지 않습니다.

구현이 없는 조합을 메뉴에 빈 항목으로 만들지 않습니다. 제품 고유 조합(아이콘 표시 고르기, 전역 검색 팔레트, 프로필 패널)은 프로젝트가 소유합니다.
