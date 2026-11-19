---
arc42: "8.3, 2, 7"
---

# cowork: DB와 마이그레이션

cowork는 프로젝트·업무·문서를 다루는 설치형 작업 공간입니다. 이 파일은 [DB 지침](../../skills/database/SKILL.md)을 cowork에 적용한 모양을 담습니다.

## 스택과 고른 이유

- 마이그레이션은 Flyway(Spring Boot 4.1.1의 starter), 쿼리 코드는 jOOQ 3.21.6, DB 엔진은 SQLite(`sqlite-jdbc`)입니다. jOOQ 런타임 판을 코드 생성기 버전과 맞춥니다(`ext['jooq.version']`). 어긋나면 생성물이 런타임 API와 맞지 않습니다.
- SQLite를 고른 이유는 설치형 제품이라 DB 서버 없이 파일 하나로 띄우기 위해서입니다. 다른 프로젝트에 이 엔진 선택을 옮기지 않습니다.
- DB는 파일 두 개입니다. 업무 DB(`DB_PATH`, `db/migration`)는 Spring Boot의 Flyway 설정이, 시스템 현황용 로그 DB(`LOG_DB_PATH`, `db/logs`)는 `LogDatabase`가 따로 Flyway로 올립니다.

## 지침을 어떻게 적용했나

| 지침 | cowork |
| --- | --- |
| 공유 환경에 적용된 마이그레이션은 고치지 않고 다음 버전을 추가합니다 | 업무 DB는 `server/src/main/resources/db/migration`의 `V<번호>__<이름>.sql`, 로그 DB는 `db/logs`의 같은 형식 파일입니다. Flyway 기록이 없는 DB를 복원해 올릴 때만 `FLYWAY_BASELINE_ON_MIGRATE=true`로 V1에 표시합니다 |
| 실제 DB 엔진의 트랜잭션·잠금·외래키 동작에 맞춥니다 | 연결마다 `journal_mode=WAL`, `synchronous=NORMAL`, `busy_timeout=5000`, `foreign_keys=true`, `transaction_mode=IMMEDIATE`를 겁니다. 읽기 전용 트랜잭션은 쓰기 잠금을 잡지 않아 읽기끼리, 읽기와 쓰기가 나란히 돕니다. SQLite 오류에는 SQL 상태가 없으므로 `SqliteExceptionTranslator`가 중복 키·무결성 위반·잠금 실패로 나눠, 충돌이 서버 오류로 보이지 않게 합니다 |
| 프로젝트 명령으로 생성 코드를 만들고 손으로 맞추지 않습니다 | jOOQ는 실행 중인 DB 없이 마이그레이션 SQL을 파싱해(`DDLDatabase`) 코드를 만듭니다. 생성물은 `build/generated-sources/jooq`(업무)와 `jooq-logs`(로그)에만 두고 커밋하지 않습니다. `compileJava`가 생성을 먼저 돌리므로 스키마와 코드가 어긋나면 컴파일이 실패합니다 |
| 생성기가 읽지 못하는 구문 | 외래 키, 색인, 처음 넣는 행처럼 jOOQ 파서가 읽지 못하거나 모델에 필요 없는 구문은 마이그레이션 안에서 `-- [jooq ignore start]`와 `-- [jooq ignore stop]` 사이에 둡니다 |
| 절대 시각은 UTC | `timestamptz` 열은 `InstantTextBinding`으로 `Instant`가 되며, SQLite에는 시간 순으로 정렬되는 고정 UTC 문자열로 저장합니다. 사용자가 고른 "그 날 그 시각"은 시간대 없는 `timestamp`로 두어 `LocalDateTime`으로 남깁니다 |
| 빈 DB와 이전 판에서 마이그레이션을 확인합니다 | 테스트는 운영과 같은 SQLite와 마이그레이션으로 돌고(`TestDatabase`가 테스트 사이에 표를 비웁니다), 트랜잭션 동작은 `SqliteTransactionTest`가 확인합니다 |

## 코드 위치

- 업무 DB 마이그레이션: [server/src/main/resources/db/migration](https://github.com/dev-goraebap/cowork/tree/570d27da402451fe2ca06fca74862dd3899555c9/server/src/main/resources/db/migration)
- 로그 DB 마이그레이션: [server/src/main/resources/db/logs](https://github.com/dev-goraebap/cowork/tree/570d27da402451fe2ca06fca74862dd3899555c9/server/src/main/resources/db/logs), 올리는 코드 [LogDatabase.java](https://github.com/dev-goraebap/cowork/blob/570d27da402451fe2ca06fca74862dd3899555c9/server/src/main/java/xyz/goraebap/cowork/module/system/infrastructure/LogDatabase.java)
- jOOQ 생성 설정: [server/build.gradle](https://github.com/dev-goraebap/cowork/blob/570d27da402451fe2ca06fca74862dd3899555c9/server/build.gradle)의 `jooq` 블록
- 연결 설정: [server/src/main/resources/application.properties](https://github.com/dev-goraebap/cowork/blob/570d27da402451fe2ca06fca74862dd3899555c9/server/src/main/resources/application.properties)
- SQLite 연동: [server/src/main/java/xyz/goraebap/cowork/shared/persistence](https://github.com/dev-goraebap/cowork/tree/570d27da402451fe2ca06fca74862dd3899555c9/server/src/main/java/xyz/goraebap/cowork/shared/persistence)(`InstantTextBinding`, `SqliteExceptionTranslator`)
- 트랜잭션 테스트: [SqliteTransactionTest.java](https://github.com/dev-goraebap/cowork/blob/570d27da402451fe2ca06fca74862dd3899555c9/server/src/test/java/xyz/goraebap/cowork/SqliteTransactionTest.java)

## 작업 절차

스키마를 바꾼 뒤 `server/`에서 생성 코드를 다시 만들고 검사합니다. 생성은 컴파일 전에 자동으로 돌며, 따로 돌릴 때는 `jooqCodegen`을 씁니다.

```bash
cd server && ./gradlew jooqCodegen
./gradlew test integrationTest
```
