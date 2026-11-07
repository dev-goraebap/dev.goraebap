# 패턴의 글·코드·실행 견본

화면을 만들기 전에 해당 패턴의 사용 기준, 구현 파일, 실행 견본을 함께 읽는다. 글은 선택 기준과 불변 조건을 설명하고, 코드는 배치와 동작을 제공하며, 견본은 상태와 화면 크기를 바꾸어 확인하는 데 쓴다. 화면 이미지는 확인한 외형을 보완한다.

## 책임과 원본

| 영역 | 관리할 내용 |
| --- | --- |
| 디자인 기초 | 색·간격·글자·아이콘·모션 토큰과 테마 |
| 컴포넌트 | Astryx의 기본 부품과 프로젝트의 조합 부품 |
| 화면·상호작용 패턴 | 레이아웃, 작성·탐색·로딩·빈 상태, 문구와 접근성 기준 |
| 프론트엔드 구조 | 파일 배치는 공식 FSD 지침, 상태·캐시·URL·초안은 frontend 지침이 소유 |
| 실행 레퍼런스 | 실제 구현에 상태와 비식별 데이터를 연결한 Storybook Story |
| 검증 | 타입·린트, 동작·키보드·접근성·시각 변화 검사 |

스타일 가이드는 앞의 세 영역을 설명한다. 문구 품질은 화면·상호작용 패턴에 포함하고 [문구·본문과 검증](content-and-review.md)을 따른다. 설명·배지·카드를 반복해 정보 구조를 흐리지 않는지도 견본에서 확인한다.

공통 워크플로우는 여러 프로젝트가 선택할 기준과 레퍼런스를 소유한다. 프로젝트는 채택한 부품·제품 테마·업무 화면을 소유한다. 제품 부품이 있으면 견본도 그 부품을 import한다. 공통 개선을 회수할 때에는 지침, 구현, 견본과 검증 결과를 함께 갱신한다.

## 처음 읽을 패턴

| 패턴 지침 | 레퍼런스 코드 | 실행 Story |
| --- | --- | --- |
| [생성 양식](creation-form.md) | [CreationForm](../assets/workspace/CreationForm.tsx) | [기본·단계형](../assets/workspace/CreationForm.stories.tsx) |
| [공통 다이얼로그](dialog.md) | [ReferenceDialog](../assets/workspace/ReferenceDialog.tsx) | [본문·푸터·키보드](../assets/workspace/Dialog.stories.tsx) |
| [앱 레이아웃](app-layout.md) | [WorkspaceShell](../assets/workspace/WorkspaceShell.tsx) | [Split·Inset·모바일](../assets/workspace/AppLayout.stories.tsx) |
| [라우트 마스킹](route-masking.md) | [RoutedPanel](../assets/workspace/RoutedPanel.ts) | [목록·직접 진입](../assets/workspace/RouteMasking.stories.tsx) |

## 원본과 갱신

SKILL.md는 필요한 지침을 찾는 입구다. references의 Markdown은 판단 기준과 검증할 동작을 소유한다. MDX는 그 Markdown을 import하고 실제 코드와 Story를 연결한다. 같은 규칙을 MDX에 다시 작성하지 않는다. Story의 args는 허용한 변형, play는 사용자 행동과 결과를 표현한다.

컴포넌트 API를 바꾸면 해당 Story와 검증도 고친다. 규칙을 바꾸면 Markdown을 고치고 같은 MDX에서 결과를 확인한다. 색·간격을 Story 전용 CSS로 보정하지 않고 실제 테마·부품에서 고친다. 제품에 같은 부품이 있으면 Story는 제품 부품을 import하고 가상 데이터와 시작 상태만 연결한다.

레퍼런스 코드는 패딩·슬롯·상태 경계를 재현할 때 필요한 범위만 둔다. 프론트엔드 전체나 제품 API·도메인 데이터를 스킬에 복사하지 않는다. 라이브러리 자체의 기본 부품을 다시 구현하지 않는다. 프로젝트에 채택한 코드는 그 프로젝트 소유이며 원본 스킬에서 직접 import하지 않는다.

## 실행과 검토

워크플로우 원본 저장소에서 npm ci 후 npm run patterns로 Storybook을 연다. npm run patterns:check, npm run patterns:build로 타입과 정적 출력을 확인한다. npm run patterns:test는 같은 Story를 Chromium에서 실행한다. 테스트용 브라우저가 없으면 npx playwright install chromium으로 준비한다.

테마·화면 크기는 도구 모음, 허용한 변형은 Controls, 조작과 결과는 Interactions, 접근성은 Accessibility에서 확인한다. 라우터·다이얼로그는 독립 iframe 안에서 실행한다. 문서의 대표 예제는 사용자가 조작하기 전에 초점을 옮기거나 화면을 이동시키지 않는다. 자동 play 검증은 이름이 구분된 Story로 연결해 문서 읽기를 방해하지 않게 한다. 자동 검증 결과와 사람이 확인한 시각·키보드·실기기 범위를 구분해 기록한다. 시각 회귀 기준은 검토한 이미지와 고정된 데이터·날짜·폰트·화면 크기로 관리한다.

프로젝트의 비밀값·실제 계정·업무 데이터를 Story에 넣지 않는다. 서버 응답이 필요하면 경계에서 대체하고, 예제를 실행했다고 실제 업무가 생성되지 않게 한다. Storybook은 개발·검토 도구이며 제품 빌드에 포함하지 않는다. 비교 출처와 제작 기록은 개발용 비공개 자료에 둔다.
