---
disable-model-invocation: true
name: design-system
description: Astryx 기반 웹 앱에서 부품 선택, 테마, Solar 아이콘과 반응형 화면을 일관되게 구현한다. 부품·스타일·테마·아이콘을 만들거나 바꿀 때 사용한다.
---

# 디자인 시스템

프로젝트가 정한 디자인·기존 부품·사용자가 준 참고 화면을 우선한다. 별도 지정이 없으면 Astryx·Solar와 아래 앱 셸·화면 패턴 레퍼런스를 출발점으로 사용한다. 기본값을 다른 디자인 시스템으로의 전환 권한으로 해석하지 않는다.

공통 지침과 견본은 Astryx를 사용하는 화면 구성·상태·반응형·상호작용을 다룬다. 특정 제품의 업무 단계·문서 종류·권한·저장 계약은 프로젝트 지침과 Story에 둔다. 프로젝트 사례를 공통 원본으로 가져올 때는 재사용할 UI 구조와 동작만 추출한다.

| 작업 | 읽을 자료 |
| --- | --- |
| 부품 선택·props·테마·버전 확인 | [Astryx 작업 절차](references/astryx-workflow.md) |
| 면·간격·글자·크기 | [기본 표현](references/foundations.md) |
| 테마·색상·변형의 적용 경계 | [테마와 색상](references/theme.md) |
| Solar 선택·크기·정렬·접근성 | [아이콘](references/icons.md) |
| 버튼·뱃지·아바타·입력·Dialog | [기본 부품](references/basic-components.md) |
| 공통 다이얼로그·검색 도구·선택 메뉴·빈 상태 | [조합 부품](references/composed-components.md) |
| 셸·페이지·목록·설정·상세 | [화면 구성](references/layout-patterns.md) |
| 필터·검색·선택·양식·팝업 | [입력과 상호작용](references/interaction-patterns.md) |
| UI 문구·본문·피드백·플레이그라운드·검증 | [문구·본문과 검증](references/content-and-review.md) |
| 프로젝트 지정이 없는 기본 화면 | [레퍼런스 사용과 갱신](references/reference-kit.md) |
| 지침·구현·Storybook 견본 연결과 패턴 검토 | [패턴 카탈로그](references/pattern-catalog.md) |

규칙 본문은 각 자료가 소유한다. URL·서버 데이터·초안은 frontend, 모양과 부품 조합은 이 스킬이 담당한다. 화면 작업에서 함께 읽을 자료는 개발 입구가 연결한다.

화면을 만들거나 고칠 때 문구도 설계 대상으로 검토한다. 사용자에게 필요한 정보와 제작자를 위한 설명을 구분하는 기준은 위 문구·본문 지침을 따른다.

레퍼런스 코드는 플러그인에 포함하지 않고 공개 저장소의 [workspace 키트](https://github.com/dev-goraebap/goraebap-workflow/blob/main/frontend/reference/README.md)에 있다. 설치·동기화만으로 제품 소스에 복사하지 않는다. 필요한 패턴을 읽고 실제 채택할 때만 프로젝트의 소유 코드로 옮긴다. 기존 프로젝트와 공통 원본의 변경을 자동으로 서로 전파하지 않는다.

완료 시 바뀐 화면의 데스크톱·휴대폰, 제공하는 테마 모드, 포커스·키보드·확대 상태를 확인한다. 특정 버전의 버그와 우회는 프로젝트 규칙에 둔다.
