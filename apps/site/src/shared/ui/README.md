# workspace 키트

키트를 shadcn/ui(Base UI, `base-nova`)와 Tailwind CSS v4로 옮기는 중이다. 새 키트는 이 폴더 바로 아래와 `src/shared/lib`에 있고, 옛 Astryx 키트(`foundations` · `composites` · `layouts` · `patterns`)는 화면을 모두 옮긴 뒤 지운다.

## shadcn 키트

`apps/demo`에서 다듬은 공통 부품 가운데 특정 제품의 업무에 묶이지 않은 것을 옮겼다. 동작은 demo와 같고, 다크 모드만 사이트에 맞춰 `html[data-theme=dark]`로 읽는다(`.dark` 클래스를 쓰지 않는다).

| 위치 | 담는 것 |
| --- | --- |
| `*.tsx`(바로 아래) | shadcn 부품(우리가 고침: button의 view · tool · create, badge의 label, sidebar · input · textarea · select의 크기)과 공통 부품(adaptive-popover, action-menu, option-list, confirm-dialog, form-dialog, detail-surface, date-picker, property-pill · info-pill, display-menu, list-group-header, pane-resize-handle, segmented-control, row-link, person-avatar, search-tool) |
| `icon/` | lucide와 같은 이름으로 부르는 Solar 아이콘. `npm run icons:ui`가 `scripts/generate-ui-icons.mjs`의 이름표로 `icons.generated.ts`를 만든다 |
| `page/` · `settings/` · `compose/` · `filter/` · `page-state/` · `reading/` | 페이지 틀, 설정 화면, 만들기 양식, 필터, 상태 화면(풍경 그림 webp), 읽기 상세 |
| `../lib/` | `useIsMobile`, `appearance`(모드 · 목록 높이), `useStoredWidth`, `toggleValue`, `panel`(목록 위 대화상자), `useComposeParam`, `cn` |

demo에서 가져오지 않은 것: 제품 표시(`brand`), 목업 로그인(`session`), 구성원 프로필 주소(`profile-route`), 주소 설정(`shared/config`), 호호코워크 기본 아바타 그림(`lib/avatar`). 그래서 `PersonAvatar`는 그림을 넘기지 않으면 이름 첫 글자를 보인다.

- `components.json`의 별칭이 `@/shared/ui` · `@/shared/lib`이므로 `npx shadcn@latest add <부품>`은 이 폴더에 만든다. 받은 뒤 `lucide-react` import를 `@/shared/ui/icon`으로 바꾸고, 없는 이름은 `generate-ui-icons.mjs`에 더한다.
- `npm run check:ui`가 새 키트에 demo와 같은 화면 규칙(FSD, 의미 토큰, 팔레트 색 · `dark:` 색 · `space-*` 금지, `style={{}}`은 `// check-ui: allow-style <사유>`가 있을 때만, lucide 금지)을 건다. 화면을 옮기면 `scripts/check-ui.mjs`의 `TARGETS`에 더한다.

## 레지스트리

`apps/site/registry.json`이 키트를 shadcn 레지스트리 `webcraft`로 내보낸다. `npm run registry:build`가 `public/r/<이름>.json`을 만들고, 사이트 배포가 그대로 `https://goraebap.xyz/r/<이름>.json`으로 올린다. 부품을 더하거나 import를 바꾸면 `registry.json`의 `files` · `dependencies` · `registryDependencies`를 함께 고치고 다시 빌드한다.

받는 프로젝트는 Webcraft FSD 배치를 쓴다: `@/*` → `src/*`, 공통 UI는 `src/shared/ui`, 도우미는 `src/shared/lib`. 파일은 `target`대로 그 자리에 놓이고, import(`@/shared/ui/...`)는 받는 쪽 별칭에 맞춰 바뀌지 않는다.

```text
npx shadcn@latest init -b base -p nova
# components.json: aliases를 components · ui → @/shared/ui, lib · hooks → @/shared/lib, utils → @/shared/lib/utils로,
#   registries에 "@webcraft": "https://goraebap.xyz/r/{name}.json"
npx shadcn@latest add @webcraft/theme @webcraft/page @webcraft/compose
```

- `@webcraft/theme`가 토큰 · 글꼴 · 유틸리티를 CSS에 더한다. init이 남긴 `@custom-variant dark (&:is(.dark *))`와 `.dark { … }`는 지운다(뒤에 더한 `data-theme` 변형이 이기지만 남겨 둘 이유가 없다).
- 레지스트리 JSON은 글자 파일만 담는다. 상태 화면의 webp 12장은 `https://goraebap.xyz/r/assets/page-state/landscapes/`에서 받는다(`page-state`의 설치 안내에 명령이 있다).
- shadcn add는 파일 맨 앞(첫 문장 앞)의 주석을 지운다. 지워지면 안 되는 머리 주석(아이콘의 저작자 표시)은 첫 import 뒤에 둔다.

## Astryx 키트 (교체 중)

