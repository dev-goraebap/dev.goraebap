# 지침 사이트 (`web/apps/blog`)

`web/apps/blog`는 지침과 아티클을 사람이 읽는 사이트(`dev.goraebap.xyz`)입니다. 메뉴 목록과 각 메뉴에 속한 주소는 `src/shared/config/site-menus.ts` 한 곳에 있고, 헤더·랜딩·푸터가 모두 이것을 읽습니다.

- 상단 중앙 메뉴: `블로그` · `프론트엔드` · `백엔드` (`HEADER_MENUS`)
- 상단 우측 유틸리티: `Agents` (`/agents`), 디자인 설정, 통합 검색(`Cmd+K`)
- 프론트엔드 사이드바 최상단 스티키 탭: `엔지니어링` (`/frontend`) | `디자인 시스템 Beta` (`/design-system/overview`)

## 두 가지 문서 엔진

- **Diátaxis 순수 마크다운 (`/frontend`, `/backend`, `/agents`)**: `src/entities/diataxis-doc/`가 `content/{frontend,backend,agents}/{tutorials,playbooks,articles,reference}/**/*.md`를 읽어 렌더링합니다. 공통(`index.md`)과 스택 파일(`<stack>.md`)을 우측 레일(데스크톱)과 상단 필(모바일)로 전환합니다.
- **MDX 메뉴 (`/design-system`, `/blog`)**: `src/entities/content-doc/`가 `content/design-system/`의 `.mdx`와 `<Slot>/<Fill>` 스택 파일, 라이브 데모(`react-tanstack-demo`, `angular-demo` iframe)를 렌더링합니다.
- **통합 용어집 (`/glossary`)**: `content/glossary/*.md`를 단일 폴더에서 파싱해 4열 테이블 뷰와 본문 용어 팝오버에 연결합니다.

## 함께 고칠 곳

- 문서를 더하거나 주소를 옮기면 검색 목록(`src/widgets/doc-search/model/search-index.ts`), 정적 프리렌더 목록(`src/app/entry-server.tsx`), 예전 주소 리다이렉트(`src/pages/__root.tsx`)를 함께 확인합니다.
- 메뉴를 바꾸거나 추가할 때는 `src/shared/config/site-menus.ts`를 수정합니다.
- 정적 프리렌더 대상 컴포넌트는 모듈 로드나 렌더 중에 `window`·`document`·`localStorage`를 직접 참조하지 않습니다.

## 실행과 검사

- 로컬 개발: 루트에서 `sh dev.sh [all|blog|react-demo|angular-demo]`
- 검사·빌드: `web/`에서 `pnpm lint`, `pnpm typecheck`, `pnpm build`(레지스트리 + 블로그 + React·Angular 데모 통합)

## 배포

사용자가 요청한 범위에서만 루트에서 `deploy/blog.sh`로 배포합니다(`deploy/blog.sh <ref>`, `--local`, `--rollback`).
