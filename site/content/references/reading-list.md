---
title: "읽기 목록"
description: "규칙의 근거가 된 자료와 읽는 이유"
sidebar:
  order: 1
---

로그인 뒤 사이드바와 본문 영역으로 이루어진 업무 도구([앱 셸](/app-shell/overview/))를 설계할 때 읽는 외부 근거 자료다(2026-11-07 조사). 프론트엔드 레이아웃 이론에 익숙하지 않은 개발자가 화면을 검토하거나, 에이전트가 규칙의 배경을 확인하고 예외 상황을 판단할 때 참고한다. 앞부분의 전체 구조 자료부터 주제별 세부 지침 순서로 읽으면 이해가 쌓이도록 배열했다.

이 규칙집의 각 항목은 성격을 세 가지로 구분한다([읽는 법](/start/how-to-read/) 참고).

- `[관례]`: 아래 제품 사례와 디자인 시스템 지침이 같은 방향으로 수렴한 규칙이다. 근거가 되는 문서가 바뀔 때만 수정한다.
- `[고래밥]`: 외부 관례가 뚜렷하지 않거나, 관례와 다른 쪽을 택한 자체 결정이다([결정 기록](/start/decisions/)). 아래 자료가 제시하는 기본 원칙과 비교해 왜 다르게 정했는지 판단할 때 함께 본다.
- `[선호]`: 기능 규칙이 아니라 시각적 모양에 관한 취향이다.

제품과 지침을 항목별로 맞대어 비교한 표는 [비교 조사](/references/comparison/)에 정리되어 있다.

## 먼저 읽을 것 (전체 감 잡기)

앱 셸의 전체 윤곽과 [시각 위계](/common/visual-hierarchy/), 기본 치수를 잡을 때 가장 먼저 읽는 자료다.

