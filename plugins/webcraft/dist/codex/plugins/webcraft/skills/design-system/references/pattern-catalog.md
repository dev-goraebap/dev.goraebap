---
arc42: "8.8"
---

# 패턴의 글과 코드

화면을 만들기 전에 해당 패턴의 사용 기준과 구현 파일을 함께 읽습니다. 글은 선택 기준과 지킬 조건, 코드는 배치와 동작을 확인하는 데 씁니다.

## 범주와 원본

| 범주 | 소유하는 내용 | 지침 | 코드 |
| --- | --- | --- | --- |
| Foundations (디자인 기초) | 테마·색상, 글자, 간격·크기, 면·경계·그림자·곡률, 아이콘, 모션 | [테마](theme.md), [글자](typography.md), [간격](spacing.md), [면](surfaces.md), [아이콘](icons.md), [모션](motion.md) | [토큰 CSS](https://github.com/dev-goraebap/cowork/blob/570d27da402451fe2ca06fca74862dd3899555c9/web/src/app/theme/tailwind.css), [icon](https://github.com/dev-goraebap/cowork/tree/570d27da402451fe2ca06fca74862dd3899555c9/web/src/shared/ui/kit/icon) |
| Primitives (기본 부품) | shadcn 부품의 쓰임과 변형 | [기본 부품](basic-components.md) | [shared/ui/kit](https://github.com/dev-goraebap/cowork/tree/570d27da402451fe2ca06fca74862dd3899555c9/web/src/shared/ui/kit)의 shadcn 부품 |
| Composites (조합 부품) | 다이얼로그·곁에 여는 내용·검색·필터·표시·속성·올리기·상태·본문 칸 | [조합 부품](composed-components.md), [다이얼로그](dialog.md), [검색·필터·표시](search-filter.md) | [shared/ui/kit](https://github.com/dev-goraebap/cowork/tree/570d27da402451fe2ca06fca74862dd3899555c9/web/src/shared/ui/kit)의 조합 부품 |
| Layouts (레이아웃) | 앱 셸·공간·사이드바·모바일 탐색·페이지 머리·칸 머리·툴바·목록·표·상세·설정·옆 패널 | [앱 셸](app-layout.md), [페이지 배치](layout-patterns.md) | [layout](https://github.com/dev-goraebap/cowork/tree/570d27da402451fe2ca06fca74862dd3899555c9/web/src/shared/ui/kit/layout)(app-shell·page·split-view·pane-frame·phone-tools) |
| Patterns (사용 패턴) | 여러 화면에 걸리는 동작 계약: 리소스 화면 패턴(List-Detail·Drill-down·Routed Modal), 라우트 마스킹, 조건의 주소, 대기·빈 상태·실패, 행 클릭·키보드 | [리소스 화면 패턴](resource-patterns.md), [라우트 마스킹](route-masking.md), [데이터 상태](data-states.md), [입력과 상호작용](interaction-patterns.md) | [shared/lib](https://github.com/dev-goraebap/cowork/tree/570d27da402451fe2ca06fca74862dd3899555c9/web/src/shared/lib) |

Primitives와 Composites는 재사용 코드의 단위입니다. Layouts와 Patterns는 공간과 행동의 기준이며 더 큰 부품이라는 이유로 분류하지 않습니다. 여러 화면이 함께 지키는 여는 방식·상태·조작은 Patterns입니다. 같은 구현을 여러 설명에서 참조하되 코드와 규칙의 원본은 한 곳에 둡니다. 파일 배치는 공식 FSD 지침에 맡기고 상태·캐시·URL·초안은 frontend 지침을 따릅니다. 접근성·반응형·키보드·문구는 모든 범주의 공통 검토 기준이며 [문구·본문과 검증](content-and-review.md)을 따릅니다.

## 원본과 갱신

SKILL.md는 지침을 찾는 입구입니다. 규칙의 원본은 이 스킬의 Markdown입니다. references의 Markdown이 판단 기준과 확인할 동작을 소유합니다. cowork의 코드는 규칙을 적용한 견본이며 규칙을 다시 정하지 않습니다. 규칙이 바뀌면 스킬을 먼저 고치고 cowork를 맞춥니다.

규칙을 바꾸면 Markdown과 키트 코드를 함께 고칩니다. 색·간격은 화면마다 보정하지 않고 테마와 부품에서 고칩니다. 출처·비교·제작 기록은 Git과 배포에서 제외한 개발 자료에 둡니다.

키트 코드는 cowork 저장소의 `web/src/shared/ui/kit`에 두고 플러그인 패키지에 넣지 않습니다. 설치된 지침에서는 위 링크로 필요한 파일만 읽습니다. 채택할 때는 필요한 부품 파일만 cowork에서 복사합니다([레퍼런스 사용과 갱신](reference-kit.md)). 복사한 코드는 그 프로젝트 소유이며 원본 저장소에서 import하지 않습니다.

## 실행과 검토

cowork의 `web/`에서 `npm run check`가 화면 규칙 검사·lint·타입 검사·빌드를 함께 실행합니다. 화면 규칙 검사 `npm run lint:ui`(`web/scripts/check-ui.mjs`)는 FSD 레이어 방향과 같은 레이어의 다른 슬라이스 import, `pages`에서 다른 주소의 파일 import, 팔레트 색·`dark:` 색 덮어쓰기·직접 쓴 색 값·`space-x/y-*`·`!important`·`*.module.css` 금지, `style={{}}`는 `// check-ui: allow-style <이유>`가 있을 때만, lucide-react와 `@/shared/lib/utils` import 금지를 검사합니다. 키트·본문 편집기·테마 파일에는 색·간격 규칙을 걸지 않고 레이어와 import 검사만 겁니다. 자동 검증과 사람이 본 시각·키보드·실기기 범위를 구분해 기록합니다.

프로젝트의 비밀값·실제 계정·업무 데이터를 예제에 넣지 않습니다. 서버 응답은 경계에서 모의 저장소로 대체하고, 예제를 실행해도 실제 업무가 생기지 않게 합니다.
