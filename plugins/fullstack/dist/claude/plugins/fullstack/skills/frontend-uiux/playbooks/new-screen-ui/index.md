# 새 화면·리소스 UI 설계

새 화면이나 리소스 UI를 만들 때는 아래 순서로 레퍼런스를 조합해 구조·표면·상태·컴포넌트를 확정합니다. 프로젝트가 이미 정한 디자인이나 참고 화면이 있으면 그것을 우선합니다.

## 1. 앱 외곽과 페이지 배치 확정

1. 화면이 앱 외곽 안에서 어느 위치(공간·사이드바·모바일 탐색)에 속하는지 [앱 셸과 모바일 탐색](../../reference/app-shell/index.md) 기준으로 정합니다.
2. 화면의 본문 유형(목록·표·상세·설정·작성·옆 패널)에 맞춰 [페이지 배치](../../reference/page-layout/index.md)에서 머리글·툴바·본문 구조를 고릅니다.

## 2. 리소스 패턴과 상호작용 표면 선택

1. 리소스의 목록·상세·생성·수정을 어떤 패턴(목록-상세, 드릴다운, 라우팅 모달)으로 오갈지 [리소스 화면 패턴](../../reference/resource-patterns/index.md)에서 정합니다.
2. 필요한 하위 패턴 문서를 함께 확인합니다.
   - 검색·필터·보기 전환이 있으면 [검색·필터·표시](../../reference/search-filter/index.md)
   - 확인 창·짧은 입력이면 [대화상자](../../reference/dialog/index.md)
   - 제목·본문 작성과 초안이 있으면 [생성 양식](../../reference/creation-form/index.md)
   - 인쇄·PDF 출력이 있으면 [인쇄와 PDF](../../reference/print/index.md)
3. URL 소유와 라우팅 마스크 규칙이 함께 걸리면 [프론트엔드 라우팅 레퍼런스](../../../frontend-engineering/reference/routing/index.md)를 함께 확인합니다.

## 3. 상태 화면과 모바일 적응형 전환 설계

1. 빈 상태·검색 결과 없음·없는 대상·실패 화면과 오류 알림의 자리는 [화면 상태](../../reference/ui-states/index.md)를 따릅니다.
2. 데이터 준비 대기, 높이 전환, 이미지 자리는 [대기와 크기 전환](../../reference/loading-feedback/index.md)을 따릅니다.
3. 모바일 화면에서 시트·드로어·터치 영역·키보드 대응이 필요하면 [적응형 UI](../../reference/adaptive-ui/index.md)를 따릅니다.

## 4. 파운데이션과 컴포넌트 선택

1. 색·면 위계·간격·글자·아이콘은 직접 값을 쓰지 않고 [테마와 색상](../../reference/theme/index.md), [면과 경계](../../reference/surfaces/index.md), [간격과 크기](../../reference/spacing/index.md), [글자](../../reference/typography/index.md), [아이콘](../../reference/icons/index.md) 기준을 따릅니다.
2. 개별 컴포넌트의 쓰임과 변형은 [기본 컴포넌트](../../reference/primitives/index.md), [조합 컴포넌트](../../reference/composites/index.md), [컴포넌트 목록](../../reference/component-list/index.md)에서 필요한 항목만 열어 확인합니다.

## 5. 마무리 검증

화면 구현을 마치면 [화면 다듬기와 검증](../ui-review/index.md) 체크리스트로 데스크톱·모바일, 라이트·다크 테마, 키보드·문구 상태를 확인합니다.
