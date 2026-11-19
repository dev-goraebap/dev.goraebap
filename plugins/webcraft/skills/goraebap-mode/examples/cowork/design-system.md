---
arc42: "8.5, 2"
---

# cowork: 디자인 시스템

cowork는 프로젝트·업무·문서를 다루는 설치형 작업 공간입니다. 이 파일은 [디자인 시스템 지침](../../../design-system/SKILL.md)을 cowork 화면(`web/`)에 적용한 모양을 담습니다. 지침이 말하는 참고 키트는 cowork의 `web/src/shared/ui/kit`입니다.

## 스택과 고른 이유

- 부품 라이브러리는 shadcn/ui(Base UI 1.9, 스타일 `base-nova`, CLI `shadcn` 4.23)입니다. 부품을 받아 프로젝트가 소유하는 방식이 지침의 "필요한 파일만 옮겨 소유한다"는 원칙과 맞습니다(Webcraft 결정 기록 "shadcn 레지스트리로 전환").
- 스타일은 Tailwind CSS 4.3(`@tailwindcss/vite`)입니다. 토큰을 CSS 변수로 정의하고 `@theme inline`으로 유틸리티에 노출하므로, 지침의 "토큰과 유틸리티로만 칠한다"를 테마 파일 하나로 지킵니다. 클래스 합치기는 `cn` 패키지입니다.
- 아이콘은 Solar(`@iconify-json/solar`)입니다. 선 형태(Linear)와 같은 모양의 채운 두 톤 형태(Bold Duotone)를 함께 가져 지침의 기본·선택 규칙에 맞습니다.
- 글꼴은 Pretendard Variable(고딕)과 JetBrains Mono Variable(고정폭)입니다.
- 본문 칸과 문서 편집기는 Tiptap 3.32(표는 `@tiptap/extension-table`, prosemirror-tables 기반), 도표는 Mermaid 12.2, 날짜 고르기는 react-day-picker 10입니다.
- 화면 전환 점검은 Playwright 1.64로 돌립니다.

## 지침을 어떻게 적용했나

### 입구와 범위

| 지침 | cowork |
| --- | --- |
| 부품 하나의 API는 라이브러리 문서와 도구가 맡음 | shadcn 공식 스킬과 shadcn MCP를 씁니다. 폼 칸 묶기는 `Field`·`FieldGroup`, 요소 바꾸기는 `render` prop(`asChild` 아님), 아이콘은 `data-icon`, 간격은 `gap-*`, 정사각 크기는 `size-*`입니다 |
| 키트와 제품 공용 부품을 나눔 | 키트(shadcn을 다듬은 부품과 Webcraft 자체 부품) `web/src/shared/ui/kit`, cowork가 만든 공용 부품 `web/src/shared/ui` |
| 업무를 모르는 조합은 공용 층, 앱 셸 같은 틀은 앱 층 | FSD에서 widgets 층을 두지 않고 조합은 `shared`, 앱 셸 조립은 `web/src/app/layout`(`AppFrame.tsx`)에 둡니다 |

### 테마와 색상

| 지침 | cowork |
| --- | --- |
| 테마 파일 하나에 라이트·다크 | `web/src/app/theme/tailwind.css`의 `:root`와 `[data-theme=dark]`, 노출은 `@theme inline` |
| 화면별 CSS·CSS 모듈·다른 스타일 도구 금지 | Tailwind 유틸리티와 의미 토큰만 씁니다. `*.module.css`와 StyleX를 쓰지 않습니다 |
| 내부 구분선 / 바깥 경계 | `--border`(글자 9%/8%) / `--input`(글자 18%/16%) |
| 포인터 채움 / 줄 전용 포인터 채움 | `--accent` / `--color-row-hover`(유틸리티 `bg-row-hover`) |
| 고른 채움 / 눌림 채움 | `--secondary` / `--pressed` |
| 초점 선 | `--ring` |
| 조작 면 네 토큰 | `--color-control`·`--color-control-hover`·`--color-control-on`·`--color-control-border`(유틸리티 `bg-control`·`hover:bg-control-hover`·`bg-control-on`·`border-control-border`) |
| 뜬 면의 가는 테두리 | shadcn base-nova 기본 `ring-foreground/10`(Webcraft 결정 기록 "뜬 면 테두리는 shadcn 기본") |
| 비활성 50% | 부품의 `disabled:opacity-50`(shadcn 기본) |
| 문서 루트의 테마 속성, 다크 변형으로 색 덮어쓰기 금지 | `html[data-theme=dark\|light]`. Tailwind `dark:` 변형도 이 속성을 보며, `dark:`로 색을 덮어쓰면 화면 규칙 검사가 막습니다 |

