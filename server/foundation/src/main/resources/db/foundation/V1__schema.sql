-- foundation의 표. 사용자 · 인증 · 역할 · 에이전트 토큰 · 파일 · 알림 · 푸시 · 시작 데이터.
-- jOOQ의 DDL 파서(H2)가 다시 실행하지 못하는 색인은 [jooq ignore] 표시 사이에 둔다.

CREATE TABLE users (
    user_id uuid NOT NULL,
    email varchar(254) NOT NULL,
    is_active boolean DEFAULT 1 NOT NULL,
    created_at timestamptz DEFAULT (strftime('%Y-%m-%dT%H:%M:%S', 'now') || substr(strftime('%f', 'now'), 3) || '000Z') NOT NULL,
    updated_at timestamptz DEFAULT (strftime('%Y-%m-%dT%H:%M:%S', 'now') || substr(strftime('%f', 'now'), 3) || '000Z') NOT NULL,
    deleted_at timestamptz,
    created_by uuid,
    updated_by uuid,
    onboarded_at timestamptz,
    name varchar(64) NOT NULL DEFAULT '',
    status varchar(16) NOT NULL DEFAULT 'INVITED',
    invited_at timestamptz,
    activated_at timestamptz,
    avatar_preset smallint CHECK (avatar_preset >= 0 AND avatar_preset <= 17),
    avatar_picture_id uuid,
    CONSTRAINT users_pkey PRIMARY KEY (user_id)
);

-- [jooq ignore start]
CREATE UNIQUE INDEX ux_users_email ON users (email);
-- [jooq ignore stop]

CREATE TABLE user_role (
    user_id uuid NOT NULL,
    role varchar(32) NOT NULL,
    granted_at timestamptz NOT NULL,
    granted_by uuid,
    CONSTRAINT user_role_pkey PRIMARY KEY (user_id, role)
-- [jooq ignore start]
    , CONSTRAINT user_role_user_fk FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
-- [jooq ignore stop]
);

CREATE TABLE iam_session (
    token_hash varchar(64) NOT NULL,
    user_account_id uuid NOT NULL,
    created_at timestamptz NOT NULL,
    touched_at timestamptz NOT NULL,
    expires_at timestamptz NOT NULL,
    CONSTRAINT iam_session_pkey PRIMARY KEY (token_hash)
-- [jooq ignore start]
    , CONSTRAINT iam_session_user_account_id_fkey FOREIGN KEY (user_account_id) REFERENCES users(user_id)
-- [jooq ignore stop]
);

-- [jooq ignore start]
CREATE INDEX iam_session_expiry ON iam_session (expires_at);
CREATE INDEX iam_session_user ON iam_session (user_account_id);
-- [jooq ignore stop]

CREATE TABLE iam_otp (
    user_account_id uuid NOT NULL,
    code_hash varchar(64) NOT NULL,
    issued_at timestamptz NOT NULL,
    expires_at timestamptz NOT NULL,
    attempts integer DEFAULT 0 NOT NULL,
    consumed boolean DEFAULT 0 NOT NULL,
    CONSTRAINT iam_otp_pkey PRIMARY KEY (user_account_id)
-- [jooq ignore start]
    , CONSTRAINT iam_otp_user_account_id_fkey FOREIGN KEY (user_account_id) REFERENCES users(user_id)
    , CONSTRAINT iam_otp_attempts_check CHECK ((attempts >= 0))
-- [jooq ignore stop]
);

CREATE TABLE iam_permission_lock (
    id integer NOT NULL,
    CONSTRAINT iam_permission_lock_pkey PRIMARY KEY (id)
);

-- 권한을 바꾸는 요청들이 차례로 잡는 한 줄.
-- [jooq ignore start]
INSERT INTO iam_permission_lock VALUES (1);
-- [jooq ignore stop]

CREATE TABLE agent_profile (
    profile_id uuid NOT NULL,
    user_id uuid NOT NULL,
    name varchar(64) NOT NULL,
    icon varchar(100) NOT NULL,
    color varchar(7) NOT NULL,
    version bigint DEFAULT 0 NOT NULL,
    legacy_shared boolean DEFAULT 0 NOT NULL,
    CONSTRAINT agent_profile_pkey PRIMARY KEY (profile_id)
-- [jooq ignore start]
    , CONSTRAINT agent_profile_user_fkey FOREIGN KEY (user_id) REFERENCES users(user_id)
    , CONSTRAINT agent_profile_name_check CHECK (length(trim(name)) BETWEEN 1 AND 64)
-- [jooq ignore stop]
);

