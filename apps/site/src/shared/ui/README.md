# Webcraft 키트

업무 앱이 같은 화면 구성과 상호작용을 재현할 수 있도록 고른 공통 UI 구현이다. shadcn/ui(Base UI, `base-nova`)와 Tailwind CSS v4로 만들었고, 이 폴더 바로 아래와 `src/shared/lib`에 있다. 사용 기준은 `plugins/webcraft/skills/design-system/references`의 Markdown이 원본이고, 실행 견본은 `apps/site/samples`에 있으며 가이드 사이트(`apps/site`)에서 본다. 이 폴더는 플러그인에 포함하지 않고 shadcn 레지스트리로 배포한다.

## shadcn 키트

`apps/demo`에서 다듬은 공통 부품 가운데 특정 제품의 업무에 묶이지 않은 것을 옮겼다. 동작은 demo와 같고, 다크 모드만 사이트에 맞춰 `html[data-theme=dark]`로 읽는다(`.dark` 클래스를 쓰지 않는다).

| 위치 | 담는 것 |
| --- | --- |
| `*.tsx`(바로 아래) | shadcn 부품(우리가 고침: button의 view · tool · create, badge의 label, sidebar · input · textarea · select의 크기)과 공통 부품(adaptive-popover, action-menu, option-list, confirm-dialog, form-dialog, detail-surface, date-picker, property-pill · info-pill, display-menu, list-group-header, pane-resize-handle, segmented-control, row-link, list-more, person-avatar, search-tool) |
| `icon/` | lucide와 같은 이름으로 부르는 Solar 아이콘. `npm run icons:ui`가 `scripts/generate-ui-icons.mjs`의 이름표로 `icons.generated.ts`를 만든다 |
| `app-shell/` · `page/` · `settings/` · `compose/` · `filter/` · `page-state/` · `reading/` | 앱 셸, 페이지 틀, 설정 화면, 만들기 양식, 필터, 상태 화면(풍경 그림 webp), 읽기 상세 · 활동 |
| `side-panel/` · `peek/` · `reorder/` · `body-edit/` · `boot-cover/` · `editor/` · `document/` | 옆 패널, 목록 옆 미리보기, 순서 바꾸기, 본문 수정 화면, 첫 방문 덮개(Vite 플러그인 포함), 본문 칸, 문서 편집기 |
| `../lib/` | `useIsMobile`, `appearance`(모드 · 목록 높이), `useStoredWidth`, `toggleValue`, `panel`(목록 위 대화상자), `useComposeParam`, `draft`(초안), `list-address`(목록 조건의 주소), `use-peek`(미리보기 주소), `focus-invalid`, `cn` |

demo에서 가져오지 않은 것: 제품 표시(`brand`), 목업 로그인(`session`), 구성원 프로필 주소(`profile-route`), 주소 설정(`shared/config`), 호호코워크 기본 아바타 그림(`lib/avatar`). 그래서 `PersonAvatar`는 그림을 넘기지 않으면 이름 첫 글자를 보인다.

- `components.json`의 별칭이 `@/shared/ui` · `@/shared/lib`이므로 `npx shadcn@latest add <부품>`은 이 폴더에 만든다. 받은 뒤 `lucide-react` import를 `@/shared/ui/icon`으로 바꾸고, 없는 이름은 `generate-ui-icons.mjs`에 더한다.
- `npm run check:ui`가 사이트 전체(`src` · `samples`)에 demo와 같은 화면 규칙(FSD, 의미 토큰, 팔레트 색 · `dark:` 색 · `space-*` 금지, `style={{}}`은 `// check-ui: allow-style <사유>`가 있을 때만, lucide 금지)을 건다. 견본은 FSD 계층 밖이라 FSD 규칙은 보지 않는다.

## 레지스트리

`apps/site/registry.json`이 키트를 shadcn 레지스트리 `webcraft`로 내보낸다. `npm run registry:build`가 `public/r/<이름>.json`을 만들고, 사이트 배포가 그대로 `https://goraebap.xyz/r/<이름>.json`으로 올린다. 부품을 더하거나 import를 바꾸면 `registry.json`의 `files` · `dependencies` · `registryDependencies`를 함께 고치고 다시 빌드한다.

받는 프로젝트는 Webcraft FSD 배치를 쓴다: `@/*` → `src/*`, 공통 UI는 `src/shared/ui`, 도우미는 `src/shared/lib`. 파일은 `target`대로 그 자리에 놓이고, import(`@/shared/ui/...`)는 받는 쪽 별칭에 맞춰 바뀌지 않는다.

```text
npx shadcn@latest init -b base -p nova
# components.json: aliases를 components · ui → @/shared/ui, lib · hooks → @/shared/lib, utils → cn(패키지)으로,
#   registries에 "@webcraft": "https://goraebap.xyz/r/{name}.json"
npx shadcn@latest add @webcraft/theme @webcraft/page @webcraft/compose
```

- `@webcraft/theme`가 토큰 · 글꼴 · 유틸리티를 CSS에 더한다. init이 남긴 `@custom-variant dark (&:is(.dark *))`와 `.dark { … }`는 지운다(뒤에 더한 `data-theme` 변형이 이기지만 남겨 둘 이유가 없다).
- 레지스트리 JSON은 글자 파일만 담는다. 상태 화면의 webp 12장은 `https://goraebap.xyz/r/assets/page-state/landscapes/`에서 받는다(`page-state`의 설치 안내에 명령이 있다).
- shadcn add는 파일 맨 앞(첫 문장 앞)의 주석을 지운다. 지워지면 안 되는 머리 주석(아이콘의 저작자 표시)은 첫 import 뒤에 둔다.
