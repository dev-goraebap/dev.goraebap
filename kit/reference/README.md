# workspace 키트

Astryx를 쓰는 업무 앱이 같은 화면 구성과 상호작용을 재현할 수 있도록 고른 공통 UI 구현이다. 사용 기준은 `plugin/skills/design-system/references`의 Markdown이 원본이고, 실행 견본은 `kit/samples`에 있으며 가이드 사이트(`kit/guide`)에서 본다. 이 폴더는 플러그인에 포함하지 않는다.

| 폴더 | 담는 것 |
| --- | --- |
| `foundations` | Stone 확장 테마, 버튼·카드 변형 타입, 휴대폰 크기(responsive.css), 앱 진입 CSS(base.css), 분기점 훅, Solar 아이콘 |
| `composites` | 공통 다이얼로그·확인 창·짧은 양식, 팝오버↔바텀시트, 동작·행 메뉴, 검색, 필터·표시, 속성 알약, 파일 올리기, 상태 화면, 본문 칸, 그룹 머리 |
| `layouts` | 앱 셸(사이드바·하단 탭·더보기), 페이지(머리·배너·툴바·적용 줄·목록·표·읽은 수), 상세, 설정, 옆 패널 |
| `patterns` | 작성 양식과 초안 저장소, 라우트 마스킹·라우터 링크, 목록 조건의 주소, 첫 방문 덮개(BootCover와 index.html에 넣는 Vite 플러그인) |

Astryx 기본 부품은 다시 구현하지 않는다. 폴더끼리는 상대 경로로 이어져 있으므로 채택할 때는 필요한 파일과 그 의존만 프로젝트의 공통 UI 위치로 옮기고 경로를 고친다.

## 채택 순서

1. 앱 진입점에서 `foundations/base.css`를 UI 모듈보다 먼저 읽는다. 레이어 순서(reset → astryx-base → astryx-theme), 글꼴(Pretendard Variable·JetBrains Mono Variable), 휴대폰 크기·스크롤바·큰 화면 배율이 함께 온다. 글꼴 패키지 `pretendard`와 `@fontsource-variable/jetbrains-mono`를 함께 설치한다. 빠지면 Windows에서 맑은 고딕으로 대체되어 작은 글자가 흐려 보인다.
2. 루트를 `ReferenceTheme`(라이트·다크는 앱의 설정 하나)과 라우터 루트의 `LinkProvider component={RouterLink}`로 감싼다.
3. 작성 양식을 쓰면 라우터보다 위에 `DraftProvider`를 둔다.
4. 첫 방문 덮개: `vite.config`에 `bootCover({ mark, modeKey })`를 넣고, 앱 루트에 `BootCover`를 두어 첫 경로가 풀리면 `isReady`로 걷는다. 그림은 제품의 표시로 바꾼다.
5. 아이콘 이름을 더하면 `kit/scripts/generate-icons.mjs`의 매핑을 고치고 `npm run kit:icons`를 실행한다.

## 검증 범위

자동 검사(타입·견본 그리기·조작 검증)와 브라우저 확인 범위는 `manifest.json`에 기록한다. 실기기 키보드·화면 낭독기·실제 서버 연동은 채택한 프로젝트에서 확인한다.
