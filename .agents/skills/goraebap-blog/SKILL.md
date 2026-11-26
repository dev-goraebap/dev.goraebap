---
name: goraebap-blog
description: 지침 사이트 web/apps/blog(dev.goraebap.xyz)의 화면·문서 목록·주소·빌드·배포를 바꿀 때 읽습니다.
---

# 지침 사이트(blog)

`web/apps/blog`는 지침을 사람이 읽는 글로 보이는 사이트(dev.goraebap.xyz)입니다. 공간 없이 헤더 메뉴 Playbooks · Blog · Reference · Design System이 어느 페이지에서나 같고, 글이 없는 메뉴는 보이지 않습니다([ADR 0008](../../../docs/adr/0008-diataxis-site-structure.md)). 메뉴 목록과 각 메뉴에 속한 주소는 `src/shared/config/site-menus.ts` 한 곳에 있고, 헤더·하위 메뉴·랜딩·푸터가 모두 이것을 읽습니다. 사이트에서 먼저 새 규칙을 만들지 않습니다.

## 두 가지 글

- **content 메뉴**(`/reference/frontend`, `/design-system`, `/frontend/interaction`): `content/`의 글이 곧 스킬 원본이고, content 경로가 주소입니다. 사이드바의 스택 선택기로 고른 스택의 글만 보이고, 빌드 때 문서마다 스택별 정적 HTML(`…/<문서>/<스택>/index.html`)을 만듭니다. Reference › Frontend처럼 하위 폴더를 묶음으로 쓰는 메뉴는 `src/entities/content-doc`의 `SECTION_GROUPS`에 묶음 순서를 두고 `ContentSectionShell`로 그립니다. 쓰는 법은 [goraebap-guidelines](../goraebap-guidelines/SKILL.md)에 있습니다.
- **그 밖의 메뉴**(backend): 스킬이 원본이고 사이트가 같은 규칙을 TS 데이터로 풉니다. 스킬을 고치면 그 파일을 `skills` 값으로 가리키는 사이트 문서(`src/entities/webapp-doc/model/catalog.ts`, 그 밖은 `src/entities/code-example/model/page-skills.ts`)를 같은 변경에서 맞춥니다.

## 함께 고칠 곳

- 문서를 더하거나 주소를 옮기면 검색 목록(`src/widgets/doc-search/model/search-index.ts`)과 예전 주소 돌려보내기(`src/pages/__root.tsx`)를 함께 고칩니다.
- 메뉴를 더하거나 글이 생겨 메뉴를 보이게 할 때는 `src/shared/config/site-menus.ts`만 고칩니다.
- 서버에서 미리 그리는 페이지에 쓰이는 코드는 모듈을 읽을 때나 렌더 중에 `window`·`document`·`localStorage`를 바로 쓰지 않습니다. 그러면 빌드의 정적 생성이 멈춥니다.

## 검사

`web/apps/blog`에서 `pnpm typecheck`, `pnpm check:skills`, `pnpm build`(레지스트리, 클라이언트, 정적 생성)를 실행합니다. 저장소 전체는 `web/`에서 `pnpm check`입니다. 로컬 실행은 루트에서 `sh dev.sh blog`입니다.

## 배포

사용자가 요청할 때만 저장소 루트에서 `deploy/blog.sh`로 합니다(`--local`, `<ref>`, `--rollback`). 서버의 nginx는 폴더별 `index.html`을 내보내야(`try_files $uri $uri/ /index.html`) 정적 페이지가 쓰입니다.
