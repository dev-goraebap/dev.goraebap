---
disable-model-invocation: true
name: backend
description: Java·Spring Boot·jOOQ 기반 모듈형 모놀리스의 도메인, 서비스, 저장소와 조회 경계를 구현한다. 서버 기능·유스케이스·모듈 구조를 만들거나 고칠 때 사용한다.
---

# 백엔드

기본 조합은 Java·Spring Boot·jOOQ와 모듈형 모놀리스다. 버전·패키지 루트·DB 엔진은 프로젝트에서 정한다. 기존 프로젝트가 다른 기술을 쓰면 스택 전환을 임의로 추가하지 않는다.

- [계층과 명령](references/layers.md): 도메인·서비스·저장소·트랜잭션을 바꿀 때 읽는다.
- [모듈 간 계약](references/contracts.md): 피처별 Facade·Param/Result·Spi를 설계할 때 읽는다.
- [공유와 참조](references/sharing.md): 다른 피처의 기능이 필요하거나 코드를 공용으로 옮길 때 읽는다.
- [조회 포트](references/queries.md): 화면 조회의 소유권·결과 타입·조립 경로를 정할 때 읽는다.
- [모듈 간 조회](references/cross-module-read.md): 다른 모듈의 표시값·검색·정렬이 필요할 때 읽는다.
- [도메인 오류와 서비스 오류](references/errors.md): 규칙 위반·부재·권한·충돌을 처리할 때 읽는다.
- [코드 규칙](references/code-style.md): Java 파일·DTO·의존성을 작성할 때 읽는다.

완료 시 프로젝트의 정적 검사·테스트와 변경한 유스케이스의 성공·실패·권한을 검증한다. HTTP 계약이 바뀌면 명세·생성 타입·호출자도 함께 맞춘다.
