# 데이터 접근 (Spring Boot)

## 마이그레이션과 jOOQ 코드 생성

- 마이그레이션 SQL은 `src/main/resources/db/migration/V<번호>__<설명>.sql`에 둡니다.
- jOOQ 코드 생성은 `DDLDatabase`를 사용해 실행 중인 DB 없이 마이그레이션 SQL에서 직접 생성합니다.
- 생성 산출물은 `build/generated-sources/jooq/`에만 두고 Git에 커밋하지 않습니다.
- `build.gradle`의 `ext['jooq.version']`과 `jooq-codegen-gradle` 플러그인 버전은 항상 동일하게 맞춥니다.
- 데이터 마이그레이션 DML처럼 H2 DDL 파서가 해석하지 못하는 구간은 `-- [jooq ignore start]` / `-- [jooq ignore stop]` 주석으로 감쌉니다.

## Repository와 Query 구현 (`infrastructure/`)

| 구분 | 인터페이스 위치 | 구현체 위치·네이밍 | 의존 대상 |
| - | - | - | - |
| 명령 (쓰기) | `domain/<aggregate>/*Repository` | `infrastructure/Jooq*Repository` | `DSLContext`, `Clock` |
| 조회 (읽기) | `application/*Query` | `infrastructure/Jooq*Query` | `DSLContext` |

- 구현체 클래스는 `@Repository`를 붙이고 패키지 전용(package-private) 접근 제어자로 두어 외부에서 구현체 타입을 직접 참조하지 못하게 합니다.
- `Jooq*Query`는 도메인 엔티티를 거치지 않고 `DSLContext` 결과를 곧바로 `application`의 `*Views` `record`로 매핑해 반환합니다.

```java
@Repository
@RequiredArgsConstructor
class JooqNotificationQuery implements NotificationQuery {
    private final DSLContext dslContext;

    @Override
    public NotificationViews.RowSlice findByRecipient(UUID recipientId, NotificationRequests.NotificationListing listing) {
        // 조건 구성 + cursor keyset 조건 + limit(listing.size() + 1)
        // 결과를 NotificationViews.Row record로 바로 매핑
    }
}
```

- 다른 컨텍스트의 데이터가 함께 필요하면 `Service`에서 자기 `Query` 결과의 ID 목록을 모아 상대 `*Facade`를 배치 호출한 뒤 응답 DTO를 조립합니다.

```java
@Transactional(readOnly = true)
public NotificationViews.NotificationSlice mine(CurrentUser user, NotificationRequests.NotificationListing listing) {
    var found = notificationQuery.findByRecipient(user.id(), listing);
    var names = userFacade.summariesOf(found.rows().stream()
            .map(NotificationViews.Row::actorId)
            .filter(Objects::nonNull)
            .distinct()
            .toList());
    // found.rows()와 names를 조합해 NotificationViews.NotificationSlice 반환
}
```

## 시간 타입과 `Clock`

- `shared.config.TimeConfig`에서 `Clock` 빈을 등록하고, 서비스와 리포지토리에서 주입받아 `clock.instant()`로 현재 시각을 구합니다.
- `build.gradle`의 jOOQ `forcedTypes`에서 `TIMESTAMP WITH TIME ZONE` 컬럼을 `java.time.Instant`로 강제 매핑해 리포지토리와 쿼리마다 반복 변환 코드를 없앱니다.
- 시간대가 없는 `TIMESTAMP` 컬럼은 매핑에서 제외해 `java.time.LocalDateTime`으로 유지합니다.

## SQLite 사용 시 영속성 설정 (`shared.persistence`)

단일 파일 DB로 SQLite를 채택한 프로젝트에서는 아래 설정을 기본으로 둡니다.

- **저널·동시성 설정 (`application.properties`)**: `journal_mode=WAL`, `synchronous=NORMAL`, `busy_timeout=5000`, `foreign_keys=true`, `transaction_mode=IMMEDIATE`
- **읽기 전용 트랜잭션 분리 (`ReadOnlyDeferredDataSource`)**: 쓰기 트랜잭션은 시작 시점부터 쓰기 락을 잡는 `IMMEDIATE`로 열고, `@Transactional(readOnly = true)`는 `DEFERRED` + `PRAGMA query_only = ON`으로 열어 병렬 읽기가 쓰기 락을 기다리지 않게 합니다.
- **시각 텍스트 바인딩 (`InstantTextBinding`)**: SQLite는 별도 타임스탬프 타입이 없으므로, `timestamptz` 컬럼을 고정 폭 UTC 문자열(`2026-10-02T03:04:05.678901Z`)로 저장해 문자열 비교와 시간 정렬이 일치하게 합니다.
- **예외 변환 (`SqliteExceptionTranslator`)**: SQLite 드라이버 오류 코드를 Spring의 `DuplicateKeyException` · `DataIntegrityViolationException` · `CannotAcquireLockException`으로 변환해 jOOQ `ExceptionTranslatorExecuteListener`에 등록합니다.
