---
disable-model-invocation: true
name: frontend-design-system
description: 웹 앱의 테마·글자·간격·면 위계·아이콘, 기본·조합 컴포넌트, 앱 셸·페이지 배치·리소스 화면 패턴과 화면 문구를 일관되게 구현합니다. 컴포넌트·스타일·테마·레이아웃·화면 패턴을 만들거나 바꿀 때 사용합니다.
arc42: "8.5, 2"
---

# 디자인 시스템

고정된 디자인 토큰 값을 강제하지 않고, 어떤 UI 라이브러리를 쓰든 지키는 화면 구조·면 위계·반응형 전환·상호작용 기준을 담습니다. 프로젝트가 정한 디자인·기존 컴포넌트·사용자가 준 참고 화면을 우선합니다. 별도 지정이 없으면 예시에서 채택한 컴포넌트 라이브러리·스타일 도구·아이콘 세트와 아래 기준을 출발점으로 씁니다. 기본값을 다른 UI 라이브러리로 바꾸는 권한으로 해석하지 않습니다.

## 예시

구현 모양은 [examples/](examples/)의 주제별 예시에서 프로젝트 스택과 같은 절만 읽습니다([예시 읽기](../goraebap-mode/references/examples.md)).

## 맡는 범위

공통 지침은 화면의 구성·상태·반응형·상호작용을 다룹니다. 컴포넌트 하나의 API(조합 방법, 폼 칸 묶기, 요소 바꾸기, 아이콘 넣는 법, 간격 유틸리티 등)는 프로젝트가 채택한 컴포넌트 라이브러리의 공식 문서와 도구가 맡고, 이 지침은 면 단계·휴대폰 규칙·로딩 방식·대화상자 ↔ 페이지·문구 같은 Webapp 규칙을 맡습니다. 둘이 다르면 Webapp 규칙이 우선이고, 컴포넌트 API는 라이브러리 문서를 따릅니다. 특정 제품의 업무 단계·문서 종류·권한·저장 계약은 프로젝트 지침에 둡니다. 프로젝트 사례를 공통 원본으로 가져올 때는 재사용할 화면 구조와 동작만 추출합니다.

| 작업 | 읽을 자료 |
| --- | --- |
| 색·상태 표현·라이트·다크 | [테마와 색상](references/theme.md) |
| 글자 크기·숫자·넘침 | [글자](references/typography.md) |
| 치수·분기점·정렬선·확대 | [간격과 크기](references/spacing.md) |
| 면 단계·선·그림자·모서리·점 무늬 | [면과 경계](references/surfaces.md) |
| 아이콘 선택·크기·정렬·접근성 | [아이콘](references/icons.md) |
| 버튼·라벨·아바타·입력 | [Primitives](references/basic-components.md) |
| 팝오버·시트·메뉴·속성 칩·올리기·본문 칸 | [Composites](references/composed-components.md) |
| 대화상자·확인 창·짧은 양식 | [공통 다이얼로그](references/dialog.md) |
| 검색·필터·표시 도구 | [검색·필터·표시](references/search-filter.md) |
| 앱 셸·공간·사이드바·모바일 탐색 | [앱 셸](references/app-layout.md) |
| 리소스의 목록·상세·생성·수정을 띄울 곳과 오가는 방식 | [리소스 화면 패턴](references/resource-patterns.md) |
| 페이지 머리·칸 머리·툴바·목록·표·상세·설정·옆 패널의 모양 | [페이지 배치](references/layout-patterns.md) |
| 제목·본문 작성과 초안 | [생성 양식](references/creation-form.md) |
| UI 문구·본문 편집·검증 | [문구·본문과 검증](references/content-and-review.md) |
| 본문 인쇄·PDF 저장 | [인쇄와 PDF](references/print.md) |
| 지침과 코드의 연결 | [패턴 카탈로그](references/pattern-catalog.md) |
| 디자인 시스템 받기·갱신 | [디자인 시스템 받기와 갱신](references/reference-kit.md) |

규칙 본문은 각 자료가 소유합니다. URL·서버 데이터·초안의 소유는 [프론트엔드 엔지니어링](../frontend-engineering/SKILL.md), 움직임·대기와 상태 화면·라우트 마스킹·누르는 동작은 [인터랙션](../frontend-interaction/SKILL.md), 모양과 컴포넌트 조합은 이 스킬이 담당합니다. 화면을 만들거나 고칠 때 문구도 설계 대상으로 검토합니다.

디자인 시스템 코드는 플러그인에 포함하지 않고 레지스트리에서 받습니다. 스타일 레시피 전체와 프로젝트 프레임워크의 어댑터를 통째로 받아 정해진 폴더에 두고, 받은 폴더는 고치지 않으며 원본 커밋으로 갱신을 비교합니다([디자인 시스템 받기와 갱신](references/reference-kit.md)). 설치·동기화만으로 제품 소스에 받지 않고, 공통 원본의 변경을 프로젝트에 자동으로 적용하지 않습니다.

완료 시 바뀐 화면의 데스크톱·휴대폰, 제공하는 테마 모드, 포커스·키보드·확대 상태를 확인합니다. 특정 버전의 버그와 우회는 프로젝트 규칙에 둡니다.
