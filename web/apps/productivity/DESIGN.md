# web/ 디자인 규칙

v2 화면(`web/`)의 모양과 배치 규칙 가운데 cowork에만 해당하는 것과 Webapp 지침과 다른 점을 적는다. 화면은 shadcn/ui(Base UI) + Tailwind CSS v4이고, 컴포넌트는 키트(`src/shared/ui/kit`)에 두고 cowork가 만든 공용 컴포넌트는 `src/shared/ui`에 둔다. 키트는 이 저장소의 코드이며 Webapp 지침이 가리키는 키트 원본이다. 공통 규칙은 Webapp ui-ux 지침이 소유하며, 여기서는 그 `references/` 파일 이름(예: `surfaces.md`)으로 가리킨다. 지침 자체와 다르게 정한 것(리치 본문 글자, 화면 전환 로딩, 되돌리기 토스트)은 [AGENTS.md](../AGENTS.md)의 프로젝트 규칙 표가 소유한다. 사용자가 지적한 것은 고친 뒤 여기에 규칙으로 남긴다.

## 모양을 바꾸는 순서

1. 키트 부품의 props와 변형(Button의 `view` · `view-active` · `tool` · `create`, Badge의 `label` 등)
2. 테마 토큰 `src/app/theme/tailwind.css`(`:root` · `:root[data-theme=dark]`, `@theme`). 색 테마(화면 설정)는 기준 색만 `src/app/theme/color-tokens.ts`가 `html`에 덮어쓰고, 회색 · 선 · 초점 색은 tailwind.css가 기준 색에서 섞어 만든다
3. 키트 부품의 코드(`src/shared/ui/kit`): 키트의 원본이 이 저장소이므로 고친 곳에는 까닭을 주석으로 달고, 그 부품을 쓰는 다른 화면도 함께 확인한다

어느 단계로도 안 되면 꼼수를 쓰지 않고 사용자에게 묻는다.

`npm run check`의 `scripts/check-ui.mjs`가 막는 것은 다음과 같다.

| 범위 | 막는 것 |
| :--- | :--- |
| 모든 파일 | FSD 레이어 위반(아래 레이어가 위를, 같은 레이어의 다른 슬라이스를, 페이지가 옆 주소의 것을 가져다 씀), `lucide-react` import(아이콘은 `@/shared/ui/kit/icon`), `@/shared/lib/utils` import(`cn`은 `cn` 패키지) |
| 화면 파일 | 팔레트 색 클래스(`bg-red-500` …), `space-x/y-*`, `dark:`로 색 덮어쓰기, `style={{}}`(데이터 값이면 같은 줄이나 윗줄에 `// check-ui: allow-style <사유>`), `!important`, 색 값 직접 쓰기, `*.module.css` import |
| 빠지는 파일 | 키트 부품(`shared/ui/kit`), 본문 편집기(`shared/lib/rich-document`, 자기 전역 스타일시트), 테마(`app/theme`)는 화면 파일 규칙에서 빠진다. 색 값 규칙은 코드로 그린 그림과 표식 팔레트(`color-palette/palette.ts`, 서버가 `#RRGGBB`로 저장하는 데이터 색)도 뺀다 |


## 면 단계 (2026-11-04 사용자 결정)

화면의 바탕은 네 단계이고, 안에 놓이는 것은 밖보다 한 단계 위다. 같은 단계를 겹치면 경계가 사라진다(inset의 페이지 카드 안 카드가 그랬다). 공통 기준은 `surfaces.md`, 아래는 지금 코드의 값이다.

| 단계 | 토큰 · 클래스 | 무엇 |
| :--- | :--- | :--- |
| 바닥 | `bg-sidebar` | 사이드바 · Agent 줄이 놓이는 바탕(inset) |
| 페이지 | `bg-background` | 페이지 자체. 표 머리 · 목록 줄처럼 페이지와 하나로 보여야 할 것 |
| 올린 면 | `bg-card` + 가는 테두리 | 페이지 위 묶음: 키트 `Card`(`rounded-xl`, `ring-1 ring-foreground/10`), 댓글 카드(`squircle rounded-xl border`), 칸반 카드(`rounded-lg border`) |
| 뜬 면 | `bg-popover` + `ring-foreground/10` | 팝오버 · 메뉴(`rounded-lg`, `shadow-md`), 대화상자(`rounded-xl`, 배경 막) |

테두리를 두른 상자는 올린 면이므로 바탕을 `bg-card`로 칠한다. 줄을 나누는 선과 split 선, inset 면의 외곽(`shadow-surface`)은 모두 `--border`(글자 13% / 11%)다. `--input`(18% / 16%)은 입력 칸과 걸린 필터 칩의 테두리에 쓴다.

## 앱 바탕 (`src/app`)

