# 마이그레이션 SQL과 생성 코드

스키마는 버전을 붙인 마이그레이션 파일로만 바꾸고, 쿼리 코드는 프로젝트 명령으로 스키마에서 생성하며 손으로 맞추지 않습니다. 규칙은 [DB와 마이그레이션](../references/database.md)에 있습니다.

## spring

출처: [server/src/main/resources/db/migration/V1__schema.sql](https://github.com/dev-goraebap/cowork/blob/570d27da402451fe2ca06fca74862dd3899555c9/server/src/main/resources/db/migration/V1__schema.sql)

```sql
-- cowork의 첫 스키마. 업무 공간(프로젝트 · 업무 · 문서)과 계정 · 알림 · 파일의 표를 한 번에 만든다.
-- jOOQ 코드 생성(DDLDatabase)은 이 파일을 파싱해 표 모델을 만든다. jOOQ의 파서가 읽지 못하거나 모델에 필요 없는 것
-- (외래 키, 색인, 처음 넣는 행)은 [jooq ignore] 표시 사이에 둔다.
-- …
CREATE TABLE issue_column (
    column_id uuid NOT NULL,
    project_id uuid NOT NULL,
    name varchar(32) NOT NULL,
    category varchar(16) NOT NULL,
    "position" integer NOT NULL,
    created_at timestamptz DEFAULT (strftime('%Y-%m-%dT%H:%M:%S', 'now') || substr(strftime('%f', 'now'), 3) || '000Z') NOT NULL,
    created_by uuid,
    updated_at timestamptz DEFAULT (strftime('%Y-%m-%dT%H:%M:%S', 'now') || substr(strftime('%f', 'now'), 3) || '000Z') NOT NULL,
    updated_by uuid,
    CONSTRAINT issue_column_pkey PRIMARY KEY (column_id)
-- [jooq ignore start]
    , CONSTRAINT issue_column_project_fkey FOREIGN KEY (project_id) REFERENCES project (project_id) ON DELETE CASCADE
    , CONSTRAINT issue_column_category CHECK (category IN ('BACKLOG', 'UNSTARTED', 'STARTED', 'COMPLETED', 'CANCELED'))
-- [jooq ignore stop]
);
```

업무 DB의 마이그레이션은 Flyway 이름 형식 `V<번호>__<이름>.sql`을 따릅니다. 외래 키와 CHECK 제약처럼 jOOQ 파서가 읽지 못하거나 생성 모델에 필요 없는 구문은 `[jooq ignore]` 표시 사이에 둡니다.

출처: [server/build.gradle](https://github.com/dev-goraebap/cowork/blob/570d27da402451fe2ca06fca74862dd3899555c9/server/build.gradle)

```groovy
// 런타임 jOOQ 버전을 코드 생성기와 맞춘다. 어긋나면 생성물이 런타임 API 와 맞지 않는다.
ext['jooq.version'] = '3.21.6'
// …
/*
 * jOOQ 코드 생성: 실행 중인 데이터베이스 없이 마이그레이션 SQL 에서 직접 생성한다.
 * 빌드가 외부 상태에 의존하지 않으며, 스키마와 코드가 어긋나면 컴파일이 실패한다.
 * 생성물은 build/ 아래에만 두고 커밋하지 않는다 — 단일 원본을 두 벌로 만들지 않기 위해서다.
 */
jooq {
	configuration {
		generator {
			database {
				name = 'org.jooq.meta.extensions.ddl.DDLDatabase'
				properties {
					// …
					property {
						key = 'parseIgnoreComments'
						value = 'true'
					}
				// …
					forcedType {
						// SQLite keeps moments as text; the binding writes one fixed UTC form that sorts like time.
						userType = 'java.time.Instant'
						binding = 'xyz.goraebap.cowork.shared.persistence.InstantTextBinding'
						includeTypes = 'TIMESTAMP.*WITH.*TIME.*ZONE'
					}
// …
tasks.named('compileJava') {
	dependsOn tasks.named('jooqCodegen')
}
```

jOOQ는 실행 중인 DB 없이 마이그레이션 SQL을 파싱해(`DDLDatabase`) 코드를 만들고, 생성물은 `build/` 아래에만 두어 커밋하지 않습니다. `compileJava`가 생성을 먼저 돌리므로 스키마와 코드가 어긋나면 컴파일이 실패합니다. 런타임 jOOQ 버전은 생성기 버전과 맞추고, 시간대 있는 시각 열은 `Instant`로 받아 UTC 문자열로 저장합니다.
