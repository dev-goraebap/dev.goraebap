# 호호코워크 화면을 shadcn으로 재현하는 설계

호호코워크 웹(`Hohoco/web`)과 같은 모양·배치·휴대폰 동작을 shadcn/ui(Base UI) + Tailwind로 만듭니다. 기준 명세는 호호코워크의 `web/DESIGN.md`와 플레이그라운드 화면이고, 이 문서는 그 규칙을 이 앱의 어느 코드가 맡는지 정합니다. 호호코워크 쪽 파일은 읽기만 합니다.

## 원칙

- **같은 결과, shadcn의 방식.** 값(색·간격·높이·분기점)은 호호코워크에서 그대로 가져오고, 구현은 shadcn 관례를 따릅니다. 토큰은 CSS 변수에, 모양은 부품의 `cva` 변형에, 배치는 Tailwind 유틸리티에 둡니다.
- **부품은 가져와서 고칩니다.** `shared/ui`의 shadcn 부품은 우리 코드입니다. 호호코워크 모양이 나오도록 변형과 기본값을 직접 고치고, 페이지에서 `className`으로 색을 덮지 않습니다.
- **휴대폰은 따로 설계합니다.** 분기점과 휴대폰 구조(하단 탭, 앱 바, FAB, 전체 화면 상세)를 호호코워크와 같게 둡니다. 데스크톱 화면을 줄여 쓰지 않습니다.
- **코드는 검사로 지킵니다.** FSD 경계, 팔레트 색 금지, `space-*` 금지 같은 규칙을 스크립트로 막습니다(호호코워크 `check-ui`에 해당).

## 1. 기초 (토큰·글자·아이콘)

| 호호코워크 | 값 | shadcn 쪽 자리 |
| :--- | :--- | :--- |
| 면 4단계 | 바닥(wash) · 페이지(surface) · 올린 면(card + 가는 테두리) · 뜬 면(popover + 그림자) | `--sidebar`(바닥), `--background`(페이지), `--card`, `--popover`. `app/styles/index.css`의 `:root`·`.dark` |
| 기준 색 | body `#efeff0`/`#09090a`, surface `#f9f9fa`/`#121213`, 글자 `#1b1b1b`/`#f7f8f8`, 보조 글자 `#5c5c5e`/`#8a8f98`, 강조 = 글자색(검정·흰색) | 같은 토큰에 이식합니다. 경계선은 글자색 13%/11% 섞기, 진한 경계는 18%/16% |
| 글꼴 | Pretendard Variable, 코드 JetBrains Mono | `--font-sans`, `--font-mono` |
| 글자 크기 | 데스크톱 본문 13px, 휴대폰 15px, 큰 본문 15/17px, 페이지 제목 24px | `@theme`에 `--text-*`를 정의하고 64rem 미만에서 바꿉니다 |
| 큰 화면 | 1920px부터 루트 글자가 커져 2560px에서 19px. 크기는 모두 rem | 전역 CSS 한 줄. Tailwind 크기는 원래 rem입니다 |
| 높이 | 부품 28px(md)·24px(sm)·32px(lg), 입력 칸 36px(휴대폰 48px) | `button`·`input`·`select`의 `size` 변형을 이 값으로 고칩니다 |
| 모서리 | 요소 8px, 묶음 12px, 메뉴 항목 10px 초타원, inset 본문 16px 초타원 | `--radius` 단계. 초타원은 `corner-shape: squircle`을 유틸리티로 둡니다 |
| 아이콘 | Solar Linear(기본), 고름·열림·현재 위치는 같은 아이콘의 Bold Duotone, 13px 글자 옆 16px | lucide 대신 Solar 생성 모듈(`shared/ui/icon`). `components.json`의 `iconLibrary`와 생성되는 부품 아이콘도 바꿉니다 |

## 2. 앱 셸 (`widgets/app-shell`)

