---
disable-model-invocation: true
name: design-system
description: 웹 앱의 테마·아이콘·부품 조합·앱 셸·페이지 배치·반응형과 화면 상호작용을 일관되게 구현합니다. 부품·스타일·테마·레이아웃·화면 패턴을 만들거나 바꿀 때 사용합니다.
arc42: "8.5, 2"
---

# 디자인 시스템

프로젝트가 정한 디자인·기존 부품·사용자가 준 참고 화면을 우선합니다. 별도 지정이 없으면 예제가 채택한 부품 라이브러리·스타일 도구·아이콘 세트와 아래 기준·참고 키트를 출발점으로 씁니다. 기본값을 다른 디자인 시스템으로 바꾸는 권한으로 해석하지 않습니다.

## 예제

이 지침은 판단 기준만 담고 구현은 담지 않습니다. 프로젝트 AGENTS.md의 `Webcraft 예제:` 줄이 가리키는 예제에서 같은 영역 파일(`design-system.md`)을 함께 읽습니다. 예제 목록은 [예제](../goraebap-mode/examples/README.md)에 있습니다. 지금 있는 예제는 cowork이며 이 영역 파일은 [cowork: 디자인 시스템](../goraebap-mode/examples/cowork/design-system.md)입니다. 예제와 프로젝트 AGENTS.md가 다르면 AGENTS.md를 따릅니다.

## 맡는 범위

공통 지침은 화면의 구성·상태·반응형·상호작용을 다룹니다. 부품 하나의 API(조합 방법, 폼 칸 묶기, 요소 바꾸기, 아이콘 넣는 법, 간격 유틸리티 등)는 프로젝트가 채택한 부품 라이브러리의 공식 문서와 도구가 맡고, 이 지침은 면 단계·휴대폰 규칙·로딩 방식·대화상자 ↔ 페이지·문구 같은 Webcraft 규칙을 맡습니다. 둘이 다르면 Webcraft 규칙이 우선이고, 부품 API는 라이브러리 문서를 따릅니다. 특정 제품의 업무 단계·문서 종류·권한·저장 계약은 프로젝트 지침에 둡니다. 프로젝트 사례를 공통 원본으로 가져올 때는 재사용할 화면 구조와 동작만 추출합니다.

| 작업 | 읽을 자료 |
| --- | --- |
| 색·상태 표현·라이트·다크 | [테마와 색상](references/theme.md) |
| 글자 크기·숫자·넘침 | [글자](references/typography.md) |
| 치수·분기점·정렬선·확대 | [간격과 크기](references/spacing.md) |
| 면 단계·선·그림자·모서리·점 무늬 | [면과 경계](references/surfaces.md) |
| 아이콘 선택·크기·정렬·접근성 | [아이콘](references/icons.md) |
| 움직임·동작 줄이기 | [모션](references/motion.md) |
| 버튼·라벨·아바타·입력 | [Primitives](references/basic-components.md) |
| 팝오버·시트·메뉴·속성 알약·올리기·본문 칸 | [Composites](references/composed-components.md) |
| 대화상자·확인 창·짧은 양식 | [공통 다이얼로그](references/dialog.md) |
| 검색·필터·표시 도구 | [검색·필터·표시](references/search-filter.md) |
| 앱 셸·공간·사이드바·모바일 탐색 | [앱 셸](references/app-layout.md) |
| 리소스의 목록·상세·생성·수정을 띄울 곳과 오가는 방식 | [리소스 화면 패턴](references/resource-patterns.md) |
| 페이지 머리·칸 머리·툴바·목록·표·상세·설정·옆 패널의 모양 | [페이지 배치](references/layout-patterns.md) |
| 제목·본문 작성과 초안 | [생성 양식](references/creation-form.md) |
| 목록 위 대화상자와 주소 | [라우트 마스킹](references/route-masking.md) |
| 대기·빈 상태·실패·전환 | [데이터 상태](references/data-states.md) |
| 표면 고르기·누르는 대상·키보드 | [입력과 상호작용](references/interaction-patterns.md) |
| UI 문구·본문 편집·검증 | [문구·본문과 검증](references/content-and-review.md) |
| 본문 인쇄·PDF 저장 | [인쇄와 PDF](references/print.md) |
| 지침과 코드의 연결 | [패턴 카탈로그](references/pattern-catalog.md) |
| 프로젝트 지정이 없는 기본 화면 | [레퍼런스 사용과 갱신](references/reference-kit.md) |

규칙 본문은 각 자료가 소유합니다. URL·서버 데이터·초안의 소유는 frontend, 모양과 부품 조합은 이 스킬이 담당합니다. 화면을 만들거나 고칠 때 문구도 설계 대상으로 검토합니다.

참고 키트의 코드는 플러그인에 포함하지 않으며, 원본은 예제 프로젝트에 있습니다. 설치·동기화만으로 제품 소스에 복사하지 않습니다. 실제 채택할 때만 필요한 부품 파일을 복사해 프로젝트의 소유 코드로 둡니다([레퍼런스 사용과 갱신](references/reference-kit.md)). 기존 프로젝트와 공통 원본의 변경을 자동으로 서로 전파하지 않습니다.

완료 시 바뀐 화면의 데스크톱·휴대폰, 제공하는 테마 모드, 포커스·키보드·확대 상태를 확인합니다. 특정 버전의 버그와 우회는 프로젝트 규칙에 둡니다.