-- [jooq ignore start]
CREATE INDEX ix_agent_profile_user ON agent_profile(user_id,name,profile_id);
-- [jooq ignore stop]

CREATE TABLE agent_token (
    token_id uuid NOT NULL,
    user_id uuid NOT NULL,
    name varchar(64) NOT NULL,
    agent_name varchar(64) NOT NULL,
    prefix varchar(16) NOT NULL,
    token_hash varchar(64) NOT NULL,
    created_at timestamptz NOT NULL,
    expires_at timestamptz,
    last_used_at timestamptz,
    last_used_ip varchar(45),
    revoked_at timestamptz,
    profile_id uuid,
    CONSTRAINT agent_token_pkey PRIMARY KEY (token_id)
-- [jooq ignore start]
    , CONSTRAINT agent_token_profile_fkey FOREIGN KEY (profile_id) REFERENCES agent_profile(profile_id)
    , CONSTRAINT agent_token_user_fkey FOREIGN KEY (user_id) REFERENCES users (user_id)
-- [jooq ignore stop]
);

-- [jooq ignore start]
CREATE INDEX ix_agent_token_user ON agent_token (user_id, created_at, token_id);
CREATE UNIQUE INDEX uq_agent_token_profile ON agent_token(profile_id);
CREATE UNIQUE INDEX ux_agent_token_hash ON agent_token (token_hash);
-- [jooq ignore stop]

CREATE TABLE blob (
    blob_id uuid NOT NULL,
    storage_key varchar(512) NOT NULL,
    filename varchar(256) NOT NULL,
    content_type varchar(128) NOT NULL,
    byte_size bigint NOT NULL,
    checksum varchar(64),
    created_at timestamptz DEFAULT (strftime('%Y-%m-%dT%H:%M:%S', 'now') || substr(strftime('%f', 'now'), 3) || '000Z') NOT NULL,
    created_by uuid,
    updated_at timestamptz DEFAULT (strftime('%Y-%m-%dT%H:%M:%S', 'now') || substr(strftime('%f', 'now'), 3) || '000Z') NOT NULL,
    updated_by uuid,
    deleted_at timestamptz,
    dominant_color varchar(7),
    width integer,
    height integer,
    CONSTRAINT blob_pkey PRIMARY KEY (blob_id)
-- [jooq ignore start]
    , CONSTRAINT blob_height_check CHECK ((height > 0))
    , CONSTRAINT blob_width_check CHECK ((width > 0))
    , CONSTRAINT ck_blob_dominant_color CHECK ((dominant_color GLOB '#[0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f]'))
-- [jooq ignore stop]
);

-- [jooq ignore start]
CREATE INDEX ix_blob_checksum ON blob (checksum);
-- [jooq ignore stop]

CREATE TABLE pending_upload (
    pending_upload_id uuid NOT NULL,
    blob_id uuid NOT NULL,
    storage_key varchar(512) NOT NULL,
    owner_type varchar(32) NOT NULL,
    owner_id uuid NOT NULL,
    filename varchar(256) NOT NULL,
    mime_type varchar(128) NOT NULL,
    created_at timestamptz DEFAULT (strftime('%Y-%m-%dT%H:%M:%S', 'now') || substr(strftime('%f', 'now'), 3) || '000Z') NOT NULL,
    created_by uuid,
    updated_at timestamptz DEFAULT (strftime('%Y-%m-%dT%H:%M:%S', 'now') || substr(strftime('%f', 'now'), 3) || '000Z') NOT NULL,
    updated_by uuid,
    dominant_color varchar(7),
    width integer,
    height integer,
    CONSTRAINT pending_upload_pkey PRIMARY KEY (pending_upload_id)
-- [jooq ignore start]
    , CONSTRAINT ck_pending_upload_dominant_color CHECK ((dominant_color GLOB '#[0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f]'))
    , CONSTRAINT pending_upload_height_check CHECK ((height > 0))
    , CONSTRAINT pending_upload_width_check CHECK ((width > 0))
-- [jooq ignore stop]
);