| 호호코워크 | shadcn 구현 |
| :--- | :--- |
| 사이드바 340px, 끌어서 220~380px, 접으면 아이콘만 | `Sidebar`(collapsible="icon")에 폭 조절 손잡이를 더합니다(shadcn에 없으므로 `shared/ui/sidebar` 테일러링) |
| 사이드바 머리: 로고 + 검색 아이콘, 그 아래 내 박스(아바타·이름·소속·⋮ 메뉴) | `SidebarHeader` 안에 `MeBox`(`DropdownMenu`) |
| 메뉴 구역: 알림함 / 워크스페이스 / 더보기 / 관리, 주소에 따라 구역이 바뀌는 메뉴(프로젝트·내 계정·관리) | `nav.ts` 모델(구역·항목·역할)과 `spaceOf(pathname)`. 구역이 아닌 메뉴는 맨 위에 ← 구역 이름 |
| 메뉴 항목 28px, 초타원 10px, 고른 항목은 Bold Duotone | `sidebar-menu-button` 변형 수정 |
| 사이드바 바닥: 버전과 접기(«) | `SidebarFooter` |
| inset 본문: 바닥 위 16px 초타원 면, 위·오른쪽 8px 띄움, 낮은 그림자. 아래 40px Agent 줄 | `SidebarInset`을 inset 모양으로 고정하고 여백·모서리를 호호코워크 값으로 |
| 휴대폰(64rem 미만): 사이드바 대신 하단 탭(앞 4개 + 더보기 바텀시트), 위 52px 앱 바, 만들기 FAB | `useIsMobile` 분기점을 1024px로 바꾸고 `MobileTabBar`·`MobileMenuSheet`(`Drawer`)·`AppBar`를 새로 둡니다. shadcn의 "사이드바가 Sheet로" 동작은 쓰지 않습니다 |

## 3. 페이지 틀 (`shared/ui/page`)

| 호호코워크 | shadcn 구현 |
| :--- | :--- |
| `PageHeader` 52px: 왼쪽 경로(위 단계 보조색 500, › 구분, 마지막은 아이콘 + 이름 600), 오른쪽 동작·…·만들기 | `Breadcrumb` 테일러링 + 머리 줄 부품. 휴대폰은 ← 와 이름만 |
| `PageToolbar` 44px(휴대폰 52px): 뷰 알약(`view`·`view-active`), 오른쪽 동그란 도구(필터·표시·검색) | `Button`에 `view`·`view-active`·`tool`·`create` 변형을 더합니다. 뷰 줄은 가로로 넘기고 가장자리를 흐립니다 |
| 필터: 데스크톱 2단계 팝오버와 칩 줄(40px), 휴대폰 2단계 바텀시트와 칩 줄 | `shared/ui/filter`: `Popover`/`Drawer` + `Command` |
| 표시(정렬·그룹) | `DisplayMenu`: 데스크톱 `Popover`, 휴대폰 `Drawer` |
| 무엇을 누르면 뜨는 것: 데스크톱 팝오버, 휴대폰은 반드시 바텀시트 | `AdaptivePopover`(`Popover` ↔ `Drawer`), 메뉴 내용은 `ActionMenu`(항목 35px, 모든 항목에 아이콘) |
| 본문 여백: 글자는 면 가장자리에서 16px, 본문 칸 자체에는 여백 없음(줄이 자기 안쪽에 16px) | 목록 줄·표 첫/끝 칸이 `px-4`를 가집니다 |
| 목록 높이 설정: 넉넉하게(줄 약 45px) · 촘촘하게 | `PageList`·`PageTable`이 `data-density`로 높이를 바꿉니다 |
| 빈·오류 화면 `PageState`(펜 선 그림 4종) | `Empty` 테일러링. 그림은 아래 "정할 것" 참고 |
| 라벨은 알약(radius-full) | `Badge` 변형 `label`(색 점 + 이름) |
| 인박스: 왼쪽 목록(기본 560px, 끌어서 조절) + 오른쪽 상세, 휴대폰은 목록만이고 고르면 자기 페이지 | `Resizable` + 라우트(`/notifications/$id`). 휴대폰은 같은 주소가 전체 화면 상세 |

