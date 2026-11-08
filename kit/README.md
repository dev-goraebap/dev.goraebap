# 키트와 견본

Astryx 기반 화면의 공통 구현(키트)과 그 견본을 둔다. 견본은 가이드 사이트(`guide/`)가 규칙 옆에 띄우고, 같은 견본으로 상호작용을 검사한다. 이 폴더는 플러그인 배포 대상이 아니며, 설치된 스킬은 공개 저장소 링크로 여기의 코드를 가리킨다.

## 실행과 검증

저장소 루트에서 `npm ci` 후 `npm run guide`로 가이드(4451)를 연다. 견본은 왼쪽 메뉴의 "견본"과 각 규칙 문서 안에 있다. `npm run kit:check`는 타입, `npm run kit:test`는 Chromium에서 모든 견본이 그려지는지와 조작 검증을 확인한다. 테스트용 브라우저가 없으면 `npx playwright install chromium`으로 준비한다.

## 구성

| 위치 | 관리하는 내용 |
| --- | --- |
| `reference` | 채택할 수 있는 공통 구현(키트). foundations·composites·layouts·patterns |
| `samples/<범주>/*.samples.tsx` | 견본. 기본 내보내기가 묶음(제목·id·틀), 이름 있는 내보내기가 견본 하나다 |
| `samples/<범주>/*.test.tsx` | 조작 검증. 견본 파일의 부품을 그려 누르고 확인한다 |
| `samples/catalog` | 견본 형식, 그리기, 목록, 검사 도구 |
| `samples/playground` | 기능 단위 앱 16개(인박스, 이슈, 로그인, 문서함, 설정, 일정, 결재 신청, 권한 설정, 댓글·대화, 활동 기록, 가져오기, 오류·권한 페이지, 폴더 탐색, 태그 관리, 사용자 관리, 처음 시작)와 문서함이 쓰는 공통 서가 앱·모의 저장소(`library`) |
| `guide` | 가이드 사이트. `src`, `content`(화면 해설·견본·참고 MDX), `content-plugin.ts`, `index.html`, `sample.html` |
| `scripts` | Solar 아이콘 매핑 생성 |
| `vite.config.ts` | 가이드 사이트 빌드·개발 서버(4451) |
| `vitest.config.ts` | 견본 검사(Chromium) |
| `tsconfig.json` | 키트·견본·가이드 타입 검사 |

범주는 Foundations (디자인 기초) → Primitives (기본 부품) → Composites (조합 부품) → Layouts (레이아웃) → Patterns (사용 패턴) → Playground (플레이그라운드) 순서다. 범주는 영문(한글), 그 안의 항목은 한글로 쓴다. 기능 하나를 작은 앱 하나로 묶어 본뜰 수 있게 한 것은 Playground(16개 앱, 공통 서가 앱 `library`는 문서함이 씀)이고, 여러 앱이 지키는 여는 방식·상태·조작이면 Patterns다. Playground는 앱마다 느낌이 확실히 다른 화면만 다루고 같은 모양의 화면은 한 앱에서만 다루며, 기존 앱과 느낌이 다른 화면이 필요하면 새 앱을 더한다. 견본 앱은 `kit/samples/catalog/shell-layout.ts`의 `useShellLayout()`을 `AppFrame`의 `layout`에 넘겨 가이드 머리 줄의 배치 전환(Inset·Split)을 따른다. 견본과 예제는 키트를 `@kit/…`로 가져와 채택한 프로젝트와 같은 방식으로 쓴다. 서가 예제의 파일 구조는 공식 FSD 지침에 맡기고 자체 검사기는 두지 않는다.

## 견본 쓰기

묶음 id는 파일 위치에서 정해진다(`patterns/RouteMasking.samples.tsx` → `patterns-route-masking`). 견본 주소는 `묶음 id/견본 이름`이다(`RouteMasking`의 `OverList` → `patterns-route-masking/over-list`). 가이드 문서에서는 `<Sample id="patterns-route-masking/over-list" />`로 넣는다.

| 틀 값 | 뜻 |
| --- | --- |
| `layout` | `centered`(부품), `fullscreen`(앱 화면) |
| `device` | 가이드에서 처음 보일 기기. 기본은 데스크톱이며 견본 틀의 전환으로 휴대폰(390px)도 본다. 휴대폰 견본을 따로 만들지 않는다 |
| `height` | 가이드에서 차지할 높이. 대화상자처럼 떠 있는 것을 담을 때 정한다 |

키트는 창 폭으로 휴대폰을 판정하므로 가이드는 견본을 iframe 안에서 실제 폭(데스크톱 1024px, 휴대폰 390px)으로 그리고, 본문 칸이 좁으면 비율대로 줄여 보인다. 견본 틀 오른쪽 위의 전환으로 같은 견본을 두 기기로 본다. 부품 견본은 내용이 칸에 들어가면 줄이지 않는다. 라이트·다크는 가이드의 선택을 따르며 견본 안에 테마 전환을 두지 않는다.

## 확인할 동작

서가 예제는 데스크톱에서 목록 위 대화상자로 작성하고 크게 보기로 페이지로 옮긴다. 휴대폰과 직접 진입은 페이지로 연다. 초안은 라우터 위의 저장소에 있어 표현이 바뀌어도 남고, 입력이 있으면 닫기 전에 확인한다. 검색·필터·표시는 예제 라우터의 주소가 가진다. 견본은 메모리 주소를 쓰므로 실제 새로고침·공유는 채택한 프로젝트에서 확인한다.

등록·즐겨찾기·삭제는 견본의 메모리에만 남는다. 파일은 이름만 기록하고 올리지 않는다.
