---
arc42: "4, 7"
---

# cowork: 프로젝트

cowork는 프로젝트·업무·문서를 다루는 설치형 작업 공간입니다. 이 파일은 [프로젝트 지침](../../skills/webapp-project/SKILL.md)과 [오픈소스 도입](../../skills/webapp-project/references/open-source.md)을 cowork에 적용한 모양을 담습니다. 저장소 전체 모양은 [개요](overview.md)에 있습니다.

## 스택과 고른 이유

- 서버는 `server/` 한 프로젝트(Java 21·Spring Boot 4.1.1)이고, 화면은 `web/` 한 프로젝트(React·Vite)입니다. 업무 영역은 서버 안의 모듈로 나누고 서비스로 쪼개지 않습니다.
- 배포 단위는 컨테이너 이미지 하나입니다. 서버가 API와 빌드한 화면을 함께 내보내므로 설치하는 쪽은 이미지 하나와 데이터 볼륨 하나만 다룹니다.
- 저장소는 SQLite 파일입니다. 업무 DB와 시스템 현황용 로그 DB를 파일 두 개로 나눕니다. 설치형이라 DB 서버를 따로 두지 않습니다.
- 첨부 파일은 저장 위치를 설정으로 고릅니다. `app.storage.endpoint`가 있으면 S3 호환 저장소(R2)를, 없으면 이 컴퓨터의 폴더를 씁니다. 로컬 실행에는 저장 서비스와 키가 필요 없습니다.

## 지침을 어떻게 적용했나

| 지침 | cowork |
| --- | --- |
| 기본은 필요한 경계를 가진 모듈형 모놀리스 | 기본 패키지 `xyz.goraebap.cowork` 아래 기술 기반 `shared`와 업무 모듈 `module`을 둡니다. 모듈은 `user`·`file`·`notification`·`system`·`seed`·`realtime`·`search`·`mcp`와 `workspace`(`project`·`issue`·`document`·`richbody`·`activity`)입니다. 모듈 안의 계층은 [백엔드 예제](backend-engineering.md)에 있습니다 |
| 외부 제공자 호출의 타임아웃·실패 | 저장소 연동(GitHub·GitLab·Gitea)은 `HostHttp` 하나로 부르며, 짧은 연결 타임아웃을 두고 제공자가 거절한 메시지를 남기며 토큰은 오류와 로그에 남기지 않습니다 |
| 비밀값은 실행 환경의 비밀 저장 수단으로 | 환경 변수가 항상 우선합니다. 아무도 정하지 않은 비밀값(세션 서명 키, 푸시 키 쌍, 저장소 토큰 암호 키)은 첫 시작 때 만들어 DB 옆 `secrets.properties`에 둡니다. 이 파일을 잃으면 모두 로그아웃되므로 DB와 함께 백업합니다 |
| 운영 변경의 배포 순서·설정·백업·복구 | 이미지 하나에 화면 빌드·서버 빌드·실행 단계를 나눕니다. 데이터는 `/var/lib/cowork` 볼륨(업무 DB, 로그 DB, 파일)에 두고, 상태 확인은 DB까지 읽는 `/api/v1/health`로 합니다. 설정은 `application.properties`에 환경 변수 이름과 함께 적습니다 |
| 오픈소스 도입 | 아래 "이미지·도표 크게 보기" 사례 |

### 오픈소스 도입: 이미지·도표 크게 보기

이미지와 도표를 크게 보는 기능의 후보를 npm과 GitHub에서 확인했습니다(2026-11-09 기준).

| 후보 | 주간 다운로드 | GitHub 별 | 최근 갱신 | 판단 |
| --- | --- | --- | --- | --- |
| yet-another-react-lightbox | 약 100만 | 약 1.3천 | 저장소 2026-11, npm 버전 2026-10, 열린 이슈 1개 | 골랐습니다. MIT이고 React 19를 지원합니다. 확대 플러그인이 휠·두 손가락·두 번 누르기 확대를 제공하고, 사용자 정의 슬라이드로 SVG 도표를 웹 글꼴과 색 그대로 확대합니다. |
| PhotoSwipe | 약 83만 | 약 2.5만 | 저장소 2025-12, npm 버전 2024-05 | 기각했습니다. MIT이고 이미지 확대 품질은 가장 좋지만 이미지 중심이라 SVG 도표를 이미지로 바꿔 넣어야 합니다. 그러면 웹 글꼴이 빠져 글자 폭이 어긋나고, React 연결도 직접 짜야 합니다. |
| react-zoom-pan-pinch | 약 401만 | 약 2천 | 저장소 2026-10, npm 버전 2026-09 | 기각했습니다. 어떤 요소든 확대·이동하지만 막·닫기·초점 가두기를 갖춘 보기 창을 직접 만들어야 합니다. |
| lightGallery | 약 12만 | 약 7천 | 저장소 2026-11, npm 버전 2026-10 | 기각했습니다. GPL-3.0이라 제품에 쓰기 어렵습니다. |

yet-another-react-lightbox는 별 수가 가장 적지만, 주간 다운로드와 유지보수 상태로 판단해 그 점을 감수했습니다. npm 버전 날짜만 보면 PhotoSwipe를 유지보수가 멈춘 라이브러리로 잘못 기각하게 됩니다.

들인 뒤에는 판을 `3.33.0`으로 고정하고, 제품 공용 컴포넌트 `ZoomViewer` 뒤에 감쌌습니다. 화면은 라이브러리를 직접 부르지 않고, `ZoomViewerHost`가 보기 창을 지연 로딩합니다.

## 코드 위치

- 서버 모듈: [server/src/main/java/xyz/goraebap/cowork/module](https://github.com/dev-goraebap/cowork/tree/570d27da402451fe2ca06fca74862dd3899555c9/server/src/main/java/xyz/goraebap/cowork/module)
- 서버 기술 기반: [server/src/main/java/xyz/goraebap/cowork/shared](https://github.com/dev-goraebap/cowork/tree/570d27da402451fe2ca06fca74862dd3899555c9/server/src/main/java/xyz/goraebap/cowork/shared)
- 배포 이미지: [Dockerfile](https://github.com/dev-goraebap/cowork/blob/570d27da402451fe2ca06fca74862dd3899555c9/Dockerfile)
- 서버 설정: [server/src/main/resources/application.properties](https://github.com/dev-goraebap/cowork/blob/570d27da402451fe2ca06fca74862dd3899555c9/server/src/main/resources/application.properties)
- 비밀값 생성: [GeneratedSecrets.java](https://github.com/dev-goraebap/cowork/blob/570d27da402451fe2ca06fca74862dd3899555c9/server/src/main/java/xyz/goraebap/cowork/shared/config/GeneratedSecrets.java)
- 파일 저장 위치 선택: [StorageConfig.java](https://github.com/dev-goraebap/cowork/blob/570d27da402451fe2ca06fca74862dd3899555c9/server/src/main/java/xyz/goraebap/cowork/shared/storage/StorageConfig.java)
- 외부 저장소 호출: [HostHttp.java](https://github.com/dev-goraebap/cowork/blob/570d27da402451fe2ca06fca74862dd3899555c9/server/src/main/java/xyz/goraebap/cowork/module/workspace/issue/infrastructure/HostHttp.java)
- 크게 보기 컴포넌트: [web/src/shared/ui/zoom-viewer](https://github.com/dev-goraebap/cowork/tree/570d27da402451fe2ca06fca74862dd3899555c9/web/src/shared/ui/zoom-viewer)