-- [jooq ignore start]
CREATE INDEX pending_upload_created_at_idx ON pending_upload (created_at);
-- [jooq ignore stop]

CREATE TABLE attachment (
    attachment_id uuid NOT NULL,
    blob_id uuid NOT NULL,
    owner_type varchar(32) NOT NULL,
    owner_id uuid NOT NULL,
    name varchar(64),
    "position" integer DEFAULT 0 NOT NULL,
    note text,
    created_at timestamptz DEFAULT (strftime('%Y-%m-%dT%H:%M:%S', 'now') || substr(strftime('%f', 'now'), 3) || '000Z') NOT NULL,
    created_by uuid,
    updated_at timestamptz DEFAULT (strftime('%Y-%m-%dT%H:%M:%S', 'now') || substr(strftime('%f', 'now'), 3) || '000Z') NOT NULL,
    updated_by uuid,
    deleted_at timestamptz,
    CONSTRAINT attachment_pkey PRIMARY KEY (attachment_id)
-- [jooq ignore start]
    , CONSTRAINT attachment_blob_id_blob_blob_id_fk FOREIGN KEY (blob_id) REFERENCES blob(blob_id) ON DELETE RESTRICT
-- [jooq ignore stop]
);

-- [jooq ignore start]
CREATE INDEX ix_attachment_blob ON attachment (blob_id);
CREATE INDEX ix_attachment_owner ON attachment (owner_type, owner_id);
-- [jooq ignore stop]

CREATE TABLE notification_event (
    event_id uuid NOT NULL,
    kind varchar(64) NOT NULL,
    title varchar(200) NOT NULL,
    message text NOT NULL,
    link varchar(500),
    created_at timestamptz DEFAULT (strftime('%Y-%m-%dT%H:%M:%S', 'now') || substr(strftime('%f', 'now'), 3) || '000Z') NOT NULL,
    actor_id uuid,
    subject_type varchar(32),
    subject_id uuid,
    ends varchar(8) DEFAULT 'SEEN' NOT NULL,
    expires_at timestamptz,
    CONSTRAINT notification_event_pkey PRIMARY KEY (event_id)
);

-- [jooq ignore start]
CREATE INDEX ix_notification_event_created ON notification_event (created_at, event_id);
CREATE INDEX ix_notification_event_expires ON notification_event (expires_at);
CREATE INDEX ix_notification_event_kind_created ON notification_event (kind, created_at);
CREATE INDEX ix_notification_event_subject ON notification_event (subject_type, subject_id);
-- [jooq ignore stop]

CREATE TABLE notification_recipient (
    event_id uuid NOT NULL,
    recipient_id uuid NOT NULL,
    read_at timestamptz,
    CONSTRAINT notification_recipient_pkey PRIMARY KEY (event_id, recipient_id)
-- [jooq ignore start]
    , CONSTRAINT notification_recipient_event_id_notification_event_event_id_fk FOREIGN KEY (event_id) REFERENCES notification_event(event_id) ON DELETE CASCADE
    , CONSTRAINT notification_recipient_recipient_id_users_user_id_fk FOREIGN KEY (recipient_id) REFERENCES users(user_id) ON DELETE CASCADE
-- [jooq ignore stop]
);

-- [jooq ignore start]
CREATE INDEX ix_notification_recipient_by_recipient ON notification_recipient (recipient_id, event_id);
CREATE INDEX ix_notification_recipient_unread ON notification_recipient (recipient_id) WHERE (read_at IS NULL);
-- [jooq ignore stop]

CREATE TABLE push_subscription (
    subscription_id uuid NOT NULL,
    user_account_id uuid NOT NULL,
    endpoint text NOT NULL,
    p256dh text NOT NULL,
    auth text NOT NULL,
    user_agent text,
    expired_at timestamptz,
    created_at timestamptz DEFAULT (strftime('%Y-%m-%dT%H:%M:%S', 'now') || substr(strftime('%f', 'now'), 3) || '000Z') NOT NULL,
    last_seen_at timestamptz DEFAULT (strftime('%Y-%m-%dT%H:%M:%S', 'now') || substr(strftime('%f', 'now'), 3) || '000Z') NOT NULL,
    device_name text,
    CONSTRAINT push_subscription_pkey PRIMARY KEY (subscription_id)
-- [jooq ignore start]
    , CONSTRAINT push_subscription_user_fkey FOREIGN KEY (user_account_id) REFERENCES users(user_id) ON DELETE CASCADE
-- [jooq ignore stop]
);

