---
name: design-system
description: shadcn/ui(Base UI)와 Tailwind CSS v4 기반 웹 앱에서 테마·아이콘·부품 조합·앱 셸·페이지 배치·반응형과 화면 상호작용을 일관되게 구현합니다. 부품·스타일·테마·레이아웃·화면 패턴을 만들거나 바꿀 때 사용합니다.
arc42: "8.5, 2"
---

# 디자인 시스템

프로젝트가 정한 디자인·기존 부품·사용자가 준 참고 화면을 우선합니다. 별도 지정이 없으면 shadcn/ui(Base UI, `base-nova`)·Tailwind CSS v4·Solar와 아래 기준·키트를 출발점으로 씁니다. 기본값을 다른 디자인 시스템으로 바꾸는 권한으로 해석하지 않습니다.

공통 지침은 화면의 구성·상태·반응형·상호작용을 다룹니다. 부품 사용법(조합, 폼 `Field`, `render`, 아이콘의 `data-icon`, `gap-*` 간격, `size-*` 등)은 shadcn 공식 스킬과 shadcn MCP가 맡고, 이 지침은 면 단계·휴대폰 규칙·로딩 방식·대화상자 ↔ 페이지·문구 같은 Webcraft 규칙을 맡습니다. 둘이 다르면 Webcraft 규칙이 우선이고, 부품 API는 shadcn 문서를 따릅니다. 특정 제품의 업무 단계·문서 종류·권한·저장 계약은 프로젝트 지침에 둡니다. 프로젝트 사례를 공통 원본으로 가져올 때는 재사용할 화면 구조와 동작만 추출합니다.

| 작업 | 읽을 자료 |
| --- | --- |
| 색·상태 표현·라이트·다크 | [테마와 색상](references/theme.md) |
| 글자 크기·숫자·넘침 | [글자](references/typography.md) |
| 치수·분기점·정렬선·확대 | [간격과 크기](references/spacing.md) |
| 면 단계·선·그림자·모서리·점 무늬 | [면과 경계](references/surfaces.md) |
| Solar 선택·크기·정렬·접근성 | [아이콘](references/icons.md) |
| 움직임·동작 줄이기 | [모션](references/motion.md) |
| 버튼·라벨·아바타·입력 | [Primitives](references/basic-components.md) |
| 팝오버·시트·메뉴·속성 알약·올리기·본문 칸 | [Composites](references/composed-components.md) |
| 대화상자·확인 창·짧은 양식 | [공통 다이얼로그](references/dialog.md) |
| 검색·필터·표시 도구 | [검색·필터·표시](references/search-filter.md) |
| 앱 셸·사이드바·모바일 탐색 | [앱 셸](references/app-layout.md) |
| 페이지 머리·툴바·목록·상세·설정·옆 패널 | [페이지 배치](references/layout-patterns.md) |
| 제목·본문 작성과 초안 | [생성 양식](references/creation-form.md) |
| 목록 위 대화상자와 주소 | [라우트 마스킹](references/route-masking.md) |
| 목록 옆 미리보기와 행 클릭 | [미리보기 패널](references/peek.md) |
| 대기·빈 상태·실패·전환 | [데이터 상태](references/data-states.md) |
| 표면 고르기·누르는 대상·키보드 | [입력과 상호작용](references/interaction-patterns.md) |
| UI 문구·본문 편집·검증 | [문구·본문과 검증](references/content-and-review.md) |
| 본문 인쇄·PDF 저장 | [인쇄와 PDF](references/print.md) |
| 지침·코드·가이드 견본의 연결 | [패턴 카탈로그](references/pattern-catalog.md) |
| 프로젝트 지정이 없는 기본 화면 | [레퍼런스 사용과 갱신](references/reference-kit.md) |

규칙 본문은 각 자료가 소유합니다. URL·서버 데이터·초안의 소유는 frontend, 모양과 부품 조합은 이 스킬이 담당합니다. 화면을 만들거나 고칠 때 문구도 설계 대상으로 검토합니다.

레퍼런스 코드는 플러그인에 포함하지 않고 공개 저장소의 [키트](https://github.com/dev-goraebap/dev.goraebap/blob/main/apps/site/src/shared/ui/README.md)에 있으며, shadcn 레지스트리 `@webcraft`로 배포합니다. 설치·동기화만으로 제품 소스에 복사하지 않습니다. 실제 채택할 때만 필요한 항목을 `npx shadcn@latest add @webcraft/<이름>`으로 받아 프로젝트의 소유 코드로 둡니다. 기존 프로젝트와 공통 원본의 변경을 자동으로 서로 전파하지 않습니다.

완료 시 바뀐 화면의 데스크톱·휴대폰, 제공하는 테마 모드, 포커스·키보드·확대 상태를 확인합니다. 특정 버전의 버그와 우회는 프로젝트 규칙에 둡니다.
