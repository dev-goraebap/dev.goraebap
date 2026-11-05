---
disable-model-invocation: true
name: frontend
description: React·TypeScript 웹 앱의 페이지 우선 FSD 배치, TanStack Router/Query 데이터 흐름, 폼 초안과 화면 전환을 구현한다. 페이지·컴포넌트·프론트 상태를 만들거나 고칠 때 사용한다.
---

# 프론트엔드

기본 조합은 React·TypeScript·Vite·TanStack Router/Query와 페이지 우선 FSD다. 프로젝트가 다른 스택을 채택했다면 기존 선택을 따르며 전환을 작업에 끼워 넣지 않는다.

- [구조와 코드](references/structure.md): 파일 배치·컴포넌트·공개 API를 바꿀 때 읽는다.
- [상태와 데이터 흐름](references/data-flow.md): 조회·변경·폼·라우트를 다룰 때 읽는다.
- [화면 전환](references/navigation.md): 로딩·목록 복귀·상세 이동을 다룰 때 읽는다.

새 화면이나 시각적 변경은 [디자인 시스템](../design-system/SKILL.md)도 읽는다. 이 스킬은 코드 배치·상태·URL·비동기 흐름을 소유하고, 부품 선택·테마·레이아웃·반응형 표현은 디자인 시스템 지침을 따른다. 같은 규칙을 두 곳에 복제하지 않는다.

경로·개발 포트·로그인 방법·검사 명령은 프로젝트의 실제 설정에서 확인한다. 완료 시 프로젝트 검사와 바뀐 사용자 동작을 확인한다.