## 4. 코드 구조

```
src/
  app/        진입점, 라우터, 공급자, styles/index.css(토큰·전역)
  pages/      notifications · work-items · schedule … (호호코워크 주소와 같게)
  widgets/    app-shell(사이드바·하단 탭·앱 바), work-item-list 등
  features/   filter-menu, display-menu …
  entities/   work-item, notification, person … (모의 데이터 + TanStack Query)
  shared/
    ui/       shadcn 원본을 고친 부품 + page · filter · inbox 같은 공통 틀
    ui/icon   Solar 아이콘 생성 모듈
    lib/      cn, use-mobile(1024px), density
    config/   paths, nav
```

## 5. 진행 순서와 확인 방법

1. **기초.** 토큰, 글꼴, 글자 크기, 큰 화면 배율, Solar 아이콘, 분기점(1024px), 부품 높이와 모서리.
2. **셸.** 데스크톱 사이드바와 inset, 휴대폰 하단 탭·앱 바·더보기 시트.
3. **페이지 틀.** 머리 줄, 툴바, 뷰 알약, 도구, 필터·표시, 빈 상태, `AdaptivePopover`.
4. **화면.** 호호코워크 플레이그라운드에 있는 것부터: 레이아웃 기본, 업무(리스트·보드·표), 알림함, 일정, 새 업무.
5. **확인.** 단계마다 호호코워크 플레이그라운드(`npx vite --port 4420`, `/playground/frame.html?screen=…`)와 이 앱을 같은 크기(1440, 390)·라이트/다크로 찍어 나란히 비교하고, 크기 차이를 재서 맞춥니다. 규칙 검사 스크립트(`npm run check:ui`)로 FSD 경계·팔레트 색·`space-*`·`style={{}}`를 막습니다.

이미 만든 네 화면(받은함·모든 항목·보드·설정)은 일반 shadcn 화면입니다. 모의 데이터(`entities/*`)는 다시 쓰고, 페이지는 3단계의 틀 위에서 다시 만듭니다.

## 결정

| 날짜 | 결정 | 이유 |
| :--- | :--- | :--- |
| 2026-11-11 | 최종적으로 호호코워크 웹을 shadcn으로 바꾸는 것을 염두에 두고, 호호코워크 화면을 최대한 다 만든다. 호호코워크의 에셋(로고 · 빈 상태 그림 · 기본 아바타 · 앱 아이콘)을 그대로 가져다 쓴다. | 사용자 결정. 처음에는 공개 저장소라 중립 대체물을 쓰기로 했으나, 이 앱이 호호코워크를 대체할 후보가 되면서 같은 자산을 쓰기로 바꿨다. |
| 2026-11-11 | 분기점은 shadcn 기본 768px이 아니라 호호코워크의 1024px(64rem)다. | 휴대폰 화면 구조를 호호코워크와 같게 두기 위해. |
| 2026-11-11 | 아이콘은 lucide 대신 Solar(Linear, 고름은 Bold Duotone)다. | 호호코워크와 같은 모양. |
| 2026-11-12 | 프로젝트 주소는 키가 아닌 고정 이름(slug)을 쓴다. 키를 바꿔도 주소와 프로젝트별 캐시가 그대로다. | 호호코워크는 키를 바꾸면 새 주소로 옮기고 예전 주소도 열어 둔다. 목업은 캐시가 키마다 따로라 고정 이름 하나로 대신했다. 새 업무 번호 앞자리는 처음 키(cowork-21)로 남는다. |
| 2026-11-12 | 라우트에 `validateSearch`를 두지 않고, 페이지가 `useSearch({ strict: false })`를 스스로 검사한다. | 시도했으나 TypeScript 7에서 TanStack Router의 라우트 타입이 `any`로 풀려(`RouteIds`가 아무 글자나 받는다) 타입 이득이 없었다. 모르는 값을 버리는 동작은 `?panel` · `?compose` 같은 다른 값을 지울 위험만 늘린다. TS 7에서 라우터 타입이 살아나면 다시 본다. |
