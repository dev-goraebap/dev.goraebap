---
arc42: "8.5"
---

# 테마와 색상

테마는 색·글자·간격·면·경계·모서리와 부품 변형의 기본값을 한 곳에서 정합니다. 프로젝트가 값을 정하지 않았으면 키트의 [토큰 CSS](https://github.com/dev-goraebap/dev.goraebap/blob/main/apps/site/src/app/styles/tailwind.css)(레지스트리의 `@webcraft/theme`)에서 출발합니다. 토큰은 이 파일의 `:root`와 `[data-theme=dark]`에 정의하고 `@theme inline`으로 Tailwind에 노출합니다. 화면은 Tailwind CSS v4 유틸리티와 의미 토큰으로만 칠하며, 별도 CSS 파일·CSS 모듈·StyleX를 쓰지 않습니다.

## 기준 색에서 파생한다

라이트·다크 쌍으로 정하는 기준 색은 바닥(body)·페이지 면(surface)·옅은 채움(muted)·글자 둘·보조 아이콘·강조색뿐입니다. 나머지는 `color-mix`로 글자색을 면 위에 섞어 만듭니다. 화면마다 색을 덧칠해 다른 테마를 만들지 않습니다.

강조색은 글자색과 같은 먹색입니다. 앱 크롬에 브랜드 색조를 두지 않고, 색은 업무 데이터의 분류·상태·그림의 강조에만 씁니다. 업무 데이터의 색(사용자가 고른 색, 분류 색)과 UI 테마 색은 따로 관리합니다.

| 역할 | 토큰 | 기본값(라이트/다크) |
| --- | --- | --- |
| 내부 구분선: 행·표·툴바·카드 테두리 | `--border` | 글자 13% / 11% |
| 바깥 경계: split 선·inset 페이지 외곽·하단 탭 위·입력 칸·필터 칩 | `--input` | 글자 18% / 16% |
| 포인터 아래 | `--accent`, 목록 줄은 `bg-row-hover` | 글자 4% / 5% |
| 고른 값·켜진 도구 채움 | `--secondary`, 메뉴의 지금 자리는 `--pressed` | 글자 10% / 13%, `--pressed`는 7% / 8% |
| 키보드 초점 | `--ring` | 강조색 72%, 부품 경계 안쪽 2px |

두 경계를 하나로 합치면 inset 페이지 외곽과 안쪽 카드 테두리가 같은 무게가 되어 면 단계가 흐려집니다. 대화상자·팝오버 같은 뜬 면은 두 토큰 대신 가는 테두리(`ring-foreground/10`, 글자 10%)를 씁니다.

## 상태의 표현

| 상태 | 표현 |
| --- | --- |
| hover | 행·메뉴·칩은 `--accent`(목록 줄은 `bg-row-hover`), 버튼 변형은 한 단계 진한 채움과 진한 글자 |
| 선택·눌림·열림·현재 위치 | 같은 아이콘의 Bold Duotone과 `view-active`(한 단계 진한 알약, 가는 테두리), `aria-pressed`·`aria-current`·`aria-expanded`를 함께 둡니다 |
| 키보드 초점 | 2px 초점 선. hover 채움으로 대신하지 않습니다. 종이 위에 글을 쓰는 칸(테두리 없는 제목·본문)은 깜빡이는 커서가 초점을 보이므로 초점 선을 더하지 않고, 제출 검사에서 빠진 항목만 붉은 밑줄로 알립니다 |
| 비활성 | 부품의 `disabled:opacity-50`(shadcn 기본)과 기본 커서. 흐림 정도를 부품마다 다르게 정하지 않습니다 |

상태와 선택 여부를 색 하나로만 전달하지 않습니다. 모양(채움 아이콘), 이름, 접근 가능한 상태 속성을 함께 둡니다. 모든 상태를 라이트·다크에서 확인합니다.

눌림은 `aria-pressed`와 버튼 변형 `view-active`로 표현합니다. 키트의 [Button](https://github.com/dev-goraebap/dev.goraebap/blob/main/apps/site/src/shared/ui/button.tsx) 변형은 `default`·`outline`·`secondary`·`ghost`·`destructive`·`link`와 `view`(옅은 알약)·`view-active`(고른 것)·`tool`(둥근 도구)·`create`(페이지의 만들기)입니다. 분류·라벨은 [Badge](https://github.com/dev-goraebap/dev.goraebap/blob/main/apps/site/src/shared/ui/badge.tsx)의 `label` 변형으로 그립니다.

## 휴대폰 크기와 라이트·다크

휴대폰 크기는 [토큰 CSS](https://github.com/dev-goraebap/dev.goraebap/blob/main/apps/site/src/app/styles/tailwind.css)의 `@media (width < 64rem)`와 부품의 `max-md:` 유틸리티로 정합니다.

라이트·다크는 `html[data-theme=dark|light]` 하나가 정하며, Tailwind `dark:` 변형도 이 속성을 봅니다. 색은 토큰에서만 바꾸고 `dark:`로 색을 덮어쓰지 않습니다. 견본과 화면 안에 별도 테마 전환을 두지 않습니다. 아이콘을 고르는 기준은 [아이콘](icons.md), 면의 단계는 [면과 경계](surfaces.md)가 소유합니다.

## 모바일 주변 영역과 테마

PWA를 제공하면 앱 안의 면과 상태바·제스처 영역의 색을 함께 확인합니다. 문서의 `theme-color`와 앱이 그리는 세이프 영역 배경을 현재 테마의 실제 면 색에 맞춥니다. manifest의 기본 색만 고정하고 다크 모드에서도 그대로 쓰지 않습니다. 첫 화면 전에 저장한 모드를 적용하고, 시스템 모드를 쓸 때는 기기의 모드 변경도 따라가게 합니다. 색 값의 원본은 테마 한 곳에 두며 특정 제품의 색을 공통 값으로 복사하지 않습니다.

앱이 그리는 세이프 영역은 `env(safe-area-inset-top)`·`env(safe-area-inset-bottom)`으로 공간을 확보합니다. 브라우저나 OS가 그리는 영역의 최종 표현은 실제 설치 앱에서 확인하고, 브라우저 화면만 확인한 결과와 구분합니다.