### 글자

| 지침 | cowork |
| --- | --- |
| 글자 크기 네 단계(작은·본문·큰 본문·페이지 제목) | `text-xs`·`text-sm`·`text-base`(제목은 `font-semibold`)·`text-2xl`. 데스크톱 값은 `tailwind.css`의 `@theme`, 휴대폰 값은 같은 파일의 `@media (width < 64rem)` |
| 임의 크기를 흩지 않음 | `text-[0.8rem]` 같은 임의 값 클래스를 쓰지 않습니다 |
| 고딕·고정폭 글꼴 | Pretendard Variable(`font-sans`), JetBrains Mono Variable(`font-mono`) |
| 고정폭 숫자 | `tabular-nums` |
| 말줄임 | 한 줄은 `truncate`, 여러 줄은 `line-clamp-N` |
| 명조 "전체" 적용 | `html`에 `data-font="serif"`를 붙이고 본문·제목 글꼴 변수(`--font-sans`, `--font-heading`)를 바꿉니다(`web/src/app/theme/fonts.css`, `web/src/app/providers/AppTheme.tsx`) |

### 간격과 크기, 면과 경계

| 지침 | cowork |
| --- | --- |
| 분기점 하나(64rem) | `--breakpoint-md: 64rem`. 휴대폰 크기는 `tailwind.css`의 `@media (width < 64rem)`와 부품의 `max-md:` 유틸리티 |
| 펼친 묶음 끝·하위 목적지 묶음의 8px | `--spacing-2` |
| 대화상자 안 여백 40px·24px·12px | `--spacing-10`·`--spacing-6`·`--spacing-3` |
| 펼친 검색 칸 높이 = 둥근 도구 높이 | 검색 칸은 `h-7`(28px), 휴대폰 `max-md:h-11`(44px)로 도구 단추와 같은 높이입니다(`search-tool.tsx`) |
| 면 네 단계 | 바닥 `--sidebar`, 페이지 `--background`, 올린 면 `--card`(테두리 `--border`), 뜬 면 `--popover`(메뉴·팝오버는 `shadow-md`와 `ring-1 ring-foreground/10`) |
| inset 페이지 면의 그림자 | `shadow-surface` 유틸리티(`--shadow-surface`: 옅은 그림자와 `--border` 외곽선) |
| 점 무늬 | `bg-dots` 유틸리티(`tailwind.css`의 `@utility bg-dots`). List-Detail의 빈 칸은 `SplitView`가 씁니다 |

### 아이콘

| 지침 | cowork |
| --- | --- |
| 공통 아이콘 모듈, 뜻을 나타내는 이름 | 화면은 lucide 대신 `@/shared/ui/kit/icon`에서 lucide 식 이름(`SearchIcon`, `ArrowLeftIcon`, `CalendarIcon`)으로 부릅니다 |
| 이름 → 실제 아이콘 매핑 한 곳 | `web/scripts/generate-ui-icons.mjs`. 쓰는 이름만 생성하며, 이름을 더하면 매핑에 Solar 이름을 더하고 다시 만듭니다 |
| 선 형태 / 선택 형태 | Solar Linear / Bold Duotone. 선택 여부는 `chosen` prop으로 넘깁니다 |
| 흐린 두 톤 선 형태를 섞지 않음 | Line Duotone을 기본 줄에 쓰지 않습니다 |
| 고르는 기준 표 | ← `ArrowLeftIcon`, 꺾쇠 `ChevronLeftIcon`·`ChevronRightIcon`, 달력 `CalendarIcon`, × `XIcon`, … `EllipsisIcon`, + `PlusIcon`, 방패 `ShieldCheckIcon` |
| 아이콘 버튼의 이름 | `label`과 툴팁 |

### 모션

| 지침 | cowork |
| --- | --- |
| 빠름 100ms / 중간 250ms | 지침의 시간 값을 씁니다. 이름 붙은 시간 토큰은 `tailwind.css`에서 확인하지 못했습니다 |
| 화면 전환 | View Transitions(`web/src/app/layout/RouteStage.tsx`, `web/src/app/styles/index.css`). TanStack Router는 loader가 끝난 뒤 전환을 시작하므로 준비 중 진행 표시가 멈추지 않습니다 |
| 대화상자 바꿔 끼우기 | `swapDialog`(`web/src/app/layout/PanelHost.tsx`) |
| 완료 축하 효과 | 키트에 없습니다 |

