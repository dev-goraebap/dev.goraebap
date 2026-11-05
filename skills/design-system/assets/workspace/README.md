# 업무용 화면 레퍼런스 · revision 2

프로젝트에 별도로 정한 디자인이 없을 때 검토하는 선택형 예제다. 제품에 자동 설치되는 UI 라이브러리가 아니다. 스킬 설치는 이 폴더를 스킬 내부에만 보관하며, 실제 화면에 적용할지는 프로젝트에서 결정한다.

## 구성

| 파일 | 참고할 것 |
| --- | --- |
| [WorkspaceShell](WorkspaceShell.tsx) | inset·split 셸, 모바일 탐색과 상세 화면 분리 |
| [Page](Page.tsx) | 경로·액션·보기·도구·적용 필터·모바일 액션 슬롯 |
| [FilterBar](FilterBar.tsx) | 제어형 필터 칩과 수정·삭제·추가 콜백 |
| [SettingsPage](SettingsPage.tsx), [SettingsSection](SettingsSection.tsx) | 읽기 폭, 섹션 제목과 카드 목록 |
| [DetailLayout](DetailLayout.tsx) | 넓이에 따라 같은 속성 영역을 옮기는 상세 레이아웃 |
| [ReferenceTheme](ReferenceTheme.tsx), [theme](theme.ts), [variants](variants.ts) | 테마 토큰·변형과 Provider |
| [reference.css](reference.css), [responsive.css](responsive.css) | 자체 레이아웃과 테마로 표현하지 못하는 반응형 규칙 |
| [manifest](manifest.json) | 레퍼런스 판본·확인한 의존 버전·검증 범위 |

## 적용

React 19, Astryx core·theme-stone 0.5.2 기준이다. 프로젝트의 설치 버전과 CLI로 API를 확인한다. 필요한 파일만 프로젝트의 UI·테마 위치로 옮기고 경로와 이름을 맞춘다. 스킬 폴더의 파일을 제품에서 직접 import하지 않는다.

앱 입구에서 아래 초기화 CSS를 다른 UI 모듈보다 먼저 한 번 불러오고 `ReferenceTheme`으로 감싼다. reset을 생략하거나 런타임 테마가 먼저 만든 레이어 순서를 그대로 두면 브라우저 기본 버튼·입력 스타일이 부품을 덮을 수 있다.

```css
@layer reset, astryx-base, astryx-theme, app;
@import '@astryxdesign/core/reset.css';
@import '@astryxdesign/core/astryx.css';
```

프로젝트가 이미 레이어 순서를 정했다면 기존 선언에 이 상대 순서를 통합한다. 폰트 로딩, 한국어 i18n, Layer Provider, 라우터 Link 연동은 프로젝트의 Astryx 초기화에 맞춘다. 기존 Provider와 테마가 있으면 필요한 토큰·변형만 검토해서 반영한다. 이 테마는 개발용 런타임 주입을 사용한다. 제품 배포 전에는 설치한 CLI의 theme build 절차로 사전 생성 여부를 검토한다.

`WorkspaceShell`에 탐색 UI를, `Page`의 슬롯에 실제 버튼·보기·필터를 전달한다. 페이지 본문의 h1도 호출자가 제공한다. `FilterBar`는 칩 표현 예제다. 속성·값 선택 Popover/Sheet, URL 상태, 옵션 검색, Solar 아이콘 연결은 프로젝트에서 구현한다. 사이드바 리사이즈·설정 저장, 본문 에디터·저장 큐도 포함하지 않는다.

이 코드가 원래 화면의 모든 동작과 픽셀을 재현한다고 가정하지 않는다. 채택 후 라이트·다크, 모바일·데스크톱, 긴 제목, 키보드·포커스, 스크롤과 고정 액션을 실제 화면에서 확인한다.

셸 전환은 같은 본문 부모 구조에서 props·테마 변형만 바꾼다. 모바일 분기에서 Card를 VStack으로 교체하는 식으로 본문을 다시 마운트하면 편집 초안·선택·스크롤 상태가 사라질 수 있다. breakpoint를 넘는 창 크기 변경과 셸 전환 중에도 입력이 유지되는지 확인한다.

## 이후 개선

이 판본은 고정된 출발점이다. 프로젝트에서 고친 UI는 프로젝트 소유다. 새 판본이 나와도 제품 코드는 자동으로 바뀌지 않는다. 채택한 판본과 수정 이유를 프로젝트가 정한 기록에 남기고 필요한 개선만 검토해 가져온다.
