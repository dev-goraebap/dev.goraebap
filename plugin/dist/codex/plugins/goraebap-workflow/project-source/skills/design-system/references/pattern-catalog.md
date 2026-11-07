# 패턴의 글·코드·실행 견본

화면을 만들기 전에 해당 패턴의 사용 기준, 구현 파일, 실행 견본을 함께 읽는다. 글은 선택 기준과 불변 조건을 설명하고, 코드는 배치와 동작을 제공하며, 견본은 상태와 화면 크기를 바꾸어 확인하는 데 쓴다. 화면 이미지는 확인한 외형을 보완한다.

## 책임과 원본

| 범주 | 소유하는 내용 | 경계 |
| --- | --- | --- |
| 디자인 기초 | 테마·색상, 글자·간격·면, 아이콘·모션 | 테마와 아이콘은 각각 문서와 실행 항목을 둔다. |
| 기본 부품 | 버튼·뱃지·아바타·입력·Dialog | Astryx 공개 API를 직접 사용한다. |
| 조합 부품 | 공통 다이얼로그·검색 도구·선택 메뉴·빈 상태 | 기본 부품의 조합과 반복되는 슬롯·동작을 소유한다. |
| 레이아웃 | 앱 셸·Split·Inset·목록·상세·모바일 탐색 | 공간 분할과 정렬·스크롤 경계를 소유한다. |
| 사용 패턴 | 생성·수정·검색·필터·전환·대기·실패 | 사용자 행동과 상태가 이어지는 방식을 소유한다. |
| 화면 예제 | 서가의 목록·상세·생성·모바일 | 앞의 부품과 패턴을 제품 문맥에서 조합한다. |

[기본 부품](basic-components.md)과 [조합 부품](composed-components.md)은 재사용 코드의 단위다. 레이아웃과 사용 패턴은 공간·행동의 기준이며 더 큰 부품이라는 이유만으로 분류하지 않는다. 같은 구현을 여러 설명에서 참조할 수 있지만 코드와 규칙의 원본은 한 번만 둔다.

접근성·반응형·키보드·문구 품질은 모든 범주의 공통 검토 기준이다. [문구·본문과 검증](content-and-review.md)을 따르고 의미 없는 설명·배지·카드가 정보 구조를 흐리지 않는지도 확인한다. 파일 배치는 공식 FSD 지침에 맡기며, 상태·캐시·URL·초안은 frontend 지침을 따른다.

공통 워크플로우는 여러 프로젝트가 선택할 기준과 레퍼런스를 소유한다. 프로젝트는 채택한 부품·제품 테마·업무 화면을 소유한다. 제품 부품이 있으면 견본도 그 부품을 import한다. 공통 개선을 회수할 때에는 지침, 구현, 견본과 검증 결과를 함께 갱신한다.

## 처음 확인할 레퍼런스

