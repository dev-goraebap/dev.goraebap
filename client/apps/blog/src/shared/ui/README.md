# Webcraft 키트

업무 앱이 같은 화면 구성과 상호작용을 재현할 수 있도록 고른 공통 UI 구현이다. shadcn/ui(Base UI, `base-nova`)와 Tailwind CSS v4로 만들었고, 이 폴더 바로 아래와 `src/shared/lib`에 있다. 사용 기준은 `plugins/webcraft/skills/design-system/references`의 Markdown이 원본이고, 실행 견본은 `client/apps/blog/samples`에 있으며 가이드 사이트(`client/apps/blog`)에서 본다. 이 폴더는 플러그인에 포함하지 않고 shadcn 레지스트리로 배포한다.

## shadcn 키트

특정 제품의 업무에 묶이지 않은 공통 부품이다. 다크 모드는 html(`:root`)의 `data-theme`으로 읽는다(`.dark` 클래스를 쓰지 않는다).

| 위치 | 담는 것 |
| --- | --- |
| `*.tsx`(바로 아래) | shadcn 부품(우리가 고침: button의 알약 · 조작 면 변형 view · tool · create와 `ButtonStyleProvider` · `ButtonStyleReset`, badge의 label, sidebar · input · textarea · select의 크기, select 팝업 폭, toast의 층 · 남은 시간 막대, switch의 손잡이, table의 `layout="fit"`, dialog의 바꿔 끼우기)와 공통 부품(adaptive-popover, action-menu, menu-item, option-list, confirm-dialog, form-dialog, detail-surface, date-picker, property-pill · info-pill, display-menu, list-group-header, list-more, sortable-head, step-indicator, pane-resize-handle, segmented-control, row-link, person-avatar, search-tool, tool-dot) |
| `icon/` | lucide와 같은 이름으로 부르는 Solar 아이콘. `npm run icons:ui`가 `scripts/generate-ui-icons.mjs`의 이름표로 `icons.generated.ts`를 만든다 |
| `layout/` | 업무를 모르는 레이아웃: `app-shell`(사이드바 · 공간 자리 · 맨 아래 관리 진입 · 휴대폰 유리 막대 `PhoneBar`와 하단 탭), `page`(머리 줄 · 툴바 · 휴대폰 앱 바 알약), `split-view`(List-Detail: `SplitView` · `SplitResource` · `SplitScreen` · `SplitLinkRow`), `pane-frame`(칸 머리 틀 `PaneFrame`), `phone-tools`(휴대폰 도구 자리) |
| `settings/` · `compose/` · `filter/` · `page-state/` · `reading/` | 설정 화면과 관리 화면의 넓은 면(`AdminSurface`), 만들기 양식(내용 + 바닥 두 칸), 필터, 상태 화면(풍경 그림 webp), 읽기 상세 · 활동 |
| `side-panel/` · `reorder/` · `body-edit/` · `boot-cover/` · `editor/` · `document/` | 옆 패널(주소가 필요 없는 짧은 조회), 순서 바꾸기, 본문 수정 화면, 첫 방문 덮개(Vite 플러그인 포함), 본문 칸, 문서 편집기 |
| `../lib/` | `useIsMobile`, `appearance`(모드 · 목록 높이), `useStoredWidth`, `toggleValue`, `panel`(목록 위 대화상자 · 페이지로 열기 전환), `route-location`(그려진 주소 · 이동 중인 주소), `useComposeParam`, `draft`(초안), `list-address`(목록 조건의 주소), `focus-invalid`, `cn` |

키트에 두지 않는 것: 제품 표시(로고), 로그인, 사람 프로필 주소, 주소 설정, 기본 아바타 그림, 메뉴 구성(공간 · 메뉴 이름 · 주소 값). 메뉴 구성은 업무를 알므로 받는 앱의 `widgets/app-shell`이 `NavSpace` 데이터와 공간 전환 셀렉터를 만들어 `AppShell`에 넘긴다. `PersonAvatar`는 그림을 넘기지 않으면 이름 첫 글자를 보인다.

- 리소스 패턴의 부품: List-Detail은 `layout/split-view`, Drill-down은 `layout/page`와 `detail-surface`(`surface="page"`), Routed Modal은 `lib/panel`과 `detail-surface`(`surface="dialog"`) · `dialog`의 `DialogPanel` · `swapDialog`다. 상세 · 작성 · 수정 페이지와 목록 오른쪽 칸은 같은 칸 머리 틀(`PaneFrame`)을 쓴다.
- 화면 전환(`@webcraft/theme`): 앱은 라우터가 그리는 자리(Outlet을 감싼 요소)에 `route-content` 클래스를 단다. 메뉴의 고른 표시는 `usePendingPathname() ?? pathname`으로 넘겨 이동 중인 주소를 따른다.
- `components.json`의 별칭이 `@/shared/ui` · `@/shared/lib`이므로 `npx shadcn@latest add <부품>`은 이 폴더에 만든다. 받은 뒤 `lucide-react` import를 `@/shared/ui/icon`으로 바꾸고, 없는 이름은 `generate-ui-icons.mjs`에 더한다.
- `npm run check:ui`가 사이트 전체(`src` · `samples`)에 화면 규칙(FSD, 의미 토큰, 팔레트 색 · `dark:` 색 · `space-*` 금지, `style={{}}`은 `// check-ui: allow-style <사유>`가 있을 때만, lucide 금지)을 건다. 견본은 FSD 계층 밖이라 FSD 규칙은 보지 않는다. `pages/<공간>/<슬라이스>`처럼 공간으로 묶은 페이지는 슬라이스를 두 마디로 본다.

## 레지스트리

`client/apps/blog/registry.json`이 키트를 shadcn 레지스트리 `webcraft`로 내보낸다. `npm run registry:build`가 `public/r/<이름>.json`을 만들고, 사이트 배포가 그대로 `https://goraebap.xyz/r/<이름>.json`으로 올린다. 부품을 더하거나 import를 바꾸면 `registry.json`의 `files` · `dependencies` · `registryDependencies`를 함께 고치고 다시 빌드한다.

받는 프로젝트는 Webcraft FSD 배치를 쓴다: `@/*` → `src/*`, 공통 UI는 `src/shared/ui`, 도우미는 `src/shared/lib`. 파일은 `target`대로 그 자리에 놓이고, import(`@/shared/ui/...`)는 받는 쪽 별칭에 맞춰 바뀌지 않는다.

```text
npx shadcn@latest init -b base -p nova
# components.json: aliases를 components · ui → @/shared/ui, lib · hooks → @/shared/lib, utils → cn(패키지)으로,
#   registries에 "@webcraft": "https://goraebap.xyz/r/{name}.json"
npx shadcn@latest add @webcraft/theme @webcraft/page @webcraft/compose
```

- `@webcraft/theme`가 토큰 · 글꼴 · 유틸리티 · 화면 전환을 CSS에 더한다. init이 남긴 `@custom-variant dark (&:is(.dark *))`와 `.dark { … }`는 지운다(뒤에 더한 `data-theme` 변형이 이기지만 남겨 둘 이유가 없다).
- 레지스트리 JSON은 글자 파일만 담는다. 상태 화면의 webp 12장은 `https://goraebap.xyz/r/assets/page-state/landscapes/`에서 받는다(`page-state`의 설치 안내에 명령이 있다).
- shadcn add는 파일 맨 앞(첫 문장 앞)의 주석을 지운다. 지워지면 안 되는 머리 주석(아이콘의 저작자 표시)은 첫 import 뒤에 둔다.