### 기본 부품

| 지침 | cowork |
| --- | --- |
| 키트 부품을 그대로 가져다 씀 | `@/shared/ui/kit/<이름>`을 import합니다 |
| 요소 바꾸기 | `<Button render={<Link to="..." />} nativeButton={false}>` |
| 버튼 변형 | 기본 알약 `default`, 테두리 없는 `ghost`, 위험 `destructive`, 만들기 `create`, 도구 `tool`, 보기 `view`, 고른 보기·켜진 도구 `view-active`. 이 밖에 `outline`·`secondary`·`link`가 있습니다(`button.tsx`) |
| 아이콘 버튼 | `Button size="icon"` |
| 라벨 / 개수 표시 | `Badge`의 `label` 변형 / `Badge` |
| 도구 점 | `ToolDot`(이름은 `label`) |
| 아바타 | `Avatar`, 사람은 `PersonAvatar`(그림 `picture`가 없으면 이름 첫 글자) |
| 입력·셀렉트·칸 묶음 | `Input`·`Textarea`·`Select`, 배치는 `Field`·`FieldGroup` |
| 대화상자 기본 부품 | shadcn `Dialog`. 제품 화면은 직접 쓰지 않습니다 |
| 묶음이 내려 주는 단추 설정과 끊기 | `ButtonStyleProvider` / 포털 안의 `ButtonStyleReset`(`dialog.tsx`·`alert-dialog.tsx` 등) |
| 공통 달력·날짜 고르기 | `DateCalendar`·`DatePicker`([date-picker.tsx](https://github.com/dev-goraebap/cowork/blob/570d27da402451fe2ca06fca74862dd3899555c9/web/src/shared/ui/kit/date-picker.tsx), react-day-picker) |

### 조합 부품

| 조합 | cowork 부품 |
| --- | --- |
| 공통 다이얼로그·확인 창·짧은 양식·상세 면 | [form-dialog](https://github.com/dev-goraebap/cowork/blob/570d27da402451fe2ca06fca74862dd3899555c9/web/src/shared/ui/kit/form-dialog.tsx)(`FormDialog`), [confirm-dialog](https://github.com/dev-goraebap/cowork/blob/570d27da402451fe2ca06fca74862dd3899555c9/web/src/shared/ui/kit/confirm-dialog.tsx)(`ConfirmDialog`), [detail-surface](https://github.com/dev-goraebap/cowork/blob/570d27da402451fe2ca06fca74862dd3899555c9/web/src/shared/ui/kit/detail-surface.tsx)(`DetailSurface`) |
| 곁에 여는 내용 | [adaptive-popover](https://github.com/dev-goraebap/cowork/blob/570d27da402451fe2ca06fca74862dd3899555c9/web/src/shared/ui/kit/adaptive-popover.tsx)(`AdaptivePopover`). 내용은 `close`를 받고, 바깥 제어는 `isOpen`·`onOpenChange`, 처음 열어 두기는 `defaultOpen`입니다. `trigger`를 대신 누르는 우회는 쓰지 않습니다. 시트는 Base UI 기반 `Drawer`입니다 |
| 동작 메뉴·행 메뉴·선택지 목록 | [action-menu](https://github.com/dev-goraebap/cowork/blob/570d27da402451fe2ca06fca74862dd3899555c9/web/src/shared/ui/kit/action-menu.tsx)(행 메뉴는 `size="row"`), [option-list](https://github.com/dev-goraebap/cowork/blob/570d27da402451fe2ca06fca74862dd3899555c9/web/src/shared/ui/kit/option-list.tsx) |
| 검색·필터·표시 도구 | [search-tool](https://github.com/dev-goraebap/cowork/blob/570d27da402451fe2ca06fca74862dd3899555c9/web/src/shared/ui/kit/search-tool.tsx), [filter](https://github.com/dev-goraebap/cowork/tree/570d27da402451fe2ca06fca74862dd3899555c9/web/src/shared/ui/kit/filter), [display-menu](https://github.com/dev-goraebap/cowork/blob/570d27da402451fe2ca06fca74862dd3899555c9/web/src/shared/ui/kit/display-menu.tsx) |
| 속성 알약 | [property-pill](https://github.com/dev-goraebap/cowork/blob/570d27da402451fe2ca06fca74862dd3899555c9/web/src/shared/ui/kit/property-pill.tsx)(`PropertyPill`·`OptionPill`·`DatePill`, 필수 `isRequired`, 오류 `isInvalid`, 첫 빠진 칸으로 초점 `focusFirstInvalid`, 날짜 표기 `format`), [info-pill](https://github.com/dev-goraebap/cowork/blob/570d27da402451fe2ca06fca74862dd3899555c9/web/src/shared/ui/kit/info-pill.tsx)(읽기 전용 `InfoPill`). `DatePill`은 `DateCalendar`로 고릅니다 |
| 활동·댓글 피드 | [ActivityFeed](https://github.com/dev-goraebap/cowork/blob/570d27da402451fe2ca06fca74862dd3899555c9/web/src/shared/ui/kit/reading/ui/ActivityFeed.tsx), 구절 인용 `Quote`. 하단 댓글 칸은 `rich-document`의 `CommentComposer`입니다 |
| 행 순서 바꾸기 | [reorder](https://github.com/dev-goraebap/cowork/tree/570d27da402451fe2ca06fca74862dd3899555c9/web/src/shared/ui/kit/reorder)의 `useRowReorder`. 손잡이에 `gripProps`를 펼칩니다 |
| 파일 올리기 칸 | [FileDropzone](https://github.com/dev-goraebap/cowork/blob/570d27da402451fe2ca06fca74862dd3899555c9/web/src/shared/ui/kit/compose/FileDropzone.tsx) |
| 상태 화면 | [page-state](https://github.com/dev-goraebap/cowork/tree/570d27da402451fe2ca06fca74862dd3899555c9/web/src/shared/ui/kit/page-state)(`PageState`, 설명 `description`, 작은 형태 `isCompact`). 그림(webp)은 `page-state/landscapes/` |
| 본문 칸 | [rich-document](https://github.com/dev-goraebap/cowork/tree/570d27da402451fe2ca06fca74862dd3899555c9/web/src/shared/lib/rich-document)(`RichDocument`, `mode`의 `edit`·`read`). 쓰는 칸 `RichDraft`, 읽는 본문 `RichBody`([rich-body](https://github.com/dev-goraebap/cowork/tree/570d27da402451fe2ca06fca74862dd3899555c9/web/src/shared/ui/rich-body)) |
| 문서 편집기 | [paged-document](https://github.com/dev-goraebap/cowork/tree/570d27da402451fe2ca06fca74862dd3899555c9/web/src/shared/ui/paged-document) |
| 그룹 머리 | [list-group-header](https://github.com/dev-goraebap/cowork/blob/570d27da402451fe2ca06fca74862dd3899555c9/web/src/shared/ui/kit/list-group-header.tsx) |
| 목록 끝 줄 | [list-more](https://github.com/dev-goraebap/cowork/blob/570d27da402451fe2ca06fca74862dd3899555c9/web/src/shared/ui/kit/list-more.tsx)(`ListMore`) |
| 표 머리 정렬 | [sortable-head](https://github.com/dev-goraebap/cowork/blob/570d27da402451fe2ca06fca74862dd3899555c9/web/src/shared/ui/kit/sortable-head.tsx)(`SortableHead`) |
| 단계 표시 | 키트 부품이 없습니다 |

제품 고유 조합(아이콘 표시 고르기 `web/src/shared/ui/mark-picker`, 전역 검색 팔레트, 프로필 패널)은 키트가 아니라 cowork 코드입니다.

### 본문 칸과 문서 편집기

| 지침 | cowork |
| --- | --- |
| 참고 구현의 에디터 | Tiptap 3.32(`@tiptap/*`), 표는 prosemirror-tables |
| 본문 글자와 제목 크기 | 본문 스타일은 `web/src/shared/lib/rich-document/styles.css`에 있습니다 |
| 호스트가 주는 함수 | 올리기 `upload`, 링크 미리보기 `readPreview`, 링크 후보 문서 `links`, 앱 안 이동 `onNavigate` |
| 블록 링크 주소 | 지금 주소에 `#block-<id>` |
| 읽는 화면의 앱 안 링크 | `RichBody`의 `onNavigate`, 본문 링크 처리 `followInside`(`RichBody.tsx`) |
| 표 열 너비를 늘 등록 | `ResizableTable`, `SyncedTableView`(`rich-document/schema.ts`) |
| 저장되지 않는 올리는 칸 | ProseMirror decoration |
| 도표 | Mermaid. CSS 변수를 읽지 못하므로 라이트·다크 색표를 `web/src/shared/lib/rich-document/diagram-style.ts`의 `palettes`에 두고 `diagramConfig`로 `mermaid.initialize`에 넘깁니다 |
| 상단 서식 막대 | `DocumentFormatBar`(`rich-document/DocumentFormatBar.tsx`) |
| 페이지 설정 / 페이지 모양 | `PageSetup` / `PageLook`(`paged-document/model.ts`). 머리말·바닥글의 자리 표시는 `{page}`(이 페이지 번호), `{total}`(전체 페이지 수) |
| 본문을 읽는 다른 기능 | MCP, Markdown, 버전 기록 |
| 편집·읽기 연결 | `DocumentEditorHost`(수정 화면의 서식 막대 자리와 본문 틀), `pagination.ts`(Tiptap 확장 `Pagination`), `PageCanvas`(종이 틀·머리말·바닥글), `DocumentSettings`, `usePagedFrame`(편집과 읽기가 함께 쓰는 연결) |
| 머리 줄이 같은 수정 화면 | `DocumentEditPage` |
| 읽기 화면 틀 | `DetailLayout` |
| 인쇄할 뿌리 요소 | `data-print-root`(`web/src/pages/print/documents/$documentId/ui/DocumentPrintPage.tsx`) |

paged-document를 가져갈 때는 이 부품들이 가져오는 rich-document 파일도 함께 복사합니다.

### 앱 셸과 페이지 배치

| 지침 | cowork |
| --- | --- |
| 앱 셸 | [AppShell](https://github.com/dev-goraebap/cowork/tree/570d27da402451fe2ca06fca74862dd3899555c9/web/src/shared/ui/kit/layout/app-shell)(shadcn `Sidebar` 위). 공간별 메뉴 데이터는 `NavSpace`(`web/src/shared/config/nav.ts`), 관리 진입은 `adminEntries` |
| 하위 메뉴 묶음 펼치기 | `openGroups`: 모두 펼치기 `'all'`(기본), 현재 묶음만 `'current'` |
| 페이지 틀 | [Page](https://github.com/dev-goraebap/cowork/tree/570d27da402451fe2ca06fca74862dd3899555c9/web/src/shared/ui/kit/layout/page). 바닥 고정 줄은 `footer`, 줄 이름은 `footerLabel` |
| 본문이 자기 제목을 그림 | `useOwnPageTitle()`(`layout/page/chrome.tsx`) |
| 휴대폰 앱 바의 도구 자리 | [PhoneTools](https://github.com/dev-goraebap/cowork/tree/570d27da402451fe2ca06fca74862dd3899555c9/web/src/shared/ui/kit/layout/phone-tools) |
| 칸 머리 틀 | [PaneFrame](https://github.com/dev-goraebap/cowork/tree/570d27da402451fe2ca06fca74862dd3899555c9/web/src/shared/ui/kit/layout/pane-frame). 주 동작 표시는 `isPrimary` |
| 상세의 둥근 아이콘 도구 | `variant="tool"` |
| 분할 틀 | [SplitView](https://github.com/dev-goraebap/cowork/tree/570d27da402451fe2ca06fca74862dd3899555c9/web/src/shared/ui/kit/layout/split-view): 진입부 `SplitResource`, 목록 화면 `SplitScreen`, 줄 `SplitLinkRow` |
| 표 | [Table](https://github.com/dev-goraebap/cowork/blob/570d27da402451fe2ca06fca74862dd3899555c9/web/src/shared/ui/kit/table.tsx) |
| 상세 틀 | [DetailLayout](https://github.com/dev-goraebap/cowork/blob/570d27da402451fe2ca06fca74862dd3899555c9/web/src/shared/ui/kit/reading/ui/DetailLayout.tsx) |
| 목차 | 키트 부품이 없고 화면이 직접 그립니다. 목차를 스스로 그리는 tocbot 같은 라이브러리는 쓰지 않습니다 |
| 관리 면 | [AdminSurface](https://github.com/dev-goraebap/cowork/blob/570d27da402451fe2ca06fca74862dd3899555c9/web/src/shared/ui/kit/settings/AdminSurface.tsx)(데스크톱 `PaneFrame`, 목록 위 대화상자, 휴대폰 `Page`) |
| 옆 패널 | [WithPanel](https://github.com/dev-goraebap/cowork/blob/570d27da402451fe2ca06fca74862dd3899555c9/web/src/shared/ui/kit/side-panel/WithPanel.tsx) |

### 생성 양식과 대화상자

| 지침 | cowork |
| --- | --- |
| 작성 양식 | [ComposeSurface](https://github.com/dev-goraebap/cowork/blob/570d27da402451fe2ca06fca74862dd3899555c9/web/src/shared/ui/kit/compose/ComposeSurface.tsx)·`ComposeFields`. 쓴 내용 여부는 `isDirty` |
| 대화상자보다 오래 사는 초안 저장소 | 쿼리 캐시에 맡기는 `useComposeTransfer`([panel.ts](https://github.com/dev-goraebap/cowork/blob/570d27da402451fe2ca06fca74862dd3899555c9/web/src/shared/lib/panel.ts)) |
| 첫 빠진 항목으로 초점 | `focusFirstInvalid` |
| 바텀시트 | `Drawer` |
| 수정 화면과 공통 편집 상태 | 문서 수정 화면 [DocumentEditPage](https://github.com/dev-goraebap/cowork/blob/570d27da402451fe2ca06fca74862dd3899555c9/web/src/pages/_app/workspace/projects/$key/documents/ui/DocumentEditPage.tsx), 제목·본문 편집 상태 [useBodyEdit](https://github.com/dev-goraebap/cowork/blob/570d27da402451fe2ca06fca74862dd3899555c9/web/src/shared/ui/rich-body/body-edit.tsx) |
| 설명·메모·도움말 속성 | `description`·`note`·`hint` |

### 라우트 마스킹

| 지침 | cowork |
| --- | --- |
| 패널 열기·읽기, 바꿔 끼우기, 초안 넘기기 | [panel.ts](https://github.com/dev-goraebap/cowork/blob/570d27da402451fe2ca06fca74862dd3899555c9/web/src/shared/lib/panel.ts)의 `useOpenPanel`·`usePanel`, `swapDialog`, `carryDraft` |
| 패널 쿼리 | `?panel=대상` |
| 새로고침하면 마스크를 풂 | TanStack Router의 `unmaskOnReload`(`web/src/app/router/router.tsx`) |
| 집중 보기 쿼리 | `?focus=1` |

### 데이터 상태

| 지침 | cowork |
| --- | --- |
| 이름 있는 진행 표시 | `Spinner`(이름은 `aria-label`) |
| 앱 안 링크 미리 준비 | `web/src/app/layout/use-intent-preload.ts`가 문서의 `pointerover`·`focusin`에서 `router.preloadRoute`를 부릅니다 |
| 이전 결과를 자리 값으로 유지 | TanStack Query `placeholderData` |
| 첫 방문 덮개 | [BootCover](https://github.com/dev-goraebap/cowork/blob/570d27da402451fe2ca06fca74862dd3899555c9/web/src/shared/ui/kit/boot-cover/BootCover.tsx). 빌드 플러그인은 [vite.config.ts](https://github.com/dev-goraebap/cowork/blob/570d27da402451fe2ca06fca74862dd3899555c9/web/vite.config.ts)의 `initial-cover`로, `index.html`의 앱 자리에 덮개를 넣고 색은 `web/src/app/theme/boot.ts`의 `bootColors`에서 가져옵니다. 저장한 모드는 `html[data-theme]`입니다 |
| 브라우저 자동화 점검 | Playwright 스크립트 `web/scripts/layout-shift.mjs` |

### 화면 규칙 검사

[check-ui.mjs](https://github.com/dev-goraebap/cowork/blob/570d27da402451fe2ca06fca74862dd3899555c9/web/scripts/check-ui.mjs)가 지침의 "실행과 검토"를 구현합니다. FSD 레이어 방향과 같은 레이어의 다른 슬라이스 import, `pages`에서 다른 주소의 파일 import, 팔레트 색 클래스·`dark:` 색 덮어쓰기·직접 쓴 색 값·`space-x/y-*`·`!important`·`*.module.css`를 막습니다. `style={{}}`는 같은 줄이나 윗줄에 `// check-ui: allow-style <이유>`가 있을 때만 허용합니다. lucide-react와 `@/shared/lib/utils` import도 막습니다(`cn`은 `cn` 패키지에서 가져옵니다). 키트·본문 편집기·테마 파일에는 색·간격 규칙을 걸지 않고 레이어와 import 검사만 겁니다.

### 키트를 채택할 때

| 지침 | cowork |
| --- | --- |
| 경로 별칭과 부품 라이브러리 설정을 키트와 맞춤 | `components.json`의 aliases를 `ui: "@/shared/ui/kit"`, `lib: "@/shared/lib"`, `utils: "cn"`으로, tsconfig의 `@/*`를 `src/*`로 둡니다. FSD는 역할로 지은 파일을 두지 않으므로 `shared/lib/utils.ts`를 만들지 않습니다. 기본 부품은 shadcn CLI로 받아도 됩니다 |
| 부품이 기대는 자산 | 토큰과 기본 CSS `web/src/app/theme/tailwind.css`, 아이콘 `web/src/shared/ui/kit/icon`(`web/scripts/generate-ui-icons.mjs`로 생성), 빈 상태 그림 `web/src/shared/ui/kit/page-state/landscapes/` |
| 링크 요소를 직접 받음 | `render={<Link … />}`나 `RowLink`(`row-link.tsx`) |
| 폴더 나누기 | 가져온 부품 `src/shared/ui/kit`, 제품이 만든 공통 부품 `src/shared/ui` 바로 아래 |
| 원본 커밋 기록 | 복사한 cowork 커밋을 프로젝트 AGENTS.md나 결정 기록에 적습니다 |

## 코드 위치

- [키트](https://github.com/dev-goraebap/cowork/tree/570d27da402451fe2ca06fca74862dd3899555c9/web/src/shared/ui/kit): shadcn을 다듬은 부품과 Webcraft 키트 부품
- [레이아웃](https://github.com/dev-goraebap/cowork/tree/570d27da402451fe2ca06fca74862dd3899555c9/web/src/shared/ui/kit/layout): `app-shell`·`page`·`split-view`·`pane-frame`·`phone-tools`
- [제품 공용 부품](https://github.com/dev-goraebap/cowork/tree/570d27da402451fe2ca06fca74862dd3899555c9/web/src/shared/ui): `paged-document`·`rich-body` 등
- [공용 라이브러리](https://github.com/dev-goraebap/cowork/tree/570d27da402451fe2ca06fca74862dd3899555c9/web/src/shared/lib): `panel.ts`·`rich-document` 등 사용 패턴의 구현
- [토큰 CSS](https://github.com/dev-goraebap/cowork/blob/570d27da402451fe2ca06fca74862dd3899555c9/web/src/app/theme/tailwind.css)
- [아이콘 모듈](https://github.com/dev-goraebap/cowork/tree/570d27da402451fe2ca06fca74862dd3899555c9/web/src/shared/ui/kit/icon)과 [생성 스크립트](https://github.com/dev-goraebap/cowork/blob/570d27da402451fe2ca06fca74862dd3899555c9/web/scripts/generate-ui-icons.mjs)
- [부품 라이브러리 설정](https://github.com/dev-goraebap/cowork/blob/570d27da402451fe2ca06fca74862dd3899555c9/web/components.json)
- [화면 규칙 검사](https://github.com/dev-goraebap/cowork/blob/570d27da402451fe2ca06fca74862dd3899555c9/web/scripts/check-ui.mjs)

## 지침과 다르게 정한 것

| 지침 | cowork | 이유 |
| --- | --- | --- |
| 검증 절차에서 긴 placeholder도 쓰지 않는 문구로 훑어 지웁니다([문구·본문과 검증](../../../design-system/references/content-and-review.md)) | 입력 칸·글 칸·본문 편집기의 자리 글은 지우지 않습니다. 지시형 문장은 짧은 이름으로 바꾸고 형식 예시는 그대로 둡니다 | 테두리 없는 본문 편집기는 자리 글이 칸을 알리는 유일한 표시입니다(cowork `AGENTS.md`의 프로젝트 규칙) |

## 작업 절차

`web/`에서 실행합니다.

- `npm run check`: 화면 규칙 검사·lint·knip·테스트·빌드를 함께 실행합니다.
- `npm run lint:ui`: 화면 규칙 검사만 실행합니다.
- `npm run icons:ui`: 아이콘 이름을 더한 뒤 아이콘 모듈을 다시 만듭니다.
- `npm run layout:check`: 실행 중인 앱에서 화면 전환의 레이아웃 이동과 대기를 잽니다.