| 패턴 지침 | 레퍼런스 코드 | 실행 Story |
| --- | --- | --- |
| [생성 양식](creation-form.md) | [CreationForm](https://github.com/dev-goraebap/goraebap-workflow/blob/main/frontend/reference/CreationForm.tsx) | [기본·단계형](https://github.com/dev-goraebap/goraebap-workflow/blob/main/frontend/reference/CreationForm.stories.tsx) |
| [공통 다이얼로그](dialog.md) | [ReferenceDialog](https://github.com/dev-goraebap/goraebap-workflow/blob/main/frontend/reference/ReferenceDialog.tsx) | [본문·푸터·키보드](https://github.com/dev-goraebap/goraebap-workflow/blob/main/frontend/reference/Dialog.stories.tsx) |
| [앱 레이아웃](app-layout.md) | [WorkspaceShell](https://github.com/dev-goraebap/goraebap-workflow/blob/main/frontend/reference/WorkspaceShell.tsx) | [Split·Inset·모바일](https://github.com/dev-goraebap/goraebap-workflow/blob/main/frontend/reference/AppLayout.stories.tsx) |
| [라우트 마스킹](route-masking.md) | [RoutedPanel](https://github.com/dev-goraebap/goraebap-workflow/blob/main/frontend/reference/RoutedPanel.ts) | [목록·직접 진입](https://github.com/dev-goraebap/goraebap-workflow/blob/main/frontend/reference/RouteMasking.stories.tsx) |

## 원본과 갱신

SKILL.md는 필요한 지침을 찾는 입구다. references의 Markdown은 판단 기준과 검증할 동작을 소유한다. MDX는 그 Markdown을 import하고 실제 코드와 Story를 연결한다. 같은 규칙을 MDX에 다시 작성하지 않는다. Story의 args는 허용한 변형, play는 사용자 행동과 결과를 표현한다.

컴포넌트 API를 바꾸면 해당 Story와 검증도 고친다. 규칙을 바꾸면 Markdown을 고치고 같은 MDX에서 결과를 확인한다. 색·간격을 Story 전용 CSS로 보정하지 않고 실제 테마·부품에서 고친다. 제품에 같은 부품이 있으면 Story는 제품 부품을 import하고 가상 데이터와 시작 상태만 연결한다.

레퍼런스 코드는 공개 저장소의 frontend에서 관리하며 플러그인 패키지에 포함하지 않는다. 설치된 지침에서 코드 링크를 따라 필요한 구현만 읽는다. 로컬 체크아웃이 있다면 같은 파일을 직접 읽어도 된다. 패딩·슬롯·상태 경계를 재현할 때 필요한 범위만 채택한다. 프론트엔드 전체나 제품 API·도메인 데이터를 스킬에 복사하지 않는다. 라이브러리 자체의 기본 부품을 다시 구현하지 않는다. 프로젝트에 채택한 코드는 그 프로젝트 소유이며 원본 스킬에서 직접 import하지 않는다.

## 실행과 검토

워크플로우 원본 저장소에서 npm ci 후 npm run patterns로 Storybook을 연다. npm run patterns:check, npm run patterns:build로 타입과 정적 출력을 확인한다. npm run patterns:test는 같은 Story를 Chromium에서 실행한다. 테스트용 브라우저가 없으면 npx playwright install chromium으로 준비한다.

라이트·다크는 Storybook 전역 테마 도구로 전환한다. 모드별 Story나 견본 내부의 별도 테마 상태를 만들지 않는다. 화면·초안·검색 조건을 유지한 채 같은 견본을 두 모드에서 확인한다.

화면 크기는 도구 모음, 허용한 변형은 Controls, 조작과 결과는 Interactions, 접근성은 Accessibility에서 확인한다. 라우터·다이얼로그는 독립 iframe 안에서 실행한다. 문서의 대표 예제는 사용자가 조작하기 전에 초점을 옮기거나 화면을 이동시키지 않는다. 자동 play 검증은 이름이 구분된 Story로 연결해 문서 읽기를 방해하지 않게 한다. 자동 검증 결과와 사람이 확인한 시각·키보드·실기기 범위를 구분해 기록한다. 시각 회귀 기준은 검토한 이미지와 고정된 데이터·날짜·폰트·화면 크기로 관리한다.

프로젝트의 비밀값·실제 계정·업무 데이터를 Story에 넣지 않는다. 서버 응답이 필요하면 경계에서 대체하고, 예제를 실행했다고 실제 업무가 생성되지 않게 한다. Storybook은 개발·검토 도구이며 제품 빌드에 포함하지 않는다. 비교 출처와 제작 기록은 개발용 비공개 자료에 둔다.

## 견본의 배치와 높이

기본 부품은 실제 크기로 중앙에 배치한다. 크기·변형·상태는 같은 조건에서 나란히 비교하고, 설명과 여백은 견본 바깥에서 제공한다. 문서의 단일 부품 견본은 약 180px, 비교 행은 줄바꿈을 고려해 필요한 높이만 둔다. 모든 견본에 전체 화면 높이를 적용하지 않는다.

조합 부품은 검토할 동작에 필요한 맥락만 둔다. 다이얼로그·팝오버는 열기 버튼과 해당 조합만 보여주며 가짜 사이드바·헤더·목록을 배경으로 만들지 않는다. 다이얼로그는 문서의 독립 iframe에서도 열고 스크롤·닫기를 확인할 수 있도록 약 420px의 영역을 확보한다. 긴 본문과 푸터 구분선도 사용자가 버튼으로 연다.

빈 상태·페이지 배치처럼 공간 자체를 검토하는 견본과 전체 화면 예제는 충분한 영역을 사용한다. 앱 셸·라우트 마스킹을 설명할 때 필요한 목록과 배경은 유지한다. 작은 부품의 시연에 전체 레이아웃을 재사용하지 않는다.