| 규칙 | 내용 |
| :--- | :--- |
| 주소 | TanStack Router 파일 라우팅. `src/pages`의 폴더가 곧 주소이고(`app/router/routeTree.gen.ts`가 만들어진다), `page.tsx`가 그 주소의 화면, `route.tsx`가 그 아래 전부에 걸리는 틀(권한 확인 · 먼저 읽기)이다. 로그인한 사람의 주소는 `_app` 아래(주소에 나타나지 않음), 로그인 · 온보딩 · 인쇄는 그 밖. 구역 주소(`/`, `/instance`, `/account`, `/workspace/settings`, `/workspace/projects/{key}/settings`)는 첫 페이지로 보낸다. 관리 구역은 그 역할(`INSTANCE_ADMIN` · `WORKSPACE_ADMIN`)이 있을 때만, 프로젝트 설정은 그 프로젝트의 관리자만(없으면 그 프로젝트 업무로). 모르는 주소는 홈(`/workspace/projects`)으로. 프로젝트 안 페이지는 `/workspace/projects/{key}/(work-items|work-items/{number}|cycles|documents|documents/{id}|members|settings/…)` |
| 업무 이름 | 이 항목은 업무(work items)다. 주소 · 소스(`entities/work-item` · `features/work-item-*` · `pages/_app/workspace/projects/$key/work-items`, `WorkItem…` 이름)와 화면 글은 업무로 쓰고 이슈라 하지 않는다. 서버 API(`/api/v1/issues…`, `/api/v1/issue-views…`)와 스키마 이름(`IssueRow` …)은 서버의 이름 그대로 둔다 |
| 업무 보기 (2026-11-11) | 업무는 프로젝트마다 본다. 전체 업무(`/work-items`)는 주소만 남고 메뉴에 없다. 전역 문서함도 없다: `/documents`는 프로젝트 목록으로, `/documents/{id}`는 그 문서의 프로젝트 주소로 넘긴다 |
| 세션 | `/api/v1/auth/me`(`shared/auth`), 1분마다 다시 읽음. 없으면 `/login`, 어디서든 401이면 로그인으로. 로그인 직후에는 세션을 바로 다시 읽는다(로그인 화면에는 세션을 보는 쿼리가 없어 무효화만으로는 옛 값이 남는다) |
| 요청 | `shared/api`(CSRF 토큰, 오류 문구), 타입은 `npm run api:generate`(서버 `openapi.json`) |
| 개발 서버 | 4420. `/api`를 로컬 서버(8080, `DEV_API_TARGET`으로 바꿈)로 넘긴다. 로컬 서버의 `AUTH_ALLOWED_ORIGINS`에 `http://localhost:4420`이 있어야 명령(로그아웃 등)이 통과한다 |
| 아직 옮기지 않은 화면 | `pages/coming-soon`: 머리 줄과 "옮기는 중" 상태 |
| 큰 화면 | 1920px부터 루트 글자가 커져 2560px에서 19px(`spacing.md`). `app/theme/tailwind.css`의 `html` 규칙(같은 값이 `app/styles/index.css`에도 있다). 크기는 rem으로 쓰고, 확인은 `scripts/scale-check.js`(1600px와 2560px에서 재어 안 커진 것을 보임) |
| 스크롤바 | 앱의 가는 스크롤바(8px, 트랙 없음, 평소 옅고 가리키면 진해짐), 가로 · 세로 모두. `app/styles/scrollbar.css` |
| 모양 설정 | 화면 설정(`/profile/display`)의 색상 테마(stone과 6종) · 모드 · 레이아웃(inset · split) · 목록 높이 · 글꼴(고딕 · 명조와 명조 적용 범위)은 `shared/lib/appearance`(localStorage `cowork-appearance`)에 둔다: 고르면 바로 바뀌고 이 브라우저에만 남는다. 목록 높이 촘촘하게는 `html[data-density=compact]`이고 화면은 `compact:` 변형으로 줄 높이를 줄인다(업무 리스트 · 테이블, 프로젝트 목록, 알림함 줄) |

## 앱 셸 (`app/layout/AppFrame`, `shared/ui/kit/layout/app-shell`)

생성 양식 · 공통 다이얼로그 · Split · Inset · 라우트 마스킹은 Webapp ui-ux 지침과 [제품 구현 경로](../.agents/skills/cowork-runtime/SKILL.md)에서 사용 기준과 제품 구현을 함께 찾는다. 셸의 공통 구조는 `app-layout.md`를 따른다. 새 화면은 해당 구현을 사용하고 실제 제품 화면에서 검증한다.

