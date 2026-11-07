---
name: frontend
description: React·TypeScript 웹 앱의 TanStack Router/Query 데이터 흐름, 폼 초안과 화면 전환을 구현합니다. 페이지·컴포넌트·프론트 상태를 만들거나 고칠 때 사용합니다.
---

# 프론트엔드

기본 조합은 React·TypeScript·Vite·TanStack Router/Query입니다. 파일 구조는 공식 `feature-sliced-design` 스킬을 따릅니다. 프로젝트가 다른 스택을 채택했다면 기존 선택을 따르며 전환을 작업에 끼워 넣지 않습니다.

- [코드 작성](references/structure.md): 컴포넌트·훅·Effect를 다룰 때 읽습니다.
- [상태와 데이터 흐름](references/data-flow.md): 조회·변경·폼·라우트를 다룰 때 읽습니다.
- [화면 전환](references/navigation.md): 로딩·목록 복귀·상세 이동을 다룰 때 읽습니다.

화면 패턴을 구현·수정할 때는 디자인 시스템의 [패턴 카탈로그](../design-system/references/pattern-catalog.md)에서 사용 기준·실제 부품·실행 견본을 함께 찾습니다. 견본에는 제품과 같은 라우터·상태 경계를 연결하고 데이터와 시작 상태를 제어합니다.

새 화면이나 시각적 변경은 [디자인 시스템](../design-system/SKILL.md)도 읽습니다. 이 스킬은 코드 배치·상태·URL·비동기 흐름을 소유하고, 부품 선택·테마·레이아웃·반응형 표현은 디자인 시스템 지침을 따릅니다. 같은 규칙을 두 곳에 복제하지 않습니다.

경로·개발 포트·로그인 방법·검사 명령은 프로젝트의 실제 설정에서 확인합니다. 완료 시 프로젝트 검사와 바뀐 사용자 동작을 확인합니다.