| 자료 | 읽는 이유와 확인 내용 |
| --- | --- |
| [Linear: How we redesigned the Linear UI](https://linear.app/now/how-we-redesigned-the-linear-ui) | 사이드바와 머리 줄이 만드는 "뒤집힌 L자" 프레임, 시각 소음 줄이기, LCH 색 3변수(`base`·`accent`·`contrast`), 표면 고도를 설명한다. 이 규칙집이 지향하는 화면 인상의 출처다. |
| [Linear: Behind the latest design refresh](https://linear.app/now/behind-the-latest-design-refresh) | 사이드바를 본문보다 어둡게 두어 본문을 주인공으로 만드는 방법, 아이콘과 구분선 줄이기, 따뜻한 회색 조, 머리 줄 동작 위치의 일관성을 다룬다. 높은 밀도를 유지하면서도 화면이 압도적이지 않게 만드는 기준이다. |
| [Refactoring UI](https://www.refactoringui.com/) (책) | 덜 중요한 요소를 눌러서 위계를 만들고, 여백은 넉넉하게 시작하며, 모든 요소를 카드나 테두리로 감싸지 않는다는 시각 디자인 기본기를 다룬다. |
| [GitHub Primer: PageLayout](https://primer.style/components/page-layout) | 머리 줄·본문·패널·사이드바의 폭과 패딩, 반응형 동작을 속성으로 정의한다. 역할 중심 규칙을 구체적인 수치로 옮길 때 참고한다. |
| [Atlassian: Navigation system layout](https://atlassian.design/components/navigation-system/layout/examples) | 사이드바 기본 폭 320px(조절 범위 240px~화면의 50%), 1024px 미만 오버레이 전환, 상단 바 48px, 접기·단축키·마우스 오버(hover) 펼침 동작을 제시한다. |

## 주제별 자료

### 셸·사이드바·머리 줄

[셸과 사이드바](/app-shell/shell-and-sidebar/), [머리 줄과 툴바](/app-shell/header-and-toolbar/) 규칙의 `[관례]` 근거와 `[고래밥]` 사이드바 폭 결정(기본 340px, 조절 범위 220~380px)을 뒷받침하는 자료다.

- [Apple HIG: Sidebars](https://developer.apple.com/design/human-interface-guidelines/sidebars) — 사이드바 계층을 2단계까지로 제한하고, 기본으로 숨기지 않으며, 하단에 중요한 동작을 두지 않는 원칙을 제시한다.
- [NN/g: Hamburger menus](https://www.nngroup.com/articles/hamburger-menus/) — 탐색 메뉴를 기본으로 숨겼을 때의 사용 비용(표시된 탐색 대비 사용률 27% 대 48%)을 실험 수치로 보여 준다.
- [Carbon: UI shell header](https://carbondesignsystem.com/components/UI-shell-header/usage/) — 머리 줄 요소의 배치 순서, 화면이 좁아질 때 요소가 이동하는 방식, 본문 건너뛰기 링크를 다룬다.
- [Atlassian: Page header](https://atlassian.design/components/page-header/usage) — 페이지당 머리 줄을 하나만 두고 경로·제목·동작·검색 필터로 구성하는 기준을 설명한다.
- [Primer: PageHeader](https://primer.style/product/components/page-header/guidelines/) — 좁은 화면에서 경로(breadcrumb)를 부모 단계 링크로 줄이고, 동작 버튼을 오버플로 메뉴로 묶는 방법을 다룬다.
- [NN/g: Breadcrumbs](https://www.nngroup.com/articles/breadcrumbs/) — 계층이 3단계 이상일 때만 경로를 표시하고, 마지막의 현재 페이지는 링크 없이 두는 `[관례]`의 근거다.
- [Linear changelog: Personalized sidebar](https://linear.app/changelog/2024-12-18-personalized-sidebar) — 사이드바 항목의 순서를 바꾸고 덜 쓰는 항목을 More 뒤로 숨기는 개인화 사례다.
- [Plane 사이드바 소스](https://github.com/makeplane/plane/blob/preview/apps/web/app/(all)/[workspaceSlug]/(projects)/_sidebar.tsx) — 기본 250px 폭, 드래그 리사이즈 상태 저장, 접힌 상태에서 마우스를 올렸을 때 잠깐 펼치는(hover peek) 실제 구현을 확인할 수 있다.

### 목록·표·필터·표시

[컬렉션](/app-shell/collections/)과 [필터와 표시](/app-shell/filters-and-display/)에서 목록과 표를 고르는 기준, 행 구성, 필터와 표시 도구의 분리를 다룬 자료다.

- [Linear: Display options](https://linear.app/docs/display-options) — 어떻게 보일지 정하는 '표시'(그룹·정렬·표시 속성·레이아웃)와 무엇을 보일지 거르는 '필터'를 분리하는 `[관례]`의 직접 근거다.
- [Linear: Filters](https://linear.app/docs/filters) — 문장형 필터 칩, 조건 연산자, 고급 AND/OR 조합, 필터 상태의 주소(URL) 반영 방식을 설명한다.
- [Primer: DataTable guidelines](https://primer.style/product/components/data-table/guidelines/) — 표와 목록 중 고르는 기준, 숫자의 오른쪽 정렬, 빈 셀 처리(기호 넣지 않기), 페이지당 기본 20행, 스켈레톤 로딩을 다룬다.
- [Primer: ActionList guidelines](https://primer.style/product/components/action-list/guidelines/) — 목록 행에서 앞 표시(종류·상태), 끝 표시(보조 정보), 끝 동작의 역할을 나눈다.
- [Carbon: Data table](https://carbondesignsystem.com/components/data-table/usage/) — 행 높이 단계(24/32/40/48/64px)와 툴바, 일괄 동작 구성을 정의한다.
- [Inclusive Components: Cards](https://inclusive-components.design/cards/) — 행이나 카드 전체를 클릭 영역으로 만들 때 제목 링크의 클릭 영역을 가상 요소로 늘리는 접근성 기법을 설명한다.
- [Adrian Roselli: Block links](https://adrianroselli.com/2020/02/block-links-cards-clickable-regions-etc.html) — 블록 전체를 링크 요소(`<a>`)로 감싸면 안 되는 이유와 표 행 전체 클릭이 갖는 접근성 대가를 짚는다.
- [NN/g: Infinite scrolling](https://www.nngroup.com/articles/infinite-scrolling-tips/) — 페이지 나눔, 더 보기 버튼, 무한 스크롤 중 상황에 맞는 방식을 고르는 기준이다. 업무 목록에서 무한 스크롤 대신 개수 표시와 더 보기·페이지를 쓰는 근거가 된다.
- [NN/g: Mobile tables](https://www.nngroup.com/articles/mobile-tables/) — 휴대폰 등 좁은 화면에서 표를 다루는 전략을 비교한다.
- [NN/g: Filter categories and values](https://www.nngroup.com/articles/filter-categories-values/), [Filters vs facets](https://www.nngroup.com/articles/filters-vs-facets/) — 필터 범주와 값을 설계하는 원칙, 단일 필터와 다중 패싯(facet)의 차이를 설명한다.
- [Plane 목록 행 소스](https://github.com/makeplane/plane/blob/preview/apps/web/components/issues/issue-layouts/list/block.tsx) — 44px 행 높이와 미리보기 중인 행을 강조하는 구성을 코드로 확인할 수 있다.

### 모달·페이지·라우트 마스킹

[표현 고르기](/app-shell/choosing-presentation/), [라우트 마스킹](/app-shell/route-masking/), [미리보기 패널](/app-shell/peek/)에서 대상을 대화상자·패널·독립 페이지 중 어디에 열지 판단할 때 읽는 자료다.

- [TanStack Router: Route masking](https://tanstack.com/router/latest/docs/framework/react/guide/route-masking) — 하나의 주소에 두 가지 화면 모습을 연결하고, 새로고침 시 마스크를 해제(`unmaskOnReload`)하며, 복사한 주소를 열 때는 마스크 없이 전체 페이지로 여는 원리를 설명한다. `[고래밥]` 라우트 마스킹 계약의 기술 근거다.
- [Next.js: Intercepting routes](https://nextjs.org/docs/app/api-reference/file-conventions/intercepting-routes), [Parallel routes](https://nextjs.org/docs/app/api-reference/file-conventions/parallel-routes) — 앱 안에서 누르면 목록 위 모달로 열리고, 새로고침하거나 공유한 링크로 직접 진입하면 독립 페이지로 열리며, 브라우저 뒤로가기로 모달을 닫는 패턴을 다룬다.
- [Smashing: Modal vs separate page decision tree (2026-03)](https://www.smashingmagazine.com/2026/03/modal-separate-page-ux-decision-tree/) — 이전 화면의 상태 유지 필요성, 작업 길이, 본문 참조 필요성에 따라 모달과 독립 페이지를 고르는 결정 트리를 제시한다.
- [Primer: Dialog guidelines](https://primer.style/product/components/dialog/guidelines/) — 대화상자는 단일 열의 짧은 작업에만 쓰고, 링크로 공유할 내용은 페이지로 만들며, 휴대폰의 입력 대화상자는 전체 화면으로 여는 기준이다.
- [Atlassian: Modal dialog](https://atlassian.design/components/modal-dialog/usage) — 복잡한 상호작용, 큰 표, 여러 단계 작업에는 모달을 쓰지 않고, 모달 위에 모달을 중첩하지 않는 규칙을 다룬다.
- [NN/g: Modal vs nonmodal](https://www.nngroup.com/articles/modal-nonmodal-dialog/) — 모달과 비모달(패널·팝오버) 대화상자의 구분과 선택 기준을 정리한다.
- [Apple HIG: Modality](https://developer.apple.com/design/human-interface-guidelines/modality), [Sheets](https://developer.apple.com/design/human-interface-guidelines/sheets) — 모달을 써야 하는 조건과 입력 손실 방지, 시트 표현 방식을 다룬다.
- [Plane 미리보기(peek) 소스](https://github.com/makeplane/plane/blob/preview/apps/web/components/issues/peek-overview/view.tsx), [휴대폰은 페이지로 보내는 훅](https://github.com/makeplane/plane/blob/preview/apps/web/hooks/use-issue-peek-overview-redirection.tsx) — 데스크톱의 미리보기 레이아웃 구현과 좁은 화면에서 미리보기 대신 상세 페이지로 이동시키는 처리 방식을 확인할 수 있다.

### 적응형·휴대폰

[적응형과 모바일](/app-shell/adaptive/) 및 [콘텐츠 폭](/app-shell/content-width/)에서 창 크기에 따라 탐색과 배치를 전환하는 근거 자료다.

- [Android: Build adaptive navigation](https://developer.android.com/develop/adaptive-apps/guides/build-adaptive-navigation) — 같은 탐색 목적지를 창 폭에 따라 좁은 화면에서는 하단 바로, 넓은 화면에서는 사이드 레일로 전환하는 공식 지침이다. "사이드바 ↔ 하단 탭" 전환 `[관례]`의 핵심 근거다.
- [Android: Canonical layouts](https://developer.android.com/develop/ui/compose/layouts/adaptive/canonical-layouts) — 목록-상세(list-detail), 보조 패널(supporting pane, 70:30 비율), 피드 레이아웃의 표준 구조를 정의한다.
- [Android: Window size classes](https://developer.android.com/develop/ui/compose/layouts/adaptive/use-window-size-classes) — 물리적 기기 종류가 아니라 현재 열린 창의 실제 크기로 레이아웃을 판단하는 기준이다.
- [NN/g: Mobile navigation patterns](https://www.nngroup.com/articles/mobile-navigation-patterns/) — 휴대폰에서 하단 탭 바(4~5개 항목, 항상 노출)가 햄버거 메뉴보다 발견성이 높다는 근거를 다룬다.
- [NN/g: Bottom sheets](https://www.nngroup.com/articles/bottom-sheet/) — 바텀시트에 닫기 버튼을 두고, 뒤로가기로 닫히게 하며, 시트를 두 겹으로 쌓거나 독립 페이지 대용으로 쓰지 않는 규칙을 설명한다.
- [Apple HIG: Tab bars](https://developer.apple.com/design/human-interface-guidelines/tab-bars) — 하단 탭 바의 구성 원칙을 다룬다. Apple 지침은 더보기(More) 탭을 피하고 상세 화면에서도 탭 바를 숨기지 말라고 권장하므로, 더보기 시트를 두고 상세·작성 화면에서 탭 바를 숨기는 `[고래밥]` 결정과 대조할 때 읽는다.
- [MDN: CloseWatcher](https://developer.mozilla.org/en-US/docs/Web/API/CloseWatcher) — 직접 구현한 시트나 드로어도 Android 뒤로가기 및 `Esc` 입력에 반응하도록 연결하는 웹 API 문서다.
- [TanStack Router: Scroll restoration](https://tanstack.com/router/latest/docs/framework/react/guide/scroll-restoration) — 상세에서 목록으로 돌아올 때 이전 스크롤 위치를 복원하는 방법을 다룬다.

### 피드백·상태·저장

[상태와 피드백](/app-shell/states-and-feedback/)과 [시각 위계](/common/visual-hierarchy/)의 간격·로딩·빈 상태·저장·알림 규칙을 뒷받침하는 자료다.

- [NN/g: Skeleton screens](https://www.nngroup.com/articles/skeleton-screens/), [Response times](https://www.nngroup.com/articles/response-times-3-important-limits/) — 응답 시간에 따른 대기 표시 기준(1초 미만은 표시 없음, 2~10초는 구역 스피너 또는 전체 스켈레톤, 10초 초과는 진행률 표시)과 스켈레톤 화면을 쓰는 조건을 설명한다.
- [Primer: Loading](https://primer.style/product/ui-patterns/loading/), [Saving](https://primer.style/product/ui-patterns/saving/), [Notification messaging](https://primer.style/product/ui-patterns/notification-messaging/) — 로딩 표현, 명시적 저장과 자동 저장을 한 양식에 섞지 않는 원칙, 토스트 알림을 남발하지 않고 인라인·배너 피드백을 우선하는 기준을 다룬다. 필수 값 누락 시 제출 버튼 비활성화 여부나 짧은 완료 토스트 허용처럼 `[고래밥]` 결정이 Primer 지침과 갈리는 지점을 확인할 때 참고한다.
- [Carbon: Empty states](https://carbondesignsystem.com/patterns/empty-states-pattern/), [NN/g: Empty states](https://www.nngroup.com/articles/empty-state-interface-design/), [Atlassian: Empty state](https://atlassian.design/components/empty-state/usage) — 빈 상태를 첫 사용, 검색·필터 결과 없음, 오류로 나누어 설명하고 다음 행동을 안내하는 구성을 다룬다.
- [Atlassian: Spacing](https://atlassian.design/foundations/spacing) — 8px 기반 간격 단계와 요소 내부·부품 사이·페이지 단위의 간격 용도를 정의한다.

## 직접 확인하지 못한 자료 (미확인 범위)

2026-11-07 조사 시점에 원문을 직접 읽지 못했거나 공개된 수치가 없는 항목이다. 해당 범위는 추정으로 채우지 않고 비워 두었으며, 규칙을 구체화할 때 추가 확인이 필요하다.

- Material 3 원문(`m3.material.io`): 스크립트 렌더링 구조여서 본문을 직접 확인하지 못했고, 같은 기준을 다루는 Android 개발자 문서로 대체했다.
- Refactoring UI 본문: 책 본문 전체를 확인하지 못하고 공개된 요약만 확인했다.
- Linear 앱 화면의 구체적 수치: 사이드바 폭, 행 높이, 모달 크기 등 실제 픽셀(px) 수치는 공개된 자료가 없어 미확인 상태다. 수치가 필요하면 실제 앱 화면을 직접 측정해야 한다.
- Linear 미리보기(peek)·모바일 문서 일부: 문서 주소가 404 상태여서 검색 요약으로만 내용을 파악했다.