| 규칙 | 내용 |
| :--- | :--- |
| 바탕 | 키트 `AppShell`(shadcn Sidebar 위)에 `AppFrame`이 메뉴 데이터(`shared/config/nav.ts`) · 로고 · 내 메뉴 · Agent 줄 · 휴대폰 도구를 넘긴다 |
| 사이드바 폭 | 처음과 펼칠 때 340px, 가장자리를 끌어 220~380px. 저장하지 않고, 접었다 펼치면 다시 340px. Ctrl/⌘+B로도 접는다 |
| Agent 줄 | 데스크톱 본문 아래 40px 줄(`AgentBar`): 앞에 장식 바코드, 끝에 Agent 버튼(`ghost`, 보조 글자색, 내 AI 에이전트로). inset이면 면 바깥, split이면 본문 아래. 휴대폰에는 없다 |
| 사이드바 머리 | 첫 줄 왼쪽에 워드마크(`BrandLogo`: 펼치면 cowork 워드마크 SVG 10rem, 접으면 정사각 심벌 `BrandMark`), 오른쪽 끝에 검색 아이콘(`ghost`). 로고를 누르면 전사 일정(`/schedule`)으로 간다. 그 아래 내 박스(`MeBox`: 32px 아바타 · 이름 · 소속, 오른쪽 …)가 내 메뉴(내 정보 · 화면 설정 · 내 AI 에이전트 · 로그아웃)를 연다. 접으면 심볼 · 검색 · 아바타를 세로로 쌓는다. 아바타 그림이 없으면 cowork 기본 그림(`shared/lib/avatar`의 18종) |
| 사이드바 바닥 | 설정 버튼은 두지 않는다. 펼쳤을 때 왼쪽에 릴리스(v2.6.0-rc.2), 오른쪽 끝에 접기(`ChevronsLeftIcon`). 접으면 릴리스를 숨기고 펼치기(`ChevronsRightIcon`)만 |
| 메뉴 모양 | 항목은 28px, 10px 초타원(`squircle rounded-[0.625rem]`). 호버 · 선택 바탕이 항목 자체에 칠해져 같은 곡선이다 |
| 메뉴 구역 | 사이드바(휴대폰 더보기도)는 주소가 속한 구역의 메뉴 하나를 보인다(`spaceOf`): 메인, 내 계정(`/profile/*`, 내 메뉴에서), 인스턴스 관리 · 오피스 관리 · 프로젝트 관리(역할이 있는 것만), 프로젝트(업무 · 사이클 · 문서 · 멤버, `PROJECTS_ADMIN`이면 관리 아래 일반 · 워크플로 · 사이클 · 저장소 연동). 메인이 아닌 구역은 맨 위에 ←와 구역 이름(프로젝트는 프로젝트 이름, ←는 프로젝트 목록으로; 나머지는 홈으로). 접으면 ←만 |
| 메뉴 순서 | 알림함(묶음 제목 없음), 워크스페이스(일정 · 주간보고 · 구성원 · 프로젝트), 더보기(근태 · 휴가 · 회의록 · 공지사항), 관리(역할별 관리 구역). 프로젝트 아래에는 별표한 활성 프로젝트를 그 표식으로 둔다. 하위 메뉴는 처음에 펼치고(`openGroups="all"`) 사용자가 접을 수 있다. 별도 개선의견 메뉴와 시범 화면은 두지 않는다 |
| 알림함 강조 | 읽지 않은 알림이나 내 결재 대기가 있으면 알림함 아이콘을 노랑(`text-mark-medium`)으로 은은하게 깜빡이고, 결재 대기 수를 메뉴 배지로 보인다. 휴대폰은 앱 바의 알림함 아이콘이 같다 |
| 전역 검색 | 사이드바 머리의 돋보기 · 휴대폰 앱 바의 돋보기 · Ctrl/⌘+K로 연다. 데스크톱은 화면 위 12%에서 뜨는 대화상자(Linear 명령 메뉴처럼 맨 위에 테두리 없는 검색어 칸, 아래 결과, 바닥에 ↑ ↓ · Enter · Esc), 휴대폰과 새로고침 · 링크는 `/search` 페이지. 검색어는 200ms 멈춘 뒤 찾고, 찾는 동안 이전 결과를 두며 칸 끝에 작은 스피너. 비었을 때는 최근 검색(이 브라우저, 6개, 하나씩 · 모두 지우기)과 바로 가기, 결과가 없으면 `PageState` 검색 그림. 결과는 출처별 묶음(`SearchSource`): 지금은 페이지(메뉴 이름 · 위치로), 업무 · 문서 · 공지 · 사람은 서버 검색이 생기면 같은 자리에 출처로 더한다 |
| 휴대폰 화면 구조 (2026-11-04 사용자 결정) | 목록 같은 상위 페이지: 현재 제목과 위 단계 이동을 담은 앱 바 · 필요한 경우에만 툴바, 아래에 하단 탭. 만들기 FAB는 동작이 하나면 바로 실행하는 +, 둘 이상이면 같은 FAB가 바텀시트로 선택지를 연다. 상세 · 양식 페이지: 전체 화면(하단 탭 없음), 맨 위에 ←(그 옆 제목은 화면에 따라; 전역 검색은 ← 옆 검색칸), 양식의 동작은 하단 고정 줄, 속성 알약은 바닥 줄 바로 위의 별도 영역에 고정하고 좁으면 다음 줄로 넘긴다 |
| 휴대폰 | 64rem(1024px) 미만(`MOBILE_QUERY`, CSS `md:`)에서 사이드바 대신 하단 탭(`MobileTabBar`). 메인은 일정 · 주간보고 · 구성원 · 프로젝트(`TABS`)와 더보기, 다른 구역은 그 메뉴의 앞 네 곳과 더보기. 알림함은 탭이 아니라 앱 바에 있다. 더보기는 탭에 없는 메뉴를 바텀시트 한 목록으로 보이고(권한이 있는 항목과 하위 항목 포함), 고르면 시트를 닫고 이동한다 |
| 휴대폰 앱 바 | 일반 화면 맨 위 60px 이상 줄(`Page`의 앱 바): 위 단계가 있으면 44px ←, 현재 페이지 이름(한 줄 말줄임), 페이지 메뉴, 오른쪽에 공통 도구(검색 · 알림함 · 내 아바타). 공통 도구는 `AppShell`이 `PageChromeProvider`로 넘긴다. 전체 화면 페이지는 공통 도구 없이 ← · 이름 · 페이지 메뉴만 |
| 사람 아바타 | 사람을 보여 주는 아바타(작성자 · 담당자 · 보낸 이 · 결재선 · 참석자 · 읽은 사람)는 `shared/ui/person`의 `PersonAvatar`(원형): 누르면 그 사람의 프로필(`/members/{id}`; 데스크톱은 보던 페이지 위 대화상자, 휴대폰 · 새로고침은 페이지). 링크인 줄 안에서도 아바타는 프로필로 간다. 고르기용 아바타(담당자 고르기 · 필터의 선택지)와 프로필 자체의 아바타는 `isStatic`. 활동에서는 사용자 아바타 다음에 에이전트 아바타를 겹친다. 셸의 내 아바타만 32px 초타원이다 |
| 사람 아닌 보낸 이 | 시스템 알림처럼 사람이 아닌 보낸 이는 같은 자리의 둥근 회색 칸에 회사 심볼(`BrandMark`) |
| 마크 피커 | 뷰 · 프로젝트의 아이콘과 색은 `shared/ui/mark-picker`의 `MarkPicker`(BIT의 피커): 검색(영어 이름 · 한글 단어), 16색 팔레트(`color-palette/palette.ts`의 `PALETTE`), 자주 쓰는 아이콘, Solar 전체(처음 열 때 `virtual:solar-set`로 따로 불러옴). 데스크톱 팝오버, 휴대폰 바텀시트 |
| 팝오버 · 메뉴 | 곁에 여는 것은 키트 `AdaptivePopover`(`composed-components.md`). `shared/ui/popup`의 `AdaptivePopover`는 옛 API(`label` · `content(close)` · `width`)를 키트 것에 잇는다. … 메뉴는 키트 `ActionMenu`, 줄 끝은 `RowMenu`(`size="row"`). 모든 항목에 아이콘을 둔다. 메뉴 줄은 데스크톱 36px · 16px 아이콘, 휴대폰 48px · 20px 아이콘, 팝오버 안쪽 6px, 시트는 좌우 12px · 아래 20px |
| 아이콘 | 화면은 `@/shared/ui/kit/icon`의 lucide 식 이름(`SearchIcon` …)과 `chosen`을 쓴다(`icons.md`, `npm run icons:ui`). 서버가 저장하는 의미 이름(프로젝트 · 라벨 · 뷰의 표식, 메뉴 데이터)은 `@/shared/ui/icons`의 `solarIcon(name)`(`npm run icons:generate`) |

