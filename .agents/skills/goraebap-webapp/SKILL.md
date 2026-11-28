---
name: goraebap-webapp
description: 웹 앱의 레포 구조·프론트엔드·백엔드 구현 기준입니다. 저장소 폴더 구성, 페이지·컴포넌트·라우트·프론트 상태·서버 데이터 조회, API·모듈·데이터 접근 코드를 만들거나 고칠 때 읽습니다.
metadata:
  version: "0.1"
---

# goraebap-webapp

웹 앱을 구현할 때 따르는 기준입니다. 이 기준이 다른 스킬이나 일반 관례와 다르면 이 기준을 따르고, 프로젝트가 다르게 정한 것은 AGENTS.md의 프로젝트 규칙 표를 따릅니다.

바꾸는 영역의 목록을 먼저 읽고, 작업에 해당하는 문서만 읽습니다. 문서 폴더마다 공통 글 `index.md`를 읽고, 프로젝트 스택에 맞는 구현 파일(프론트엔드 `react-tanstack.md`·`angular.md`, 디자인 시스템 `react.md`·`angular.md`, 백엔드 `springboot.md` 등)이 있으면 그것만 함께 읽습니다. 프로젝트 스택은 AGENTS.md의 goraebap-webapp 블록에 있습니다.

| 영역 | 목록 | 읽을 때 |
| --- | --- | --- |
| 레포 구조 | [references/repo/README.md](references/repo/README.md) | 저장소 폴더 구성, 앱·패키지·서버 배치를 다룰 때 |
| 프론트엔드 | [references/frontend/README.md](references/frontend/README.md) | 페이지·컴포넌트·라우트·프론트 상태·서버 데이터 조회를 다룰 때 |
| 디자인 시스템 | [references/design-system/README.md](references/design-system/README.md) | 테마·간격·컴포넌트·레이아웃·화면 패턴처럼 화면의 모양을 다룰 때 |
| 백엔드 | [references/backend/README.md](references/backend/README.md) | API·모듈·데이터 접근·서버 코드를 다룰 때 |

## 성숙도(`maturity`)에 따른 적용 강도

문서 머리말에 `maturity` 상태 코드가 적혀 있으면 단계에 맞춰 기준을 적용합니다. `maturity`가 생략된 문서는 기본 권장 기준으로 다룹니다.

| `maturity` | 단계 | 적용 강도 |
| --- | --- | --- |
| `stable` | 안정 | 기본 기준 — 프로젝트 규칙 표에 예외가 없으면 그대로 따름 |
| `refining` | 다듬는 중 | 참고 기준 — 적용을 검토하되 현재 작업 맥락에 맞게 유연하게 판단·확인 |
