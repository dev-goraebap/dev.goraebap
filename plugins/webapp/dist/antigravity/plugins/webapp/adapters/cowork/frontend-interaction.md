---
arc42: "8.5, 2"
---

# cowork: 인터랙션

cowork는 프로젝트·업무·문서를 다루는 설치형 작업 공간입니다. 이 파일은 [인터랙션 지침](../../skills/frontend-interaction/SKILL.md)을 cowork 화면(`web/`)에 적용한 모양을 담습니다. 스택과 키트는 [디자인 시스템](frontend-design-system.md)과 같습니다.

## 지침을 어떻게 적용했나

### 모션

| 지침 | cowork |
| --- | --- |
| 빠름 100ms / 중간 250ms | 지침의 시간 값을 씁니다. 이름 붙은 시간 토큰은 `tailwind.css`에서 확인하지 못했습니다 |
| 화면 전환 | View Transitions(`web/src/app/layout/RouteStage.tsx`, `web/src/app/styles/index.css`). TanStack Router는 loader가 끝난 뒤 전환을 시작하므로 준비 중 진행 표시가 멈추지 않습니다 |
| 대화상자 바꿔 끼우기 | `swapDialog`(`web/src/app/layout/PanelHost.tsx`) |
| 완료 축하 효과 | 키트에 없습니다 |

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
| 스플래시 화면 | [BootCover](https://github.com/dev-goraebap/cowork/blob/570d27da402451fe2ca06fca74862dd3899555c9/web/src/shared/ui/kit/boot-cover/BootCover.tsx). 빌드 플러그인은 [vite.config.ts](https://github.com/dev-goraebap/cowork/blob/570d27da402451fe2ca06fca74862dd3899555c9/web/vite.config.ts)의 `initial-cover`로, `index.html`의 앱 자리에 오버레이를 넣고 색은 `web/src/app/theme/boot.ts`의 `bootColors`에서 가져옵니다. 저장한 모드는 `html[data-theme]`입니다 |
| 브라우저 자동화 점검 | Playwright 스크립트 `web/scripts/layout-shift.mjs` |

## 작업 절차

`web/`에서 실행합니다.

- `npm run check`: 화면 규칙 검사·lint·knip·테스트·빌드를 함께 실행합니다.
- `npm run layout:check`: 실행 중인 앱에서 화면 전환의 레이아웃 이동과 대기를 잽니다.