## 페이지 (`shared/ui/kit/layout/page`)

머리 줄 · 툴바 · 본문의 배치는 `layout-patterns.md`, 검색 · 필터 · 표시 도구는 `search-filter.md`를 따른다. 키트 `Page`가 머리 줄(데스크톱 52px, 경로 · 동작 · 만들기), 툴바(뷰 · 탭이 있을 때 44px, 휴대폰 60px 이상), `below`(걸린 필터 줄), 점 무늬 본문(`bg-dots`), `footer`를 묶는다. 페이지는 경로 · 뷰 · 도구 · 만들기만 넘긴다.

| 규칙 | 내용 |
| :--- | :--- |
| 툴바 | 왼쪽 뷰 · 탭은 자기 영역에서 가로로 넘기고(스크롤바 숨김) 페이지는 넘치지 않는다. 오른쪽 도구는 고정 |
| 도구 | 검색(`SearchTool`) · 필터(`FilterMenu`) · 표시(`DisplayMenu`)는 Button `tool` 변형의 둥근 버튼(휴대폰 44px). 켜지면 `view-active`와 Bold Duotone, 걸렸거나 기본과 다르면 모서리 점(`ToolDot`). 걸린 필터는 데스크톱 `FilterBar`(40px 줄), 휴대폰 `FilterChips` |
| 바닥 동작 줄 | 여러 칸 양식 · 상세의 동작은 `Page footer`: 본문 스크롤 밖 맨 아래에 고정. 데스크톱은 오른쪽 끝에 모으고, 휴대폰은 44px 단추(88px 이상)에 마지막 단추가 남은 폭을 채운다 |
| 만들기 | Button `create` 변형: 10px 초타원, 600 굵기, 강조색의 은은한 발광 그림자. 머리 줄의 만들기와 휴대폰 FAB(56px). 양식의 제출은 둥근 기본 버튼, 취소는 `ghost` |
| 페이지 안내 | 페이지 전체의 처리 상태 · 오류는 `layout-patterns.md`의 배너 줄 자리에 키트 `Alert`로 둔다(전용 배너 부품은 없다). 입력 항목의 오류와 본문 안내는 해당 내용 곁에 둔다 |
| 빈 · 오류 화면 | `PageState`(BIT의 상태 화면, `data-states.md`): 펜 선 풍경 그림 넷 종류 × 3장 — 빈 화면(`empty`), 검색 결과 없음(`search`), 찾을 수 없음(`not-found`, 404), 불러오지 못함(`error`, 500). 화면이 뜰 때 3장 중 하나를 무작위로. 메시지는 0.42초 동안 6px 아래에서 떠오르고, 받아야 하는 그림은 도착하면 0.6초에 걸쳐 나타난다(본 그림은 바로). 메시지는 창 높이의 32%에서 시작해 페이지를 옮겨도 같은 높이(방이 좁으면 그 안에서 가장 낮게, 패널 · 대화상자는 `isCompact`로 위에). 그림의 선은 `--icon-muted`, 파란 표시는 `--illustration-accent`. 제목 1.125rem · 500을 그림과 같은 잉크로, 설명은 한 단계 연하게(`text-state-description`, 최대 28rem) — 글자가 그림보다 진하지 않게. 화면 한 칸을 채우는 빈 자리(페이지 · 인박스 오른쪽)에만 쓰고, 설정 카드 안의 한 줄 · 작은 패널 속 안내는 글로 둔다 |
| List-Detail (목록-상세 분할) | 알림함(전체 · 결재 · 공지 · 일정) · 공지사항 · 회의록은 `shared/ui/kit/layout/split-view`의 `SplitView`. 데스크톱은 페이지의 머리 줄 · 툴바 · 걸린 필터가 왼쪽 목록 칸(따로 스크롤, 구분선을 끌거나 키보드로 560~720px, 처음은 560px이고 바꾼 너비는 이 브라우저에 남음, 최대 58%) 위에만 있고, 오른쪽 고른 항목 줄(`SplitDetail`, 머리 줄과 같은 52px · 같은 선)이 그 머리 줄과 나란하다. 줄 왼쪽에 고른 것을 푸는 꺾쇠(‹)와 무엇인지(결재 · 공지사항 · HOH-12), 오른쪽에 그 메뉴와 "페이지로 열기"(`OpenPageButton`), 내용은 그 아래에서 스크롤. 고르기 전 오른쪽은 점 무늬 위에 편지가 담긴 알림함 그림(`InboxIllustration`)과 선택 안내. 목록이 비거나 오류면 왼쪽에 해당 `PageState`. 고른 항목은 주소에 실린다(`/notifications/{id}`, `/approvals/{id}`; 목록 주소와 한 페이지라 목록 · 필터가 그대로). 신청의 단독 페이지는 `/requests/{id}`. 휴대폰은 목록만, 고르면 그 항목의 페이지(머리 줄에 메뉴와 "페이지로 열기"). 알림의 상세는 알림이 가리키는 것(신청 · 공지 · 일정 · 업무)을 그 자리에 보이고, 그 밖이나 사라진 대상은 알림 자체 |

