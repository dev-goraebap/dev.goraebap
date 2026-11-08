---
title: "구현 메모: Astryx"
description: "규칙을 Astryx와 TanStack으로 구현하는 방법"
sidebar:
  order: 13
---

[앱 셸 개요](/app-shell/overview/)부터 정리한 화면 설계 규칙을 현재 기술 스택(Astryx 디자인 시스템, React, TanStack Router·Query)으로 구현할 때 어떤 부품과 훅을 쓰는지 대응합니다. 앞선 문서들은 특정 UI 라이브러리에 묶이지 않도록 셸, 머리 줄, 도구 자리, 본문 열 같은 역할로 규칙을 정의했습니다. Astryx와 TanStack에 맞춘 구현 방법은 이 페이지에만 모아 두며, 기술 스택을 바꾸면 앞선 규칙은 그대로 두고 이 페이지만 다시 씁니다.

공통 UI 구현은 공개 저장소([dev-goraebap/dev.goraebap](https://github.com/dev-goraebap/dev.goraebap))의 `site/src/shared/ui` 키트에 있습니다. 각 규칙의 성격 표시(`[관례]`, `[고래밥]`, `[선호]`, [읽는 법](/#규칙의-세-가지-표시) 참고)를 함께 적어, 바꿀 수 없는 동작 계약과 취향에 따른 모양 선택을 코드 수준에서도 구분합니다.

## 역할과 구현 대응

| 화면 역할과 규칙 | 성격 | 키트·스택 구현 | 구현 위치와 판단 기준 |
| --- | --- | --- | --- |
| 사이드바와 본문 두 영역으로 나누고 본문만 스크롤하는 [셸과 사이드바](/app-shell/shell-and-sidebar/) | `[관례]` `[고래밥]` | Astryx `AppShell` + `SideNav`(`resizable`) | `layouts`의 앱 셸. 페이지마다 셸을 새로 만들지 않고 유지합니다. 메뉴 이름을 말줄임 없이 보이기 위해 기본 폭 340px(조절 범위 220~380px)을 씁니다 |
| 바탕 위에 떠 있는 둥근 페이지 카드(Inset)와 선으로만 나눈 면(Split) | `[선호]` | Inset은 `Card variant="page"`, Split은 `AppShell variant="section"` | [선호하는 화면](/app-shell/preferred-screens/)의 기준에 따라 두 배치 중 하나를 고릅니다 |
| [머리 줄·배너·툴바·적용 줄·FAB](/app-shell/header-and-toolbar/) | `[관례]` `[고래밥]` `[선호]` | `Page` | `site/src/shared/ui/layouts/page/Page.tsx`. 데스크톱 52px·휴대폰 최소 60px 머리 줄, 상태·오류 배너 자리, 44px(휴대폰 최소 60px) 툴바, 필터 적용 칩 줄, 미리보기 자리(`aside`), 휴대폰의 떠 있는 만들기 버튼(FAB, 56px)을 한 틀에서 관리합니다 |
| 데스크톱 팝오버를 휴대폰에서 바텀시트로 여는 [그 자리에서 고르기](/app-shell/choosing-presentation/) | `[관례]` | `AdaptivePopover` (Astryx `Popover` + `BottomSheet`), `SheetBody` | `composites/popup`. 분기점을 기준으로 두 부품을 전환합니다. 시트 손잡이(위 24px)를 피하는 내부 여백(좌우 12px, 아래 20px)은 `SheetBody` 한 곳에 둡니다 |
| [적응형](/app-shell/adaptive/) 단일 분기점 판정 | `[관례]` `[고래밥]` | `useIsPhone` (`(width < 64rem)`) | `foundations`의 분기점 훅. 1024px(`64rem`) 미만을 휴대폰으로 판정하며 사이드바↔하단 탭, 팝오버↔시트, 대화상자↔페이지, 표↔행 목록 전환에 모두 같은 훅을 씁니다 |
| 목록 위 대화상자와 실제 페이지 주소를 잇는 [라우트 마스킹](/app-shell/route-masking/) | `[고래밥]` | TanStack Router `navigate` `mask` + `unmaskOnReload`, `useOpenPanel` / `useRoutedPanel` | `patterns/routing/routed-panel.ts`. 데스크톱 목록에서 열면 `?panel=대상`을 더하고 주소창에는 대상 주소를 보입니다. 새로고침이나 직접 진입 시에는 페이지로 엽니다 |
| 대화상자에서 크게 보기로 전환할 때의 초안 유지 | `[고래밥]` | `DraftProvider` | `patterns`의 작성 양식과 초안 저장소. 대화상자·페이지 전환이나 분기점 변경에서도 입력한 제목·본문·속성·첨부가 남도록 라우터 위에 감쌉니다 |
| 목록 옆에서 항목을 훑는 [미리보기 패널](/app-shell/peek/) | `[고래밥]` | `usePeek` (`?peek=`), `PeekPanel` | `patterns/routing/peek.ts`와 `layouts/peek/PeekPanel.tsx`(`Page`의 `aside` 자리, 본문 폭의 45%). 처음 열 때는 방문 기록을 쌓고(`push`), 다른 행으로 옮길 때는 기록을 바꾸며(`replace`), 닫을 때는 `history.back`을 씁니다. 휴대폰에서는 대상 페이지로 바꿔 갑니다(`replace`) |
| 검색어·필터·표시를 URL에 남기는 [목록 조건 주소](/app-shell/filters-and-display/) | `[고래밥]` | `useAddressFilters`, `useAddressWords`(300ms), `useAddressDisplay` | `patterns/list/list-address.ts`. 검색어 입력 중에는 방문 기록을 쌓지 않고(`replace`) 300ms 간격으로 주소만 갱신합니다 |
| 필수 값이 비어도 제출 버튼을 막지 않는 작성 양식([상태와 피드백](/app-shell/states-and-feedback/)) | `[관례]` | `ComposeForm`, `ComposeSurface`, `ComposeSubmit`, `FormDialog`, `focusFirstInvalid` | `patterns/compose`. `ComposeSubmit`에 `isDisabled`를 두지 않고 `FormDialog`에 `isSubmitDisabled`를 두지 않습니다. 빠진 값은 `titleError`·`pillsError`와 알약의 `isInvalid`(`aria-invalid`)로 알리고 `patterns/compose/validation.ts`의 `focusFirstInvalid`로 첫 빠진 항목에 초점을 옮깁니다 |
| 먹색 강조와 4단계 면, 휴대폰 크기 조정([시각 위계](/common/visual-hierarchy/)) | `[선호]` `[관례]` | Stone 확장 테마(`theme.ts`), `responsive.css` | `foundations`. Astryx 테마 규칙이 `@media`를 받지 않으므로 휴대폰 크기와 여백 조정은 `responsive.css` 한 파일에 모읍니다 |
| 의미 이름으로 부르고 선·채움으로 상태를 나타내는 [아이콘](/common/icons/) | `[선호]` | `solarIcon(name, isChosen)` | `site/scripts/generate-icons.mjs`로 Solar 아이콘을 의미 이름으로 생성합니다. 기본은 선, 선택·현재 위치는 채운 아이콘(`isChosen`)을 씁니다 |

## 주요 상호작용의 구현 세부

### 미리보기 패널과 목록 행 동작

[미리보기 패널](/app-shell/peek/)은 목록을 유지한 채 항목을 차례로 훑는 비모달 패널입니다(`layouts/peek/PeekPanel.tsx`). `Page` 컴포넌트의 `aside` 자리에 들어가며 본문 폭의 45%를 차지합니다. 패널 안에는 닫기 버튼과 대상의 자기 주소로 이동하는 "페이지로 열기"를 두고, Esc나 닫기 버튼으로 닫으면 초점을 원래 행으로 돌려보냅니다.

주소와 방문 기록은 `patterns/routing/peek.ts`의 `usePeek`이 맡습니다.
1. 목록에서 미리보기를 처음 열 때는 목록 주소에 `?peek=대상ID`를 더하며 방문 기록을 하나 쌓습니다(`push`).
2. 패널이 열린 상태에서 다른 행을 고르거나 위·아래 키로 항목을 옮기면 기록을 쌓지 않고 바꿉니다(`replace`). 여러 항목을 확인한 뒤에도 뒤로가기 한 번(`history.back`)이면 패널이 닫히고 목록으로 돌아옵니다.
3. 휴대폰 폭에서 `?peek=` 주소로 진입하면 패널을 그리지 않고 대상 페이지 주소로 바꿔 갑니다(`replace`).

행을 눌렀을 때 무엇을 열지는 목록의 성격에 따라 나눕니다. 키트의 서가 예제는 하나를 골라 들어가 일하는 작업 목록이므로 행 클릭은 대상 페이지로 이동하고, 미리보기는 행 끝의 미리보기 버튼이나 Space 키, 위·아래 키로 엽니다.

### 제출 버튼 비활성화 제거와 오류 초점

[상태와 피드백](/app-shell/states-and-feedback/) 규칙에 따라 필수 값이 비어 있어도 제출 버튼을 비활성화하지 않습니다. 비활성 버튼은 키보드 초점이 닿지 않고 왜 제출할 수 없는지 알려 주지 않기 때문입니다. 저장 중일 때만 버튼을 처리 중 상태로 막습니다.

키트의 작성 양식(`patterns/compose`)과 짧은 양식 대화상자에서는 이를 다음과 같이 구현합니다.
- `ComposeSubmit`에는 `isDisabled` 속성을 두지 않고, `FormDialog`에도 `isSubmitDisabled` 속성을 두지 않습니다.
- 필수 속성은 고르기 전에 `*`와 접근 가능한 이름 "(필수)"로 표시합니다.
- 값을 비운 채 제출하면 `ComposeForm`의 `titleError`·`pillsError`와 속성 알약의 `isInvalid`(`aria-invalid`)로 빠진 항목 곁에 오류를 표시하고, `patterns/compose/validation.ts`의 `focusFirstInvalid`를 호출해 첫 번째 빠진 항목으로 초점을 옮깁니다. 오류 표시는 처음 제출을 누른 뒤부터 보이며 값을 채우면 그 자리에서 사라집니다.

### 주소 없는 바텀시트와 닫기 요청(`CloseWatcher`)

[적응형](/app-shell/adaptive/) 규칙에서 값 고르기·필터·표시·행 메뉴·더보기처럼 주소가 없는 바텀시트는 안드로이드 뒤로가기와 Esc를 눌렀을 때 방문 기록을 건드리지 않고 시트만 닫혀야 합니다. 열림 상태를 URL 쿼리에 두면 짧은 조작마다 방문 기록이 쌓이고 새로고침할 때 시트가 다시 열리므로 쿼리 방식은 쓰지 않습니다.

Astryx `BottomSheet`는 배경 막이 있을 때 브라우저의 네이티브 `<dialog>`를 `showModal()`로 열고 `cancel` 이벤트를 처리합니다. 닫기 요청을 지원하는 브라우저(Chrome 120+ 등)에서는 안드로이드 뒤로가기와 Esc가 이미 `<dialog>`의 `cancel`로 전달되어 시트를 닫으므로, `CloseWatcher`를 따로 등록하지 않습니다. 두 장치를 겹쳐 등록하면 뒤로가기 한 번에 두 번 닫힙니다. 네이티브 `<dialog>`의 모달 방식을 쓰지 않고 직접 만든 시트나 배경 막이 없는 시트에만 `CloseWatcher`를 등록합니다.

닫기 요청을 지원하지 않는 브라우저(iOS 사파리 등)에서는 뒤로가기가 이전 페이지로 이동할 수 있습니다. 따라서 시트마다 눈에 보이는 닫기 버튼을 함께 두고, 잃으면 안 되는 긴 입력은 시트가 아니라 주소가 있는 화면으로 엽니다.

## 키트 폴더 구조와 채택 순서

`site/src/shared/ui`는 Astryx 기본 부품을 다시 구현하지 않고, 업무 앱에서 반복해 쓰는 조합과 라우팅 패턴만 모아 둡니다. 폴더끼리는 상대 경로로 이어져 있으므로 프로젝트에 채택할 때는 필요한 파일과 그 의존 파일만 프로젝트의 공통 UI 위치로 옮기고 경로를 맞춥니다.

| 폴더 | 담는 구현 |
| --- | --- |
| `foundations` | Stone 확장 테마(`theme.ts`), 버튼·카드 변형 타입, 휴대폰 크기(`responsive.css`), 앱 진입 CSS(`base.css`), 분기점 훅(`useIsPhone`), Solar 아이콘 |
| `composites` | 공통 다이얼로그·확인 창·짧은 양식(`FormDialog`), 팝오버↔바텀시트(`composites/popup`), 동작·행 메뉴, 검색, 필터·표시, 속성 알약, 파일 올리기, 상태 화면, 본문 칸, 그룹 머리 |
| `layouts` | 앱 셸(사이드바·하단 탭·더보기), 페이지(`Page.tsx`: 머리·배너·툴바·적용 줄·목록·표·읽은 수·`aside`), 상세, 설정, 미리보기 패널(`layouts/peek/PeekPanel.tsx`), 옆 패널 |
| `patterns` | 작성 양식(`ComposeForm`·`ComposeSurface`·`ComposeSubmit`)과 초안 저장소(`DraftProvider`)·필수 값 초점 이동(`patterns/compose/validation.ts`), 라우트 마스킹·라우터 링크(`patterns/routing/routed-panel.ts`), 미리보기 주소(`patterns/routing/peek.ts`), 목록 조건의 주소(`patterns/list/list-address.ts`) |

새 프로젝트에 키트를 적용할 때는 아래 순서를 따릅니다.

1. 앱 진입점에서 UI 모듈보다 먼저 `foundations/base.css`를 읽습니다. CSS 레이어 순서(`reset` → `astryx-base` → `astryx-theme`)와 `responsive.css`의 휴대폰 크기, 스크롤바, 큰 화면 배율이 함께 적용됩니다.
2. 앱 루트를 `ReferenceTheme`(라이트·다크 모드는 앱 설정 한 곳에서 제어)으로 감싸고, 라우터 루트에 `LinkProvider component={RouterLink}`를 둡니다.
3. 작성 양식을 쓰면 라우터보다 위에 `DraftProvider`를 둡니다.
4. 아이콘 이름을 더할 때는 `site/scripts/generate-icons.mjs`의 매핑을 고치고 `npm run site:icons`를 실행합니다.

## 검증 범위와 미확인 사항

키트의 자동 검사(타입 검사, 견본 그리기, 조작 검증)와 브라우저 확인 범위는 키트 안의 `manifest.json`에 기록합니다. 실제 모바일 기기의 가상 키보드 동작, 화면 낭독기(스크린 리더), 실제 서버와의 데이터 연동은 키트에서 확인하지 않았으므로 키트를 채택한 프로젝트에서 직접 검증합니다.