-- [jooq ignore start]
CREATE INDEX ix_push_subscription_user ON push_subscription (user_account_id, expired_at);
CREATE UNIQUE INDEX ux_push_subscription_endpoint ON push_subscription (endpoint);
-- [jooq ignore stop]

CREATE TABLE push_preference (
    user_id uuid NOT NULL,
    topic varchar(32) NOT NULL,
    CONSTRAINT push_preference_pkey PRIMARY KEY (user_id, topic)
-- [jooq ignore start]
    , CONSTRAINT push_preference_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
-- [jooq ignore stop]
);

CREATE TABLE push_delivery (
    delivery_id uuid NOT NULL,
    event_id uuid,
    recipient_id uuid NOT NULL,
    subscription_id uuid,
    title varchar(200) NOT NULL,
    link varchar(500),
    status varchar(16) NOT NULL,
    attempts integer DEFAULT 0 NOT NULL,
    http_status integer,
    error varchar(500),
    created_at timestamptz NOT NULL,
    attempted_at timestamptz,
    CONSTRAINT push_delivery_pkey PRIMARY KEY (delivery_id)
-- [jooq ignore start]
    , CONSTRAINT push_delivery_event_id_fkey FOREIGN KEY (event_id) REFERENCES notification_event(event_id) ON DELETE CASCADE
    , CONSTRAINT push_delivery_recipient_id_fkey FOREIGN KEY (recipient_id) REFERENCES users(user_id) ON DELETE CASCADE
    , CONSTRAINT push_delivery_subscription_id_fkey FOREIGN KEY (subscription_id) REFERENCES push_subscription(subscription_id) ON DELETE SET NULL
-- [jooq ignore stop]
);

-- [jooq ignore start]
CREATE INDEX ix_push_delivery_recipient ON push_delivery (recipient_id, created_at DESC);
CREATE INDEX ix_push_delivery_status ON push_delivery (status, created_at);
-- [jooq ignore stop]

CREATE TABLE seed_import (
    file_name varchar(255) NOT NULL,
    checksum varchar(64) NOT NULL,
    imported_at timestamptz NOT NULL,
    summary varchar(1000) NOT NULL,
    CONSTRAINT seed_import_pkey PRIMARY KEY (file_name)
);


-- 다른 하위 프로젝트를 바꿀 일을 내 저장과 함께 적어 두는 자리. 커밋 뒤 처리기가 순서대로 처리한다.
CREATE TABLE outbox_message (
    outbox_id integer,
    topic varchar(64) NOT NULL,
    ordering_key varchar(200),
    payload text NOT NULL,
    status varchar(16) DEFAULT 'PENDING' NOT NULL,
    attempts integer DEFAULT 0 NOT NULL,
    next_attempt_at timestamptz NOT NULL,
    last_error varchar(500),
    created_at timestamptz NOT NULL,
    finished_at timestamptz,
    CONSTRAINT outbox_message_pkey PRIMARY KEY (outbox_id)
-- [jooq ignore start]
    , CONSTRAINT outbox_message_status_check CHECK (status IN ('PENDING', 'DONE', 'FAILED'))
-- [jooq ignore stop]
);

-- [jooq ignore start]
CREATE INDEX ix_outbox_message_due ON outbox_message (status, next_attempt_at);
CREATE INDEX ix_outbox_message_ordering ON outbox_message (ordering_key, outbox_id);
-- [jooq ignore stop]

-- 이 DB의 처리자가 이미 처리한 아웃박스 줄. 같은 줄이 다시 넘어와도 한 번만 반영하려고 일과 같은 트랜잭션에서 적는다.
CREATE TABLE outbox_received (
    channel varchar(64) NOT NULL,
    outbox_id integer NOT NULL,
    received_at timestamptz NOT NULL,
    CONSTRAINT outbox_received_pkey PRIMARY KEY (channel, outbox_id)
);