## 관리 페이지 (오피스 관리 · 인스턴스 · 프로젝트 관리)

| 규칙 | 내용 |
| :--- | :--- |
| 목록 | `Page`의 도구에 검색 · 필터 · 표시, 데스크톱은 키트 `Table`, 휴대폰은 줄 목록. 만들기는 `Page create`. 목록 아래 "N명 중 M명"과 더 보기(`ListMore`). 검색어 · 필터 · 표시는 주소에 둔다(`shared/lib/list-address`의 `useAddressWords`(`q`, 300ms 뒤) · `useAddressFilters`(키마다 쉼표) · `useAddressChoices`): 기록을 쌓지 않고 주소를 고쳐, ←로 돌아오거나 주소를 넘겨도 같은 목록이 보인다 |
| 상세 | 줄은 `DetailLink`로 연다: 데스크톱은 목록 위 60rem 대화상자, 휴대폰 · 새로고침은 자기 페이지. 상세 · 양식은 설정 열(제목 · 한 줄 · `SettingsSection`)이고 동작은 페이지의 바닥 줄, 대화상자에서는 그 끝에 둔다(각 관리 페이지의 `AdminSurface`) |
| 사람 고르기 · 강제 취소 | 이름으로 사람을 고르는 칸은 `PersonSearch`(`features/approval-line-editor`), 구성원 신청을 관리자가 닫는 것은 `AdminCancelDialog`(`features/admin-cancel`, 사유 필수) |
| 행의 동작 | 줄 끝의 …(`RowMenu`): 수정 · 삭제 |
| 기록 열어 보기 | 줄이 연 기록(활동 · 오류 · 구성원별 알림)은 목록 옆 `WithPanel`(`shared/ui/kit/side-panel`), 사실은 `Facts`(이름과 값). 수치 타일 · 차트는 올린 면, 막대 · 선은 SVG로 그리고 색은 업무 표식 토큰(`fill-mark-*` · `stroke-mark-*`)을 쓴다 |
| 순서 바꾸기 (2026-11-04 사용자 결정) | 순서가 있는 줄은 모두 BIT의 `useRowReorder`(`shared/lib/row-reorder`, 키트 `shared/ui/kit/reorder`)로만 바꾼다: 줄 앞 손잡이(`GripIcon`)를 끌면 줄이 들리고, 제자리는 점선 빈칸, 다른 줄이 비켜 미끄러지며, 목록 끝에서는 저절로 스크롤, 놓으면 빈칸으로 내려앉는다. Esc는 취소, 손잡이에서 Alt + ↑ / ↓로도 옮기고 단계마다 읽어 준다. 새 순서는 바로 보내고 실패하면 되돌린다. 표 대신 올린 면 위 줄 목록(데스크톱은 열 머리 줄을 위에)으로 그린다. 트리(조직)는 부모마다 목록 하나라 같은 부모 안에서만 옮기고 하위가 함께 들린다. 위로 · 아래로 메뉴는 두지 않는다 |
| 짧은 양식 · 확인 | 몇 칸짜리 추가 · 수정 · 변경은 `FormDialog`, 되돌릴 수 없는 일은 `ConfirmDialog`. 쓰는 사람이 있어 삭제를 막을 때는 `ConfirmDialog`를 동작 없이 열어 까닭과 '확인'만 둔다. 제목 · 본문이 있는 것은 `ComposeSurface` |

## 설정 페이지 (`shared/ui/kit/settings`)

내 계정 · 관리 구역처럼 값을 보고 정하는 페이지는 목록 페이지가 아니라 설정 페이지 레이아웃(`layout-patterns.md`의 설정)을 쓴다.

