# shadcn-tailoring

shadcn/ui(Base UI)와 Tailwind CSS v4로 호호코워크 웹과 같은 화면을 만드는 실험 앱입니다. 화면 기준은 [호호코워크 재현 설계](docs/hohocowork-parity.md)입니다. 저장소 루트의 Webcraft 디자인 지침(`plugins/webcraft/skills/design-system`)은 Astryx를 전제로 하므로 이 앱에는 적용하지 않습니다. 이 파일과 shadcn 공식 문서를 따릅니다.

## 스택과 실행

- React 19, Vite 7, TypeScript, TanStack Router·Query, shadcn/ui(`base-nova`, Base UI), Tailwind CSS v4, Solar 아이콘, Pretendard 글꼴
- 이 폴더에서 `npm install` 뒤 `npm run dev`(4470), `npm run check`(타입 검사), `npm run check:ui`(화면 규칙), `npm run icons`(아이콘 생성), `npm run build`
- 의존성은 이 폴더의 `package.json`이 따로 관리합니다. 루트 `node_modules`를 쓰지 않습니다.

## 구조 (FSD)

`src/`를 `app → pages → widgets → features → entities → shared` 순서로 나누고 필요한 계층만 둡니다. 상위 계층을 하위 계층에서 가져오지 않고, 같은 계층의 다른 슬라이스를 직접 가져오지 않습니다. 슬라이스 밖에서는 `index.ts` 공개 진입점으로 가져옵니다.

| 위치 | 담는 것 |
| :--- | :--- |
| `app/` | 진입점(`main.tsx`), 라우터, 공급자, 전역 스타일(`styles/index.css`) |
| `pages/<이름>/` | 라우트 하나의 화면 |
| `widgets/app-shell/` | 사이드바 · inset 본문 · 휴대폰 하단 탭 |
| `shared/ui/` | shadcn이 생성한 부품(우리가 고침)과 앱 공통 부품: `page`(머리 줄 · 툴바 · 앱 바 · ToolDot), `settings`, `icon`(Solar), `adaptive-popover`(팝오버 ↔ 바텀시트), `action-menu`(… 메뉴), `option-list`, `filter`(useFilters · FilterMenu · FilterBar · FilterChips), `display-menu`, `list-group-header`, `pane-resize-handle`, `property-pill`(속성 알약 · `pillVariants`) · `info-pill`(읽기 알약), `date-picker`(DateCalendar · DatePicker), `confirm-dialog`(삭제 확인: 확인 창 ↔ 바텀시트), `segmented-control`, `row-link`(줄 전체 링크), `person-avatar` |
| `shared/lib/` | `cn()`, `useIsMobile`, `appearance`(모드 · 목록 높이), `useStoredWidth`, `toggleValue`, `profile-route`(프로필 대화상자 ↔ 페이지) |
| `shared/config/` | 주소(`paths`) 등 설정 |

`components.json`의 별칭이 `shared/`를 가리키므로 `npx shadcn@latest add <부품>`은 부품을 `shared/ui/`에 만듭니다. 생성된 부품은 우리 코드입니다. 앱 전체의 모양을 바꿀 때는 부품 파일을 직접 고칩니다. 부품을 더한 뒤에는 `lucide-react` import를 `@/shared/ui/icon`으로 바꾸고(`check:ui`가 막음), 없는 이름은 `scripts/generate-icons.mjs`에 Solar 이름으로 더합니다. 아이콘의 `chosen`은 고름 · 열림 · 지금 자리를 같은 아이콘의 Bold Duotone으로 그립니다.

## 스타일

- **두 화면 이상이 쓸 부품은 `shared/ui`에 둡니다.** 페이지는 무엇을 보이는지(필터 정의, 정렬 기준, 줄의 내용)만 정하고 모양과 동작은 공통 부품에 맡깁니다.

- **Tailwind 유틸리티로 씁니다.** 별도 CSS 파일과 CSS Modules를 만들지 않습니다. 예외는 `app/styles/index.css` 하나로, 테마 토큰(`:root`, `.dark`)과 `@theme inline`을 둡니다.
- **색은 의미 토큰만 씁니다.** `bg-background`, `text-muted-foreground`, `border-border`처럼 씁니다. `bg-zinc-900` 같은 팔레트 색과 `dark:` 색 덮어쓰기는 쓰지 않습니다. 다크 모드는 `.dark`의 토큰 값이 맡습니다.
- **새 색이 필요하면 토큰을 더합니다.** 줄 가리킴(`bg-row-hover`), 그룹 띠(`bg-band`), 읽지 않음(`bg-unread`), 업무 표식(`text-mark-*`)처럼 이름을 붙입니다. `:root`와 `.dark`에 정의하고 `@theme inline`으로 Tailwind에 노출합니다.
- **간격은 `flex`·`grid`와 `gap-*`로 둡니다.** `space-x-*`·`space-y-*`는 쓰지 않습니다. 너비와 높이가 같으면 `size-*`를 씁니다.
- **부품에 넘기는 `className`은 배치용입니다.** 부품의 색과 글자를 덮어쓰지 않고, 필요하면 variant를 더합니다. 클래스는 `cn()`으로 합칩니다.
- **Base UI 부품은 `render`로 요소를 바꿉니다.** `asChild`가 아닙니다. 예: `<SidebarMenuButton render={<Link to={paths.inbox} />}>`

## 휴대폰

분기점은 64rem(1024px) 하나입니다. Tailwind의 `md:`와 `useIsMobile`이 같은 값입니다.

- **셸:** 사이드바 대신 하단 탭(앞 4개 + 더보기 바텀시트). 위쪽은 `Page`가 그리는 52px 앱 바(뒤로 · 제목 · 공통 도구)입니다.
- **만들기:** `Page`의 `create`가 휴대폰에서 FAB가 됩니다.
- **뜨는 것:** 데스크톱 팝오버는 휴대폰에서 반드시 바텀시트입니다(`AdaptivePopover`). 대화상자는 `Drawer`로 바꿉니다.
- **화면 구성:** 목록 같은 상위 페이지는 앱 바 + 도구 줄 + 하단 탭, 상세는 자기 화면입니다. 데스크톱 화면을 줄여 쓰지 않습니다.

## 검증

화면을 바꾸면 `npm run check`와 `npm run check:ui`를 실행합니다. 호호코워크 플레이그라운드(`Hohoco/web`에서 `npx vite --port 4420`, `/playground/frame.html?screen=…`)와 같은 크기로 찍어 나란히 비교합니다. 그다음 실제 화면에서 데스크톱(1440)·휴대폰(390), 라이트·다크를 확인합니다. 확인한 것과 못 한 것을 나누어 보고합니다.
