# dev-goraebap 사이트

블로그와 Webcraft 가이드를 하나의 Vite·React·TanStack Router·MDX 앱으로 제공합니다. 상단의 영역 선택에서 Blog와 Webcraft를 전환합니다. `/`는 `/blog/`로 연결하고, Webcraft 지침과 실행 견본은 `/webcraft/` 아래에서 제공합니다.

## 실행과 검사

저장소 루트에서 실행합니다.

```text
npm ci
npm run site
npm run site:check
npm run site:test
npm run site:build
npm run site:preview
```

개발·미리보기 기본 포트는 4451입니다. 실행 중인 서버가 있으면 다른 포트를 지정할 수 있습니다. 빌드 결과는 `site/dist/`이며, 블로그·문서를 직접 열거나 새로고침할 때도 경로를 찾도록 주소별 HTML을 생성합니다. 알 수 없는 주소는 `404.html`로 처리합니다.

## 코드와 콘텐츠

| 위치 | 역할 |
| --- | --- |
| `src/app/` | 앱 시작·라우터·MDX 제공자 |
| `src/pages/` | 블로그 목록과 문서 읽기 화면 |
| `src/widgets/` | 사이트 셸·영역별 탐색·견본 표시 |
| `src/entities/` | 글과 문서의 목록·본문 조회 |
| `src/shared/` | 공통 UI·스타일·브랜드·도표·로딩 |
| `samples/` | 실제 메모리 라우터와 모의 데이터를 가진 실행 견본·테스트 |
| `content/blog/posts/` | 게시글 Markdown과 원본 이미지 |
| `content/` | Webcraft 화면 해설 MDX |
| `content-plugin.ts` | 스킬 원본과 사이트 콘텐츠에서 문서 목록·주소를 생성하는 빌드 도구 |
| `scripts/` | 아이콘 생성과 정적 배포 주소 생성 |

`features`는 독립된 사용자 기능이 생길 때 추가합니다. 상위 계층은 하위 계층을 사용하며 슬라이스 간 참조는 공개 진입점을 통합니다. 견본의 실행 진입점은 `sample.html`이고, 블로그·가이드의 실제 사이트 진입점은 `index.html` 하나입니다.

Webcraft의 규칙 원본은 `plugins/webcraft/skills/`입니다. 사이트에는 지침 사본을 두지 않습니다. 공통 UI의 사용 기준은 [UI 안내](src/shared/ui/README.md)를 확인합니다.

## 블로그 글 추가

`content/blog/posts/<slug>/index.md`에 글을 두고 이미지는 같은 폴더의 `assets/`에 둡니다. 기존 블로그에서 가져온 글 4편은 본문을 그대로 보존합니다. 외부 아키텍처 서브모듈 문서는 이번 이관에 포함하지 않습니다.

글의 frontmatter에는 `title`, `description`, `date`, `tags`, `published`를 적고, 필요하면 `updated`와 `cover`를 더합니다. `published: false`인 글은 공개 목록에 넣지 않습니다. `date`와 `updated`는 `YYYY-MM-DD` 형식을 사용합니다. 글의 새 주소는 `/blog/<slug>/`이며 이전 `/posts/<slug>` 주소도 새 주소로 연결합니다.

이미지는 `assets/` 원본을 사용합니다. 배포 시 빌드 도구가 원본 자산을 공개 경로로 복사합니다. 대표 이미지가 있으면 원본을 목록에 사용하며, 기존 최적화 이미지가 있으면 우선 사용합니다. Mermaid 코드 블록은 읽을 때 도표로 그리며 도표 원문도 펼쳐 볼 수 있습니다.

## 배포

GitHub Actions의 `Publish site`가 `main` 푸시 또는 수동 실행으로 타입·지침·패키지를 검사하고 빌드한 뒤 GitHub Pages에 배포합니다. 저장소는 `dev-goraebap/dev.goraebap`, 사용자 도메인은 `goraebap.xyz`입니다. GitHub Pages 설정에서도 이 도메인을 연결해야 하며, 파일만 추가해서 연결된 것으로 판단하지 않습니다.