| 규칙 | 내용 |
| :--- | :--- |
| 틀 | `SettingsPage`(머리 줄 + `SettingsBody`): 가운데 한 열(최대 720px, 위아래 40px · 휴대폰 24px, 좌우 16px). 맨 위에 제목(24px, 이 페이지의 h1)과 한 줄 설명. `Page`를 따로 그리는 곳(프로젝트 설정)은 `SettingsBody`만 |
| 묶음 · 줄 | `SettingsSection`: 작은 이름(보조 글자색 · 500, 끝에 묶음의 동작), 아래 `Card` 안 `FieldGroup`(줄 사이에만 선, `divide-y`), 필요하면 카드 아래 메모. `SettingsRow`: 이름과 설명, 끝에 값이나 컨트롤(44px 이상, 안쪽 12px). 값이 없으면 `-`. 넓은 컨트롤은 `wide`로 좁을 때 이름 아래로 내린다 |
| 대화상자 | 짧은 양식은 `FormDialog`(데스크톱은 화면 가운데 최대 27.5rem 대화상자, 안쪽 16px; 휴대폰은 바텀시트), 확인은 `ConfirmDialog`. 상세(`DetailSurface`) · 작성(`ComposeSurface`) · 전역 검색 대화상자는 화면 위 12dvh(검색은 12%)에서 열고 최대 76dvh, 넘치면 본문만 스크롤한다. 공통 기준은 `dialog.md` |
| 만들기 양식 | 제목 · 본문이 있는 것의 만들기 · 고치기(업무, 일정, 공지, 회의록, 주간보고, 문서, 프로젝트)는 `shared/ui/kit/compose`의 `ComposeSurface`(`creation-form.md`). 제목은 테두리 없는 큰 글씨(`ComposeTitle`), 본문은 `DraftBody`(`RichDraft`; Markdown으로 저장하는 본문도 같은 편집기를 쓰고 저장할 때 바꾼다), 그 아래 속성 알약(`PropertyPill` · `OptionPill` · `DatePill` · `EventTimePill`; 24px, 휴대폰 44px). 표식이 있는 것(문서 · 프로젝트)은 제목 앞에 `MarkPicker`. 데스크톱 대화상자는 최대 45rem(머리에 놓일 곳 칩 · 이름 · 크게 보기 · 닫기, 바닥에 만들기, Ctrl/⌘+Enter), 데스크톱 페이지는 45rem 열 끝에 취소 · 만들기, 휴대폰은 늘 페이지. 고치기는 '저장', 반복 일정은 저장할 때 적용 범위를 묻는다. 계속 만들기는 지금 어느 양식에도 두지 않는다 |
| Routed Modal (목록 위 대화상자) | 만들기 · 고치기 양식과 상세는 자기 주소(`/work-items/new`, `/projects/{key}/work-items/new`, `/schedule/events/new`, `/schedule/events/{id}/edit`, `/announcements/new`, `/announcements/{id}/edit`, `/weekly-reports/write/{월요일}` …)의 페이지이면서, 데스크톱에서 목록의 버튼으로 열면 그 목록 위 대화상자다(`shared/lib/panel`의 `useOpenPanel`, `route-masking.md`; 라우터 `unmaskOnReload`). 대화상자는 앱 바탕의 `PanelHost`가 그린다. 자기 페이지가 없는 짧은 양식(새 문서, 새 프로젝트)은 대화상자로만(크게 보기 없음) |

## 뷰와 탭

| 규칙 | 내용 |
| :--- | :--- |
| 뷰 | 저장한 보기(`shared/ui/views`의 `ViewBar`): 알약마다 표식(아이콘 · 색)과 이름, 지금 뷰는 한 단계 진한 알약. 알약 뒤 … 하나에 현재 조건을 새 뷰로 저장 · 지금 뷰 편집 · 순서 편집(손잡이로 끄는 대화상자, `ViewOrderDialog`) · 삭제(먼저 묻는다). 만들기 · 편집은 `ViewEditor`(`FormDialog`: 표식 · 이름 · 나만 보기). 보기 방식은 뷰가 아니라 표시 메뉴가 정한다 |
| 탭 | 관리가 없는 고정된 나눔(`PageViews`): 일정의 월간 · 주간처럼. 휴대폰에서 옆 도구가 자리를 차지하면 `isCompact`로 아이콘만 |

## 입력 부품 (2026-11-04 사용자 결정)

| 규칙 | 내용 |
| :--- | :--- |
| 선택 목록 | 메뉴 · 알약 · 양식 안의 고르기는 키트 `OptionList`(cmdk `Command`): 데스크톱 32px 줄, 휴대폰 48px 줄 · 15px 글자 · 20px 아이콘. `isSearchable`이면 맨 위 검색 칸에 초점이 가고 입력한 말로 거른다. 선택지는 모두 그린다. 서버에서 찾는 사람 고르기(결재자 추가, `PersonSearch`)만 처음 8명, 입력하면 최대 50명을 보인다 |
| 날짜 | 기기와 상관없이 키트 `DateCalendar` · `DatePicker`(`shared/ui/kit/date-picker`, react-day-picker, 일요일 시작)를 쓴다. 브라우저 기본 날짜 선택기를 섞지 않는다 |

## 상세 페이지 (`shared/ui/kit/reading`의 `DetailLayout`)

리치 본문을 가진 것(업무 · 일정 · 회의록 · 공지사항 · 주간보고 · 문서)의 상세는 한 모양이다(Linear 이슈, `layout-patterns.md`의 상세). 읽기 단 45rem, 자기 폭 60rem 이상이면 오른쪽 16rem 속성 칸, 좁으면 제목과 본문 사이의 한 줄 알약이다. 제목은 2rem 굵게이고 이 페이지의 h1이다. 읽기만 하는 속성은 `InfoPill`. 본문 도구는 본문 위가 아니라 페이지 머리 줄 끝에 둔다(`BodyToolsContext`의 `slot`에 `RichBody`가 넣는다): 데스크톱은 댓글 추가 · 버전 기록 · 편집(모두 `tool` 아이콘 버튼). 휴대폰은 편집(연필)만 머리에 두고, 버전 기록은 페이지 메뉴(…)로(`setMenuActions`), 고치는 동안의 저장 · 완료는 바닥 줄(`foot`)로. 본문 글꼴은 화면 설정이 정한다.

