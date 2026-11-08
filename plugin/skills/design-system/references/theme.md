# 테마와 색상

테마는 색·글자·간격·면·경계·모서리와 부품 변형의 기본값을 한 곳에서 정합니다. 프로젝트가 값을 정하지 않았으면 [기본 테마](https://github.com/dev-goraebap/goraebap-workflow/blob/main/kit/reference/foundations/theme.ts)에서 출발합니다. Stone 테마를 확장하며 Astryx 내부 클래스 덮어쓰기와 `!important`를 쓰지 않습니다.

## 기준 색에서 파생한다

라이트·다크 쌍으로 정하는 기준 색은 바닥(body)·페이지 면(surface)·옅은 채움(muted)·글자 둘·보조 아이콘·강조색뿐입니다. 나머지는 `color-mix`로 글자색을 면 위에 섞어 만듭니다. 화면마다 색을 덧칠해 다른 테마를 만들지 않습니다.

강조색은 글자색과 같은 먹색입니다. 앱 크롬에 브랜드 색조를 두지 않고, 색은 업무 데이터의 분류·상태·그림의 강조에만 씁니다. 업무 데이터의 색(사용자가 고른 색, 분류 색)과 UI 테마 색은 따로 관리합니다.

| 역할 | 토큰 | 기본값(라이트/다크) |
| --- | --- | --- |
| 내부 구분선: 행·표·툴바·카드 테두리 | `--color-border` | 글자 13% / 11% |
| 바깥 경계: split 선·inset 페이지 외곽·대화상자·팝오버·하단 탭 위·입력 칸·필터 칩 | `--color-border-emphasized` | 글자 18% / 16% |
| 포인터 아래 | `--color-overlay-hover` | 글자 4% / 5% |
| 고른 값·켜진 도구 채움 | `--color-background-gray` | 글자 10% / 13% |
| 키보드 초점 | `--focus-outline-color` | 강조색 72%, 부품 경계 안쪽 2px |

두 경계를 하나로 합치면 inset 페이지 외곽과 안쪽 카드 테두리가 같은 무게가 되어 면 단계가 흐려집니다.

## 상태의 표현

| 상태 | 표현 |
| --- | --- |
| hover | 행·메뉴·칩은 `overlay-hover`, 버튼 변형은 한 단계 진한 채움과 진한 글자 |
| 선택·눌림·열림·현재 위치 | 같은 아이콘의 Bold Duotone과 `view-active`(한 단계 진한 알약, 가는 테두리), `aria-pressed`·`aria-current`·`aria-expanded`를 함께 둡니다 |
| 키보드 초점 | 2px 초점 선. hover 채움으로 대신하지 않습니다. 종이 위에 글을 쓰는 칸(테두리 없는 제목·본문)은 깜빡이는 커서가 초점을 보이므로 초점 선을 더하지 않고, 제출 검사에서 빠진 항목만 붉은 밑줄로 알립니다 |
| 비활성 | `--color-text-disabled` 글자와 기본 커서. 흐림 정도를 부품마다 다르게 정하지 않습니다 |

상태와 선택 여부를 색 하나로만 전달하지 않습니다. 모양(채움 아이콘), 이름, 접근 가능한 상태 속성을 함께 둡니다. 모든 상태를 라이트·다크에서 확인합니다.

Astryx `ToggleButton`의 눌림 상태는 테마가 칠할 수 없어 버튼 변형으로 표현합니다. `view`(옅은 알약), `view-active`(고른 것), `tool`(둥근 도구), `subtle`(조용한 동작), `box`(사이드바 머리의 상자), `create`(페이지의 만들기)입니다. 새 변형에는 [TypeScript 선언](https://github.com/dev-goraebap/goraebap-workflow/blob/main/kit/reference/foundations/variants.ts)도 둡니다.

## 테마가 하지 못하는 것

테마의 부품 규칙은 `@media`를 받지 않습니다. 휴대폰 크기는 [responsive.css](https://github.com/dev-goraebap/goraebap-workflow/blob/main/kit/reference/foundations/responsive.css) 한 파일에서 Astryx의 안정된 부품 클래스와 토큰으로만 정합니다. Astryx 토큰이 아닌 앱 값(그림 강조색, 점 무늬 색)은 모든 화면이 놓이는 `app-shell`에 `--app-*`로 둡니다.

라이트·다크는 앱 루트의 `Theme mode` 하나가 정합니다. 견본과 화면 안에 별도 테마 전환을 두지 않습니다. 아이콘을 고르는 기준은 [아이콘](icons.md), 면의 단계는 [면과 경계](surfaces.md)가 소유합니다.
