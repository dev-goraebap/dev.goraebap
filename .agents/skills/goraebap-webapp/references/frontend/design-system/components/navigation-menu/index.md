# Navigation Menu

상단 헤더에서 여러 페이지 링크와 하위 카테고리 패널을 묶어 제공하는 사이트 전역 탐색에 씁니다. 링크 수가 많고 하위 설명이나 묶음을 펼쳐 보여 주어야 할 때 적합합니다.

스택별 구현: [react.md](react.md#usage) · [angular.md](angular.md#usage)의 「usage」 절

## 구성

| 부분 | 역할 |
| - | - |
| NavigationMenu | 전역 탐색의 열림 상태와 패널 전환을 관리하는 최상위 nav 컨테이너입니다. |
| NavigationMenuList | 상위 탐색 항목들을 가로로 나열하는 목록입니다. |
| NavigationMenuItem | 개별 링크나 드롭다운 항목 하나를 감싸는 단위입니다. |
| NavigationMenuTrigger | 하위 탐색 패널을 여는 상위 메뉴 버튼입니다. |
| NavigationMenuContent | 하위 링크와 설명을 배치하는 드롭다운 패널 내용입니다. |
| NavigationMenuLink | 실제 페이지로 이동하는 개별 탐색 링크입니다. |
| NavigationMenuViewport | 열린 패널을 부드러운 위치와 크기로 표시하는 뷰포트 영역입니다. |

## 접근성

| 키 | 동작 |
| - | - |
| Tab | 탐색 트리거와 링크 사이로 포커스를 이동합니다. |
| Enter / Space | 하위 패널을 열거나 선택된 링크로 이동합니다. |
| Esc | 열려 있는 하위 탐색 패널을 닫습니다. |

- NavigationMenu에 aria-label로 '주요 탐색' 같은 이름을 붙여 다른 nav 영역과 구분합니다.
- 현재 페이지에 해당하는 링크에는 aria-current="page"를 표시하고, 모바일 헤더에서는 Drawer 내부 목록으로 전환합니다.

## 관련 컴포넌트

- [Menubar](../menubar/index.md): 페이지 이동이 아니라 파일·편집 같은 앱 명령 모음은 Menubar를 씁니다.
- [Tabs](../tabs/index.md): 다른 페이지로 이동하지 않고 같은 화면 안의 뷰만 바꿀 때 씁니다.