상세는 읽는 화면이다(2026-11-10). 편집 단추는 본문을 제자리에서 열지 않고 수정 화면(상세 주소 뒤의 `/edit`, 업무 · 문서마다 그 수정 페이지)으로 간다. 수정 화면은 제목과 본문만 두어 고치는 데 집중하고, 데스크톱은 머리 줄의 저장 상태 · 저장 · 취소 · 완료, 휴대폰은 바닥 줄의 저장 · 완료와 앱 바 ←(취소)로 끝낸다. 제목은 만들기 양식처럼 테두리 없는 큰 글씨로 고치고(`BodyTitle`), 저장 · Ctrl/⌘+S · 완료가 제목과 본문을 함께 저장한다(업무와 문서). 두 화면을 오갈 때 제목은 제자리에서 이어지고(`view-transition-name: cowork-body-title`) 나머지는 교차 페이드한다.

활동(2026-11-04 사용자 결정, `shared/ui/activity`의 `ActivityFeed`, `composed-components.md`의 활동 · 댓글 피드): 리치 본문을 가진 것은 본문 아래에 활동을 둔다. 변경 기록과 댓글을 오래된 것부터 세로선 하나에 잇는다: 변경은 선 위의 아이콘과 한 문장, 댓글은 선을 덮는 카드(12px 초타원 테두리). 답글은 한 단계. 댓글 입력은 `CommentComposer`(Enter 보내기, Shift+Enter 줄바꿈), 고치기도 같은 입력칸. 키트의 것과 달리 에이전트 · 자동 실행자(Git 연동)와 해결한 블록 스레드를 다룬다.

블록 댓글(2026-11-11 사용자 결정, `shared/ui/rich-body/block-comments.tsx`): 댓글은 주인의 활동 기록에 있고, 스레드의 첫 댓글이 본문 블록 하나에 달린다. 데스크톱 읽기 화면에서 댓글 추가(`tool`)를 켜면 포인터 아래 블록에 상자가 씌워지고, 누르면 그 블록 아래에 스레드 창(없으면 새 댓글)이 열린다. 열린 스레드가 있는 블록은 글을 조금 옅게 하고 노란 점선 밑줄을 긋는다. 해결한 스레드는 본문에 표시하지 않고 활동에만 남는다. 활동에서 블록 댓글이나 옛 인용 댓글을 누르면 본문의 그 자리로 가고, 없으면 바뀌었거나 지워졌다고 알린다(`useRevealQuote`). 휴대폰에는 댓글 추가가 없다.

## 본문 뷰

| 뷰 | 데스크톱 | 휴대폰 |
| :--- | :--- | :--- |
| 리스트 (`work-item-list/list-view`) | 표시의 그룹대로 묶음(`ListGroupHeader`: 접기 · 이름 · 개수), 그룹 없음이면 한 목록. 줄 높이는 목록 높이 설정을 따른다 | 같은 줄을 줄여서 |
| 테이블 (`work-item-list/table-view`) | 키트 `Table`(줄 49px, 촘촘하게 41px), 선택 열, 머리 고정, 바뀐 날 · 마감은 오른쪽 · 고정폭 숫자 | 표 대신 리스트 줄 |
| 칸반 (`work-item-list/kanban-view`) | 상태별 288px 열(`bg-band`), 열 머리(40px)는 고정하고 카드 영역만 남은 높이에서 넘긴다. 보드만 가로로 넘긴다 | 열 하나가 85%, 열 단위로 멈춤 |
| 타임라인 (`work-item-list/timeline-view`) | 업무마다 한 줄, 시작 ~ 마감의 계획 막대와 실제로 진행한 날. 일 · 주 · 월, 오늘 표시, 막대를 끌어 날을 옮긴다 | — |
| 월간 (`calendar-board/month-view`) | 6주 격자(일요일 시작), 여섯 주를 같은 높이로 나누고 들어가는 일정만 그린 뒤 넘치면 "+N 더보기"(좁으면 날짜 줄에). 일요일 · 공휴일은 `text-day-off`, 토요일은 `text-saturday`, 오늘 칸은 옅은 파랑 빗금(`TODAY_HATCH`). 요일과 날짜는 열의 왼쪽 시작점에 맞춘다 | 작은 격자(날짜는 가운데), 고른 날의 일정은 격자 아래 목록(`DayAgenda`, 공휴일 이름) |
| 주간 (`calendar-board/week-view`) | 7일 열, 종일 줄, 08–20시 격자, 겹치면 나란히, 오늘에 지금 선 | 요일 칩(`DayChips`) + 하루 열 |
| 매뉴얼 (`manual-view`) | 왼쪽 목차(스크롤 따라감), 가운데 720px 문서. 지금 이 위젯을 쓰는 페이지는 없다 | 한 단, "지금 절" 알약이 바텀시트를 연다 |

일정 분류 색(`--event-*`)과 휴일 · 토요일 색(`--day-off` · `--saturday`)은 데이터 색이라 테마 파일에 따로 둔다.

## 작성 양식의 입력과 단계

제목과 본문은 `ComposeSurface`의 종이 위에 둔다. 모든 본문과 주간보고의 세 단계에는 `RichDraft`를 쓴다. 반려 사유처럼 짧은 글은 `FormDialog` 안의 `Textarea`로 받는다. 리치에디터 하단의 상시 도구 · 안내 줄은 두지 않는다. 블록은 / 메뉴, 서식은 글 선택 도구로 편집한다. 상태 · 날짜 · 시간 · 프로젝트 · 첨부는 값을 요약하는 속성 알약으로 모은다. 실제 입력은 데스크톱 팝오버와 휴대폰 바텀시트에 둔다. 첨부는 `FileDropzone`으로 파일 선택과 끌어 놓기를 함께 받고, 고른 파일의 이름 · 상태와 제거를 같은 곳에 보인다.

