-- foundation의 로그 DB. 활동 · 요청 수 · 서버 오류 · 화면 방문 기록. 업무 DB와 파일이 따로다.
-- jOOQ의 DDL 파서(H2)가 다시 실행하지 못하는 색인은 [jooq ignore] 표시 사이에 둔다.

CREATE TABLE activity (
    activity_id integer,
    at timestamptz NOT NULL,
    user_id uuid,
    ip varchar(45) NOT NULL,
    method varchar(10) NOT NULL,
    route varchar(200) NOT NULL,
    target varchar(500),
    status integer NOT NULL,
    duration_ms integer NOT NULL,
    trace_id varchar(36) NOT NULL,
    user_agent varchar(300),
    CONSTRAINT activity_pkey PRIMARY KEY (activity_id)
);

-- [jooq ignore start]
CREATE INDEX activity_at_idx ON activity (at);
CREATE INDEX activity_user_at_idx ON activity (user_id, at);
-- [jooq ignore stop]

CREATE TABLE request_hour (
    hour timestamptz NOT NULL,
    method varchar(10) NOT NULL,
    route varchar(200) NOT NULL,
    status_class integer NOT NULL,
    requests integer NOT NULL,
    total_ms integer NOT NULL,
    max_ms integer NOT NULL,
    slow integer NOT NULL,
    CONSTRAINT request_hour_pkey PRIMARY KEY (hour, method, route, status_class)
);

CREATE TABLE server_error (
    server_error_id integer,
    fingerprint varchar(64) NOT NULL,
    minute timestamptz NOT NULL,
    first_at timestamptz NOT NULL,
    last_at timestamptz NOT NULL,
    occurrences integer NOT NULL,
    level varchar(5) NOT NULL,
    logger varchar(200) NOT NULL,
    message varchar(1000) NOT NULL,
    exception varchar(200),
    stack text,
    trace_id varchar(36),
    method varchar(10),
    path varchar(300),
    user_id uuid,
    ip varchar(45),
    CONSTRAINT server_error_pkey PRIMARY KEY (server_error_id),
    CONSTRAINT server_error_fingerprint_minute_key UNIQUE (fingerprint, minute)
);

-- [jooq ignore start]
CREATE INDEX server_error_last_at_idx ON server_error (last_at);
-- [jooq ignore stop]

CREATE TABLE log_backup (
    log_backup_id integer,
    at timestamptz NOT NULL,
    object_key varchar(300),
    bytes integer,
    error varchar(500),
    CONSTRAINT log_backup_pkey PRIMARY KEY (log_backup_id)
);

CREATE TABLE screen_visit (
    screen_visit_id integer,
    user_id uuid NOT NULL,
    screen varchar(100) NOT NULL,
    ip varchar(45) NOT NULL,
    user_agent varchar(300),
    first_at timestamptz NOT NULL,
    last_at timestamptz NOT NULL,
    visits integer NOT NULL,
    CONSTRAINT screen_visit_pkey PRIMARY KEY (screen_visit_id)
);

-- [jooq ignore start]
CREATE INDEX screen_visit_user_screen_last_idx ON screen_visit (user_id, screen, last_at);
CREATE INDEX screen_visit_last_at_idx ON screen_visit (last_at);
-- [jooq ignore stop]