Astryx를 쓰는 업무 앱이 같은 화면 구성과 상호작용을 재현할 수 있도록 고른 공통 UI 구현이다. 사용 기준은 `plugins/webcraft/skills/design-system/references`의 Markdown이 원본이고, 실행 견본은 `site/samples`에 있으며 가이드 사이트(`site`)에서 본다. 이 폴더는 플러그인에 포함하지 않는다.

| 폴더 | 담는 것 |
| --- | --- |
| `foundations` | Stone 확장 테마, 버튼·카드 변형 타입, 휴대폰 크기(responsive.css), 앱 진입 CSS(base.css), 분기점 훅, Solar 아이콘 |
| `composites` | 공통 다이얼로그·확인 창·짧은 양식, 팝오버↔바텀시트, 동작·행 메뉴, 검색, 필터·표시, 속성 알약, 파일 올리기, 상태 화면, 본문 칸(리치 에디터: 블록 메뉴·선택 서식 도구·상단 서식 막대·표 도구·올리는 칸·미디어·도표·HTML 임베드·링크 카드), 문서 편집기(`document`: 편집 DocumentEditor·읽기 DocumentView, 모드·페이지 설정·페이지 모양 모델 model.ts, Tiptap 페이지 나누기 확장 pagination.ts, 종이 틀·머리말·바닥글 PageCanvas, DocumentSettings·PageLookMenu·ZoomControl·ExportMenu·PagesPill, 편집과 읽기가 함께 쓰는 usePagedFrame), 그룹 머리 |
| `layouts` | 앱 셸(사이드바·하단 탭·더보기), 페이지(머리·배너·툴바·적용 줄·목록·표·읽은 수), 상세, 설정, 옆 패널 |
| `patterns` | 작성 양식과 초안 저장소, 본문 수정 화면(BodyEditPage), 라우트 마스킹·라우터 링크, 목록 조건의 주소, 첫 방문 덮개(BootCover와 index.html에 넣는 Vite 플러그인) |

Astryx 기본 부품은 다시 구현하지 않는다. 폴더끼리는 상대 경로로 이어져 있으므로 채택할 때는 필요한 파일과 그 의존만 프로젝트의 공통 UI 위치로 옮기고 경로를 고친다.

### 채택 순서

1. 앱 진입점에서 `foundations/base.css`를 UI 모듈보다 먼저 읽는다. 레이어 순서(reset → astryx-base → astryx-theme), 글꼴(Pretendard Variable·JetBrains Mono Variable), 휴대폰 크기·스크롤바·큰 화면 배율이 함께 온다. 글꼴 패키지 `pretendard`와 `@fontsource-variable/jetbrains-mono`를 함께 설치한다. 빠지면 Windows에서 맑은 고딕으로 대체되어 작은 글자가 흐려 보인다.
2. 루트를 `ReferenceTheme`(라이트·다크는 앱의 설정 하나)과 라우터 루트의 `LinkProvider component={RouterLink}`로 감싼다.
3. 작성 양식을 쓰면 라우터보다 위에 `DraftProvider`를 둔다.
4. 첫 방문 덮개: `vite.config`에 `bootCover({ mark, modeKey })`를 넣고, 앱 루트에 `BootCover`를 두어 첫 경로가 풀리면 `isReady`로 걷는다. 그림은 제품의 표시로 바꾼다.
5. 리치 에디터(`composites/editor`)를 쓰면 Tiptap 3 확장(`@tiptap/core`·`pm`·`extension-table`·`list`·`text-style`·`highlight`·`text-align`·`subscript`·`superscript`)과 `mermaid`, `yet-another-react-lightbox`를 함께 설치한다. 올리기(`upload`)와 링크 미리보기(`readPreview`)는 호스트가 서버에 이어 넘긴다. 미리보기는 서버가 읽어야 하고(브라우저가 남의 사이트를 직접 부르지 않는다), 올린 HTML은 격리 정책을 붙여 내보낸다.
6. 문서 편집기(`composites/document`)를 쓰면 리치 에디터(`composites/editor`, 상단 막대 `EditorToolbar` 포함)와 `composites/popup`·`composites/property`를 함께 옮긴다. 페이지 설정(`PageSetup`)은 본문과 따로 문서에 저장하고, 페이지 모양(`PageLook`)은 보는 사람의 화면 설정이라 문서에 저장하지 않는다. 서버에서 PDF를 만들면 `ExportMenu`의 `onSavePdf`를 넘긴다. 넘기지 않으면 브라우저 인쇄 창을 연다.
7. 아이콘 이름을 더하면 `site/scripts/generate-icons.mjs`의 매핑을 고치고 `npm run site:icons`를 실행한다.

### 검증 범위

자동 검사(타입·견본 그리기·조작 검증)와 브라우저 확인 범위는 `manifest.json`에 기록한다. 실기기 키보드·화면 낭독기·실제 서버 연동은 채택한 프로젝트에서 확인한다.