단계는 서로 다른 내용을 작성하거나 앞 단계의 값으로 다음 내용을 확인할 때 둔다. 주간보고는 금주 주간보고, 차주 주간계획, 비고를 차례로 작성하고(단계 알약을 누르면 그 단계로) 단계 사이에 입력을 보존한다. 휴가 · 연장근무 신청은 기간과 사용량 확인, 결재선, 제출 전 검토를 구분한다. 기간 달력처럼 잔여 일수와 함께 봐야 하는 주요 입력은 단계 본문에 두며, 사건일 · 관계 · 증빙 같은 보조 속성은 알약으로 연다.

새 업무의 본문 첨부도 기존 본문과 같은 업로드 API를 쓴다. 작성 중에는 로컬 미리보기를 보여 주고 저장 시 attachment 참조로 바꿔 현재 본문에 남은 파일만 연결한다. 업로드 대기 · 실패 항목이 남아 있으면 만들기를 막으며 취소나 재시도로 해소할 수 있다. 업무 생성 뒤 본문 저장이 실패하면 같은 업무의 본문 저장만 재시도하여 업무를 중복 생성하지 않는다.

## 업무 표식과 목록

우선순위 없음은 짧은 가로선 세 개, 낮음 · 보통 · 높음은 활성 막대가 하나씩 늘어나는 세 막대, 긴급은 Solar siren으로 표시한다(`entities/work-item`의 `WorkItemMarks`). 각 단계의 파랑 · 노랑 · 주황 · 빨강은 테마의 업무 표식 토큰(`--mark-low` · `--mark-medium` · `--mark-high` · `--mark-urgent`)으로 정하며 없음은 보조 아이콘색을 쓴다. 색에만 의존하지 않고 모양과 접근 가능한 이름으로도 구분한다.

담당자 칸은 지정 여부와 관계없이 같은 1.25rem 정사각형이다. 지정된 원형 아바타와 미지정의 원형 점선 사용자 아이콘은 모두 20px로 가운데 놓으며, 다른 줄의 값 때문에 간격이 달라지지 않는다. 담당자 · 작성자 열은 아바타와 이름을 함께 두고 이름은 보조 글자 크기로 쓴다.

- 업무의 선택 뷰는 `view` 쿼리로 보존한다. 뷰 전환은 방문 기록에 남기고, 필터 · 정렬 · 그룹의 임시 변경은 현재 주소를 고친다. 필터를 모두 지운 상태도 명시적으로 복원한다.
- 저장할 수 있는 뷰가 달라지면 도구 모음에서 `뷰에 저장`을 제공한다. 마지막 필터를 지워도 사라지지 않는다.
- 업무 목록은 현재 그룹 · 조회 범위 안에서 부모 아래에 하위를 배치한다. 부모가 조회 밖에 있으면 하위라는 표시를 남기고 그 줄을 유지한다. 부모의 접기는 현재 묶음의 자식만 숨긴다. 휴대폰은 들여쓰기를 줄인다.
- 칸반 카드는 `rounded-lg border bg-card`에 옅은 그림자(`shadow-xs`)를 두고, 가리키면 `bg-row-hover`다.

프로젝트 문서(`/projects/{key}/documents`, `pages/documents`의 `ProjectLibrary`)는 툴바 왼쪽에 뷰(전체 문서와 저장한 뷰), 오른쪽에 검색 · 문서 라벨 필터 · 표시(보기: 그리드 · 리스트, 정렬: 사용자 지정 · 제목 · 수정일 · 작성일, 방향), 머리 줄 끝에 새 문서를 둔다. 조건은 주소에 남는다. 문서를 열면 하위 페이지가 있을 때 왼쪽에 페이지 목차(`DocumentSideNav`, 접은 상태를 이 브라우저에 기억)와 본문 끝의 이전 · 다음 페이지를 둔다. 휴대폰 목차는 바텀시트다.

최초 프로젝트 참여 때 별표를 추가하고, 이후 수동 해제는 중복 추가나 재참여로 되살리지 않는다. 메뉴에는 조회할 수 있는 활성 프로젝트 중 별표한 것만 보인다.

## 설정 필드와 화면 전환

- 프로젝트 일반의 기본정보 줄은 표식(`MarkPicker`)과 이름 입력칸을 한 줄에 가운데 정렬하고, 이름이 남은 너비를 쓴다. 긴 설명은 줄 높이를 늘리고 입력 오류는 해당 입력 아래에 둔다.
- 묶어 저장하는 양식은 페이지의 변경 저장 · 되돌리기를 유지한다. 보기 좋은 줄을 만들기 위해 즉시 저장으로 바꾸지 않는다.
- 첫 진입만 첫 방문 덮개(로켓, `app/BootCover`)가 덮는다. 이후 화면 이동은 [AGENTS.md](../AGENTS.md)의 화면 전환 로딩 규칙을 따른다: 가리는 판 없이 캐시가 있으면 바로 그리고, 없으면 150ms 뒤 콘텐츠 카드 위 2px 진행 표시(`app/router/RouteStage`, 최소 300ms), 준비된 화면끼리는 콘텐츠 영역만 200ms 교차 페이드(`cowork-content`). 탐색 메뉴는 계속 쓸 수 있다.
- 탭 · 필터 변경, 추가 페이지, 백그라운드 조회의 대기와 오류는 해당 영역에서 처리한다. 움직임 줄이기를 선택하면 교차 페이드와 진행 표시의 흐름을 생략한다.
- 키보드 초점은 키트 부품의 shadcn 기본(`focus-visible:ring-3 ring-ring/50`, 바깥 3px)이고, 직접 그린 단추는 `focus-visible:ring-2 ring-ring`을 쓴다.
