---
name: frontend-uiux
description: "사용자가 명시적으로 호출했을 때만 사용합니다. 웹 앱의 테마·글자·간격·면 위계·아이콘, 기본·조합 컴포넌트, 앱 셸·페이지 배치·리소스 화면 패턴과 화면 문구를 일관되게 구현합니다. 컴포넌트·스타일·테마·레이아웃·화면 패턴을 만들거나 바꿀 때 사용합니다."
---

# 프론트엔드 UI/UX (디자인 시스템)

프로젝트가 정한 디자인·기존 컴포넌트·사용자가 준 참고 화면을 우선합니다. 별도 지정이 없으면 아래 기준을 출발점으로 씁니다. 문서 폴더마다 공통 글 `index.md`를 먼저 읽고, 프로젝트 스택에 맞는 구현 파일(`react.md`·`angular.md`)이 있으면 그것만 함께 읽습니다.

## 요청 분류 (플레이북)

먼저 사용자 요청을 아래 플레이북 중 하나로 분류해 실행합니다.

| 요청 유형 | 플레이북 |
| - | - |
| 디자인 시스템 레지스트리 받기·테마 연결·원본 갱신 | [디자인 시스템 받기와 갱신](playbooks/packages/index.md) |
| 새 화면·리소스 목록/상세/생성·레이아웃·패턴 UI 설계 및 구현 | [새 화면·리소스 UI 설계](playbooks/new-screen-ui/index.md) |
| 기존 화면의 시각 위계·문구·반응형·다크모드·접근성 점검 및 다듬기 | [화면 다듬기와 검증](playbooks/ui-review/index.md) |

해당하는 플레이북이 없는 단일 수정·질문·규격 확인은 아래 레퍼런스에서 필요한 문서만 직접 읽습니다.

## 레퍼런스 (직접 참조)

### 파운데이션

- [테마와 색상](reference/theme/index.md): 색·상태 표현·라이트·다크와 테마 적용 범위
- [글자](reference/typography/index.md): 글자 크기·글꼴·숫자·넘침
- [간격과 크기](reference/spacing/index.md): 치수·분기점·정렬선·확대
- [면과 경계](reference/surfaces/index.md): 면 단계·선·그림자·모서리·점 무늬
- [아이콘](reference/icons/index.md): 아이콘 선택·크기·정렬·접근성
- [스타일 레시피](reference/recipes/index.md): 컴포넌트 외형과 변형 레시피
- [움직임](reference/motion/index.md): 화면 전환 효과, 시간, 동작 줄이기
- [화면 크기와 rem](reference/ui-size/index.md): 큰 화면 자동 확대, 화면 크기 설정, rem과 px
- [스크롤바](reference/scrollbar/index.md): 스크롤바 거터, 얇은 스크롤바, 부드러운 스크롤

### 레이아웃

- [앱 셸과 모바일 탐색](reference/app-shell/index.md): 앱 셸·공간·사이드바·휴대폰 탐색
- [페이지 배치](reference/page-layout/index.md): 페이지 머리·칸 머리·툴바·목록·표·상세·설정·작성·옆 패널

### 패턴

- [대화상자](reference/dialog/index.md): 대화상자·확인 창·짧은 양식
- [검색·필터·표시](reference/search-filter/index.md): 목록의 검색·필터·표시 도구
- [생성 양식](reference/creation-form/index.md): 제목·본문 작성 양식과 초안
- [리소스 화면 패턴](reference/resource-patterns/index.md): 리소스의 목록·상세·생성·수정 패턴
- [문구·본문과 검증](reference/content-and-review/index.md): UI 문구, 본문 읽기·편집, 화면 검증
- [인쇄와 PDF](reference/print/index.md): 본문 인쇄와 PDF 저장
- [화면 상태](reference/ui-states/index.md): 빈 상태·결과 없음·없는 대상·실패 화면과 오류 알림
- [대기와 크기 전환](reference/loading-feedback/index.md): 대화상자 데이터 준비, 높이 전환, 사진 자리
- [적응형 UI](reference/adaptive-ui/index.md): 휴대폰 표면 고르기, 터치 영역, 선택 칸, 키보드, 순서 바꾸기
- [패턴의 글과 코드](reference/pattern-catalog/index.md): 지침과 코드의 연결, 화면 규칙 검사

### 컴포넌트 기준

- [기본 컴포넌트](reference/primitives/index.md): 버튼·라벨·아바타·입력
- [조합 컴포넌트](reference/composites/index.md): 팝오버·시트·메뉴·속성 칩·올리기·본문 칸·문서 편집기
- [컴포넌트 목록](reference/component-list/index.md): 개별 컴포넌트 37종의 쓰임·구성·변형·접근성 목록 (필요한 컴포넌트 하나만 열어 읽음)

## 맡는 범위

공통 지침은 화면의 구성·상태·반응형·상호작용을 다루고, 개별 UI 라이브러리의 세부 API는 공식 문서를 따릅니다. URL·서버 데이터·초안 소유와 라우트 마스킹은 [프론트엔드 라우팅 레퍼런스](../frontend-engineering/reference/routing/index.md), 모양·컴포넌트 조합·움직임·상태 화면·휴대폰 표면 전환은 이 스킬이 담당합니다. 디자인 시스템 코드는 스킬에 포함하지 않고 레지스트리에서 받습니다([디자인 시스템 받기와 갱신](playbooks/packages/index.md)).

## 성숙도(`maturity`)에 따른 적용 강도

문서 상단에 성숙도가 적혀 있으면 단계에 맞춰 기준을 적용합니다. 성숙도가 생략된 문서는 기본 권장 기준으로 다룹니다.

| `maturity` | 단계 | 적용 강도 |
| --- | --- | --- |
| `stable` | 안정 | 기본 기준 — 프로젝트 규칙에 예외가 없으면 그대로 따름 |
| `refining` | 다듬는 중 | 참고 기준 — 적용을 검토하되 현재 작업 맥락에 맞게 유연하게 판단·확인 |

## 지침 피드백 (마찰 시에만)

정상 작업 중에는 언급하지 않습니다. 지침대로 구현했는데 빌드·런타임 오류가 나거나, 사용자가 지침·디자인 결과물을 명시적으로 거절한 경우에만 해당 턴 끝에 한 줄로 `/fullstack:feedback` 기록 여부를 묻습니다.
