---
title: "구현 메모: shadcn"
description: "규칙을 shadcn/ui와 TanStack으로 구현하는 방법"
sidebar:
  order: 13
arc42: "8.8"
---

[앱 셸 개요](/app-shell/overview/)부터 정리한 화면 설계 규칙을 현재 기술 스택(shadcn/ui, Tailwind CSS v4, React, TanStack Router·Query)으로 구현할 때 어떤 부품과 훅을 쓰는지 대응합니다. 앞선 문서들은 특정 UI 라이브러리에 묶이지 않도록 셸, 머리 줄, 도구 자리, 본문 열 같은 역할로 규칙을 정의했습니다. shadcn과 TanStack에 맞춘 구현 방법은 이 페이지에만 모아 두며, 기술 스택을 바꾸면 앞선 규칙은 그대로 두고 이 페이지만 다시 씁니다.

공통 UI 구현은 공개 저장소([dev-goraebap/dev.goraebap](https://github.com/dev-goraebap/dev.goraebap))의 `apps/site/src/shared/ui`와 `apps/site/src/shared/lib`에 있습니다. 각 규칙의 성격 표시(`[관례]`, `[고래밥]`, `[선호]`, [읽는 법](/#규칙의-세-가지-표시) 참고)를 함께 적어, 바꿀 수 없는 동작 계약과 취향에 따른 모양 선택을 코드 수준에서도 구분합니다.

## 기반: shadcn/ui와 Tailwind CSS v4

부품은 shadcn/ui의 Base UI 기반 `base-nova` 스타일입니다. 요소를 바꿀 때는 `asChild`가 아니라 `render` prop을 씁니다(`<Button render={<Link to="..." />} nativeButton={false}>`).

스타일은 Tailwind CSS v4 유틸리티와 의미 토큰으로만 씁니다. 별도 CSS 파일·CSS 모듈·StyleX를 쓰지 않습니다. 토큰은 한 CSS 파일(`src/app/styles/tailwind.css`)의 `:root`와 `[data-theme=dark]`에 정의하고 `@theme inline`으로 Tailwind에 노출합니다. 라이트·다크는 `html[data-theme=dark|light]` 하나가 정하며 Tailwind `dark:` 변형도 이것을 봅니다. 색은 토큰에서만 바꾸고 `dark:`로 덮어쓰지 않습니다. 휴대폰 글자 크기 조정은 같은 파일의 `@media (width < 64rem)`에 둡니다.

부품 사용법(조합, 폼 `Field`, `render`, 아이콘의 `data-icon`, `gap-*` 간격, `size-*` 등)은 shadcn 공식 스킬과 shadcn MCP가 맡습니다. Webcraft 지침은 면 단계·휴대폰 규칙·로딩 방식·대화상자 ↔ 페이지·문구 같은 우리 규칙을 맡습니다. 둘이 다르면 Webcraft 규칙이 우선이고, 부품 API는 shadcn 문서를 따릅니다.

`apps/site` 폴더의 `npm run check:ui`(`scripts/check-ui.mjs`)가 FSD, 의미 토큰만 쓰는지, 팔레트 색·`dark:` 색·`space-*` 금지, `style={{}}`는 `// check-ui: allow-style <이유>`가 있을 때만, lucide import 금지를 검사합니다.

## 역할과 구현 대응

| 화면 역할과 규칙 | 성격 | 키트·스택 구현 | 구현 위치와 판단 기준 |
| --- | --- | --- | --- |
| 사이드바와 본문 두 영역으로 나누고 본문만 스크롤하는 [셸과 사이드바](/app-shell/shell-and-sidebar/) | `[관례]` `[고래밥]` | `AppShell`(shadcn `Sidebar` 위, 메뉴는 `NavSpace` 데이터) | `src/shared/ui/app-shell/AppShell.tsx`. 페이지마다 셸을 새로 만들지 않고 유지합니다. 메뉴 이름을 말줄임 없이 보이기 위해 기본 폭 340px(조절 범위 220~380px)을 씁니다 |
| 바탕 위에 떠 있는 둥근 페이지 카드(Inset)와 선으로만 나눈 면(Split) | `[선호]` | `AppShell`의 배치 설정 | [선호하는 화면](/app-shell/preferred-screens/)의 기준에 따라 두 배치 중 하나를 고릅니다 |
| [머리 줄·배너·툴바·적용 줄·FAB](/app-shell/header-and-toolbar/) | `[관례]` `[고래밥]` `[선호]` | `Page`, `PageViews` | `src/shared/ui/page/Page.tsx`. 데스크톱 52px·휴대폰 최소 60px 머리 줄(휴대폰은 앱 바), 44px(휴대폰 최소 60px) 툴바, 적용 줄, 휴대폰의 만들기 FAB(56px), 바닥 실행 줄(`footer`)을 한 틀에서 관리합니다. 페이지의 `h1`은 하나이며 `Page`가 기본으로 냅니다. 본문이 자기 제목을 그리면 `useOwnPageTitle()`로 넘깁니다 |
| 데스크톱 팝오버를 휴대폰에서 바텀시트로 여는 [그 자리에서 고르기](/app-shell/choosing-presentation/) | `[관례]` | `AdaptivePopover`, `ActionMenu`(행 메뉴는 `size="row"`), `OptionList` | `src/shared/ui/adaptive-popover.tsx`. 분기점을 기준으로 팝오버와 바텀시트를 바꿉니다 |
| [적응형](/app-shell/adaptive/) 단일 분기점 판정 | `[관례]` `[고래밥]` | `useIsMobile` (`(width < 64rem)`), CSS의 `max-md:` | `src/shared/lib/use-mobile.ts`. 1024px(`64rem`) 미만을 휴대폰으로 판정하며 사이드바↔하단 탭, 팝오버↔시트, 대화상자↔페이지, 표↔행 목록 전환에 모두 같은 분기점을 씁니다 |
| 목록 위 대화상자와 실제 페이지 주소를 잇는 [라우트 마스킹](/app-shell/route-masking/) | `[고래밥]` | TanStack Router `navigate` `mask` + `unmaskOnReload`, `useOpenPanel` / `usePanel` | `src/shared/lib/panel.ts`. 데스크톱 목록에서 열면 `?panel=대상`을 더하고 주소창에는 대상 주소를 보입니다. 새로고침이나 직접 진입 시에는 페이지로 엽니다. 상세는 `DetailSurface`가 페이지와 60rem 대화상자를 오갑니다 |
| 대화상자에서 크게 보기로 전환할 때의 초안 유지 | `[고래밥]` | `DraftProvider`·`useDraft`, `carryDraft` | `src/shared/lib/draft.tsx`와 `src/shared/lib/panel.ts`. 대화상자·페이지 전환이나 분기점 변경에서도 입력한 제목·본문·속성·첨부가 남도록 라우터 위에 감쌉니다 |
| 목록 옆에서 항목을 훑는 [미리보기 패널](/app-shell/peek/) | `[고래밥]` | `usePeek` (`?peek=`), `PeekLayout`·`PeekPanel`, `InboxLayout`·`InboxPane`, `usePeekRows` | `src/shared/lib/use-peek.ts`와 `src/shared/ui/peek/`(본문 폭의 45%). 처음 열 때는 방문 기록을 쌓고(`push`), 다른 행으로 옮길 때는 기록을 바꾸며(`replace`), 이 기록에서 열었으면 닫을 때 한 걸음 뒤로 갑니다. 휴대폰에서는 대상 페이지로 바꿔 갑니다(`replace`) |
| 검색어·필터·표시를 URL에 남기는 [목록 조건 주소](/app-shell/filters-and-display/) | `[고래밥]` | `useAddressFilters`, `useAddressWords`(300ms), `useAddressChoices` | `src/shared/lib/list-address.ts`. 검색어 입력 중에는 방문 기록을 쌓지 않고(`replace`) 300ms 뒤 주소만 갱신합니다 |
| 필수 값이 비어도 제출 버튼을 막지 않는 작성 양식([상태와 피드백](/app-shell/states-and-feedback/)) | `[관례]` | `ComposeSurface`, `ComposeFields`, `FormDialog`, `focusFirstInvalid` | `src/shared/ui/compose/`와 `src/shared/lib/focus-invalid.ts`. 빠진 값은 알약의 `isInvalid`(`aria-invalid`)로 알리고 `focusFirstInvalid`로 첫 빠진 항목에 초점을 옮깁니다. 쓴 내용이 있으면(`isDirty`) 닫기·취소에서 버릴지 묻습니다 |
| 먹색 강조와 4단계 면, 휴대폰 크기 조정([시각 위계](/common/visual-hierarchy/)) | `[선호]` `[관례]` | 토큰 CSS, `max-md:` 유틸리티 | `src/app/styles/tailwind.css`. 면 4단계는 `--sidebar`(바닥)·`--background`(페이지)·`--card`(올린 면)·`--popover`(뜬 면)이고, 휴대폰 크기 조정은 같은 파일의 `@media (width < 64rem)`와 부품의 `max-md:`에 둡니다 |
| 이름으로 부르고 선·채움으로 상태를 나타내는 [아이콘](/common/icons/) | `[선호]` | `@/shared/ui/icon`(lucide 식 이름 `CalendarIcon`), `chosen` prop | `scripts/generate-ui-icons.mjs`의 매핑으로 Solar 아이콘을 생성합니다. 기본은 Linear, 고름·열림·지금 자리는 같은 아이콘의 Bold Duotone(`chosen`)을 씁니다 |

## 주요 상호작용의 구현 세부

### 미리보기 패널과 목록 행 동작

[미리보기 패널](/app-shell/peek/)은 목록을 유지한 채 항목을 차례로 훑는 비모달 패널입니다(`src/shared/ui/peek/PeekPanel.tsx`). `PeekLayout`의 옆 칸 자리에 들어가며 본문 폭의 45%를 차지합니다. 패널 머리에는 대상 이름, 대상의 자기 주소로 이동하는 "페이지로 열기", 닫기를 둡니다. Esc나 닫기 버튼으로 닫으면 초점을 원래 행으로 돌려보냅니다.

주소와 방문 기록은 `src/shared/lib/use-peek.ts`의 `usePeek`이 맡습니다.
1. 목록에서 미리보기를 처음 열 때는 목록 주소에 `?peek=대상ID`를 더하며 방문 기록을 하나 쌓습니다(`push`).
2. 패널이 열린 상태에서 다른 행을 고르면 기록을 쌓지 않고 바꿉니다(`replace`). 여러 항목을 확인한 뒤에도 닫기 한 번이면 패널이 닫히고 목록으로 돌아옵니다.
3. 휴대폰 폭에서 `?peek=` 주소로 진입하면 패널을 그리지 않고 대상 페이지 주소로 바꿔 갑니다(`replace`).

행을 눌렀을 때 무엇을 열지는 목록의 성격에 따라 나눕니다. 하나를 골라 들어가 일하는 작업 목록은 행 클릭이 대상 페이지로 이동하고, 미리보기는 행의 단추나 Space 키로 엽니다(`usePeekRows`).

### 제출 버튼 비활성화 제거와 오류 초점

[상태와 피드백](/app-shell/states-and-feedback/) 규칙에 따라 필수 값이 비어 있어도 제출 버튼을 비활성화하지 않습니다. 비활성 버튼은 키보드 초점이 닿지 않고 왜 제출할 수 없는지 알려 주지 않기 때문입니다. 저장 중일 때만 버튼을 처리 중 상태로 막습니다.

키트의 작성 양식(`ComposeSurface`)과 짧은 양식 대화상자(`FormDialog`)에서는 이를 다음과 같이 구현합니다.
- `ComposeSubmit`의 `isDisabled`와 `FormDialog`의 `isSubmitDisabled`로 필수 값이 빈 상태를 막지 않습니다. 저장 중에는 `isPending`을 씁니다.
- 필수 속성 알약은 빈 값에 `*`를 보이고 접근 가능한 이름에 "(필수)"를 붙입니다(`isRequired`).
- 값을 비운 채 제출하면 속성 알약의 `isInvalid`(`aria-invalid`와 붉은 테두리)로 빠진 항목 곁에 오류를 표시하고, `focusFirstInvalid`를 호출해 첫 번째 빠진 항목으로 초점을 옮깁니다. 오류 표시는 처음 제출을 누른 뒤부터 보이며 값을 채우면 그 자리에서 사라집니다.
- 쓴 내용이 있으면(`isDirty`) 닫기·Esc·바깥 누르기·취소에서 "작성 중인 내용을 버릴까요?"로 묻고 "버리기"를 고르게 합니다.

### 주소 없는 바텀시트와 뒤로가기

[적응형](/app-shell/adaptive/) 규칙에서 값 고르기·필터·표시·행 메뉴·더보기처럼 주소가 없는 바텀시트는 방문 기록을 건드리지 않고 시트만 닫혀야 합니다. 열림 상태를 URL 쿼리에 두면 짧은 조작마다 방문 기록이 쌓이고 새로고침할 때 시트가 다시 열리므로 쿼리 방식은 쓰지 않습니다.

키트의 시트(Drawer, Base UI)는 Esc와 바깥 누름으로 닫힙니다. 안드로이드 뒤로가기는 주소가 있는 화면(페이지·mask 대화상자)이 맡습니다. 주소가 없는 시트가 안드로이드 하드웨어 뒤로가기로 닫히는지는 확인하지 못했습니다.

뒤로가기가 시트를 닫지 않고 이전 페이지로 이동할 수 있으므로, 시트마다 눈에 보이는 닫기 버튼을 함께 두고, 잃으면 안 되는 긴 입력은 시트가 아니라 주소가 있는 화면으로 엽니다.

## 키트 구조와 채택 순서

키트는 `src/shared/ui`(shadcn 기본 부품을 우리 변형으로 고친 것과 조합 부품)와 `src/shared/lib`(훅과 도우미)에 있습니다. 업무에 묶이지 않는 공통 부품만 두고, shadcn 레지스트리 `webcraft`로 배포합니다.

| 위치 | 담는 구현 |
| --- | --- |
| `src/shared/ui/*.tsx` | shadcn 부품(Button 변형 `view`·`view-active`·`tool`·`create`, Badge `label` 변형, Input·Textarea·Select와 Field·FieldGroup, Dialog·Drawer 등)과 조합 부품(`FormDialog`·`ConfirmDialog`·`DetailSurface`, `AdaptivePopover`·`ActionMenu`·`OptionList`, `PropertyPill`·`OptionPill`·`DatePill`·`InfoPill`, `SearchTool`, `DisplayMenu`, `DateCalendar`·`DatePicker`, `SegmentedControl`, `ListMore`, `RowLink`·`RouterAnchor`) |
| `src/shared/ui/<폴더>/` | 앱 셸(`app-shell`), 페이지(`page`), 상세·활동(`reading`: `DetailLayout`·`ActivityFeed`), 옆 패널(`side-panel`), 미리보기(`peek`), 상태 화면(`page-state`), 작성 양식(`compose`), 필터(`filter`), 본문 수정 화면(`body-edit`), 첫 방문 덮개(`boot-cover`), 순서 바꾸기(`reorder`), 본문 칸(`editor`), 문서 편집기(`document`), 아이콘(`icon`) |
| `src/shared/lib` | `useIsMobile`, 목록 위 대화상자(`panel`), 초안(`draft`), 목록 조건의 주소(`list-address`), 미리보기 주소(`use-peek`), 필수 값 초점 이동(`focus-invalid`) |
| `src/app/styles/tailwind.css` | 토큰(`:root`·`[data-theme=dark]`), `@theme inline`, 휴대폰 크기 조정 |

키트 부품은 `render={<Link … />}`나 `RowLink`(`createLink`)로 라우터에 이어지므로 루트에 링크 Provider를 두지 않습니다. 본문(Markdown·MDX)의 앱 링크만 `RouterAnchor`를 씁니다.

새 프로젝트에 키트를 적용할 때는 아래 순서를 따릅니다.

1. 프로젝트의 `components.json`에 `"registries": { "@webcraft": "https://goraebap.xyz/r/{name}.json" }`을 둡니다. 레지스트리 파일은 Webcraft FSD 별칭을 그대로 import하며 shadcn이 다른 별칭으로 바꿔 주지 않으므로, aliases를 `ui: "@/shared/ui"`, `lib: "@/shared/lib"`, `utils: "cn"`으로, tsconfig의 `@/*`를 `src/*`로 둡니다.
2. 토큰과 기본 CSS는 `npx shadcn@latest add @webcraft/theme`으로 받습니다.
3. 쓸 항목만 `npx shadcn@latest add @webcraft/<이름>`으로 받습니다. 받은 코드는 그 프로젝트 소유입니다. 빈 상태 그림(webp 12개)은 레지스트리 JSON에 담을 수 없어 `https://goraebap.xyz/r/assets/page-state/landscapes/`에서 따로 받습니다(`page-state` 항목 설치 안내에 명령이 있습니다).
4. 작성 양식을 쓰면 라우터보다 위에 `DraftProvider`를 둡니다.
5. 아이콘 이름을 더할 때는 `scripts/generate-ui-icons.mjs`의 매핑에 Solar 이름을 더하고 `npm run icons:ui`를 실행합니다.

공통 변경은 이미 받은 프로젝트에 자동으로 번지지 않습니다. 갱신은 `npx shadcn@latest add @webcraft/<이름> --diff`로 비교한 뒤 프로젝트가 고릅니다.

## 검증 범위와 미확인 사항

키트는 `npm run site:check`(타입)와 `npm run site:test`(모든 견본을 Chromium에서 그리고 조작)로 검사합니다. 실제 모바일 기기의 터치 끌기(순서 바꾸기·확대), 안드로이드 하드웨어 뒤로가기로 시트가 닫히는지, 화면 낭독기(스크린 리더) 전체 확인, 실제 서버와의 데이터 연동은 키트에서 확인하지 않았으므로 키트를 채택한 프로젝트에서 직접 검증합니다.
