# Composites (조합 부품)

여러 기본 부품을 묶어 반복해 쓰는 단위다. 조합은 값과 동작을 props로 받고 제품의 API·라우트·업무 정책을 직접 소유하지 않는다. Playground 템플릿과 견본은 같은 조합을 import하며 그 안에 같은 UI를 다시 만들지 않는다. FSD의 widgets와 같은 분류가 아니다.

| 조합 | 소유하는 책임 | 코드 |
| --- | --- | --- |
| 공통 다이얼로그·확인 창·짧은 양식 | 위치·여백·스크롤·닫기·초점 | [dialog](https://github.com/dev-goraebap/goraebap-workflow/tree/main/frontend/reference/composites/dialog), [기준](dialog.md) |
| 곁에 여는 내용 | 데스크톱 팝오버 ↔ 휴대폰 바텀시트, 시트 손잡이 여백 | [popup](https://github.com/dev-goraebap/goraebap-workflow/tree/main/frontend/reference/composites/popup) |
| 동작 메뉴·행 메뉴 | 아이콘·이름·고른 표시, 고른 뒤 닫기 | 같은 폴더 |
| 검색·필터·표시 도구 | 열기·닫기·지우기, 적용 줄, 기본과 다른 표시 | [search](https://github.com/dev-goraebap/goraebap-workflow/tree/main/frontend/reference/composites/search), [filter](https://github.com/dev-goraebap/goraebap-workflow/tree/main/frontend/reference/composites/filter), [기준](search-filter.md) |
| 속성 알약 | 빈 값·필수·값 고르기, 상세 열에서 행 모양 | [property](https://github.com/dev-goraebap/goraebap-workflow/tree/main/frontend/reference/composites/property) |
| 파일 올리기 칸 | 고르기·끌어 놓기·형식과 크기 확인 | [upload](https://github.com/dev-goraebap/goraebap-workflow/tree/main/frontend/reference/composites/upload) |
| 상태 화면 | 빈 목록·결과 없음·없는 대상·실패의 그림과 문구 | [state](https://github.com/dev-goraebap/goraebap-workflow/tree/main/frontend/reference/composites/state), [기준](data-states.md) |
| 본문 칸 | 종이 위의 리치 본문 | [editor](https://github.com/dev-goraebap/goraebap-workflow/tree/main/frontend/reference/composites/editor) |
| 그룹 머리 | 그룹 이름·개수·접기, 스크롤에 붙는 띠 | [list-group](https://github.com/dev-goraebap/goraebap-workflow/tree/main/frontend/reference/composites/list-group) |

## 곁에 여는 내용

버튼 곁에 여는 것은 데스크톱에서 팝오버, 휴대폰에서 언제나 바텀시트다. 휴대폰에 팝오버를 두지 않는다. 내용은 고른 뒤 닫을 수 있도록 `close`를 받는다. 시트의 손잡이는 위 24px에 겹치므로 내용은 그 아래에서 시작하고 좌우 12px, 아래 20px을 쓴다. 이 여백은 한 부품(SheetBody)에 두어 시트마다 다시 쓰지 않는다. 내용이 짧으면 시트가 화면 대부분을 차지하지 않게 하고(hug), 검색·긴 목록은 키보드를 고려해 높게(tall) 연다.

주소가 없는 시트는 브라우저의 닫기 요청(CloseWatcher와 같은 장치)으로 안드로이드 뒤로가기와 Esc에 닫힌다. 네이티브 `<dialog>`를 `showModal()`로 여는 시트(Astryx BottomSheet의 기본, 배경 막 있음)는 지원 브라우저에서 이 요청을 `cancel`로 이미 받으므로 따로 등록하지 않는다. 겹쳐 등록하면 한 번에 두 번 닫힌다. 직접 만든 시트나 배경 막 없는 시트만 CloseWatcher를 등록한다. 열림 상태를 쿼리에 두지 않는다. 짧은 조작마다 방문 기록이 쌓이고 새로고침하면 시트가 다시 열리기 때문이다. 닫기 요청을 지원하지 않는 브라우저(iOS 사파리 등)에서는 뒤로가기가 이전 페이지로 갈 수 있으므로, 시트마다 보이는 닫기 버튼을 두고 잃으면 아까운 입력은 시트에 담지 않는다. 입력이 길면 주소가 있는 화면으로 연다. 시트는 쌓지 않는다.

## 선택지 목록

작은 고정 선택지는 그대로 나열하고, 8개를 넘으면 위에 검색 칸을 두어 초점을 준다. 검색 전에는 처음 8개와 이미 고른 항목, 검색하면 최대 50개, 나머지는 개수로 알린다. 전부 렌더링하지 않는다. 이 수치는 서버 한도와 별개이며 프로젝트가 조절한다. 하나 고르기는 고른 뒤 닫고 끝에 체크, 여럿 고르기는 열린 채 앞에 상자를 둔다. 휴대폰 행은 44px이다.

## 속성 알약

작성·상세의 속성(종류·분류·날짜·담당·첨부)은 24px(휴대폰 32px) 알약이다. 비었으면 속성의 아이콘과 이름을 보이고 정하면 값을 보인다. 필수 속성은 고르기 전에 `*`와 접근 가능한 이름 "(필수)"로 알린다. 긴 값은 최대 폭에서 말줄임하고 전체 값을 title로 남긴다. 넓은 상세의 오른쪽 열에서는 같은 요소가 테두리 없는 행으로 바뀐다. 읽기 전용이면 값만 보인다.

## 파일 올리기 칸

고르기와 끌어 놓기를 함께 받는다. 파일을 끌어올 때만 반응하고, 형식·크기·빈 파일·한 개 제한에 걸린 파일 이름을 칸 아래에 알린다. 칸은 파일을 넘길 뿐 올리지 않는다. 올리는 중 표시·실패·제출 막기는 제품의 첨부 계약과 함께 정한다.

## 본문 칸

제목·본문 양식의 본문은 프로젝트가 채택한 리치에디터를 테두리와 서식 도구 막대 없이 종이처럼 둔다. 서식은 에디터의 단축키·입력 규칙·선택 도구로 한다. 본문 글자는 화면 글자(13px)보다 한 단계 큰 본문(15px, `--text-large-size`)이고 제목은 `--text-heading-2-size`다. 쓰는 칸과 그 글을 읽는 상세 본문은 같은 크기로 둔다. 키트의 Tiptap 예시는 자리를 보이기 위한 것이며 특정 에디터를 기본 의존성으로 복사하지 않는다.

구현이 없는 조합을 메뉴에 빈 항목으로 만들지 않는다. 제품 고유 조합(아이콘 표시 고르기, 전역 검색 팔레트, 프로필 패널)은 프로젝트가 소유한다.
