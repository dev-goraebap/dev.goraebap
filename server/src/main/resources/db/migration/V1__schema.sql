-- cowork의 첫 스키마. 업무 공간(프로젝트 · 업무 · 문서)과 계정 · 알림 · 파일의 표를 한 번에 만든다.
-- jOOQ 코드 생성(DDLDatabase)은 이 파일을 파싱해 표 모델을 만든다. jOOQ의 파서가 읽지 못하거나 모델에 필요 없는 것
-- (외래 키, 색인, 처음 넣는 행)은 [jooq ignore] 표시 사이에 둔다.

CREATE TABLE activity_entry (
    entry_id uuid NOT NULL,
    owner_type varchar(32) NOT NULL,
    owner_id uuid NOT NULL,
    kind varchar(16) NOT NULL,
    field varchar(32),
    before_value varchar(400),
    after_value varchar(400),
    body text,
    quote text,
    created_at timestamptz DEFAULT (strftime('%Y-%m-%dT%H:%M:%S', 'now') || substr(strftime('%f', 'now'), 3) || '000Z') NOT NULL,
    created_by uuid,
    edited_at timestamptz,
    deleted_at timestamptz, parent_id uuid, actor_source varchar(8), agent_profile_id uuid, agent_name varchar(64), agent_icon varchar(100), agent_color varchar(7), block_id varchar(64), resolved_at timestamptz, resolved_by uuid,
    CONSTRAINT activity_entry_pkey PRIMARY KEY (entry_id)
);

CREATE TABLE users (
    user_id uuid NOT NULL,
    email varchar(254) NOT NULL,
    is_active boolean DEFAULT 1 NOT NULL,
    created_at timestamptz DEFAULT (strftime('%Y-%m-%dT%H:%M:%S', 'now') || substr(strftime('%f', 'now'), 3) || '000Z') NOT NULL,
    updated_at timestamptz DEFAULT (strftime('%Y-%m-%dT%H:%M:%S', 'now') || substr(strftime('%f', 'now'), 3) || '000Z') NOT NULL,
    deleted_at timestamptz,
    created_by uuid,
    updated_by uuid,
    onboarded_at timestamptz, name varchar(64) NOT NULL DEFAULT '', status varchar(16) NOT NULL DEFAULT 'INVITED', invited_at timestamptz, activated_at timestamptz, terminated_at date, gender varchar(8), avatar_preset smallint CHECK (avatar_preset >= 0 AND avatar_preset <= 17), avatar_picture_id uuid,
    CONSTRAINT user_account_pkey PRIMARY KEY (user_id)
);

CREATE TABLE agent_profile (
 profile_id uuid NOT NULL PRIMARY KEY,
 user_id uuid NOT NULL,
 name varchar(64) NOT NULL,
 icon varchar(100) NOT NULL,
 color varchar(7) NOT NULL,
 version bigint DEFAULT 0 NOT NULL

 , legacy_shared boolean DEFAULT false NOT NULL
-- [jooq ignore start]
 , FOREIGN KEY(user_id) REFERENCES users(user_id)
 , CHECK(length(trim(name)) BETWEEN 1 AND 64)
-- [jooq ignore stop]
);

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
    revoked_at timestamptz, profile_id uuid
-- [jooq ignore start]
 REFERENCES agent_profile(profile_id)
-- [jooq ignore stop]
,
    CONSTRAINT agent_token_pkey PRIMARY KEY (token_id)
-- [jooq ignore start]
    , CONSTRAINT agent_token_user_fkey FOREIGN KEY (user_id) REFERENCES users (user_id)
-- [jooq ignore stop]
);

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

CREATE TABLE work_item_type (
    code varchar(16) NOT NULL,
    name varchar(32) NOT NULL,
    icon varchar(40) NOT NULL,
    color varchar(7) NOT NULL,
    "position" integer NOT NULL,
    is_default boolean DEFAULT false NOT NULL,
    created_at timestamptz DEFAULT (strftime('%Y-%m-%dT%H:%M:%S', 'now') || substr(strftime('%f', 'now'), 3) || '000Z') NOT NULL,
    created_by uuid,
    updated_at timestamptz DEFAULT (strftime('%Y-%m-%dT%H:%M:%S', 'now') || substr(strftime('%f', 'now'), 3) || '000Z') NOT NULL,
    updated_by uuid,
    CONSTRAINT work_item_type_pkey PRIMARY KEY (code)
-- [jooq ignore start]
    , CONSTRAINT work_item_type_color CHECK (color GLOB '#[0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f]')
-- [jooq ignore stop]
);

CREATE TABLE project (
    project_id uuid NOT NULL,
    name text NOT NULL,
    created_at timestamptz DEFAULT (strftime('%Y-%m-%dT%H:%M:%S', 'now') || substr(strftime('%f', 'now'), 3) || '000Z') NOT NULL,
    updated_at timestamptz DEFAULT (strftime('%Y-%m-%dT%H:%M:%S', 'now') || substr(strftime('%f', 'now'), 3) || '000Z') NOT NULL,
    created_by uuid,
    updated_by uuid,
    description text, icon varchar(32), color varchar(7), position integer NOT NULL DEFAULT 0, last_work_item_number bigint NOT NULL DEFAULT 0, archived_at timestamptz, deleted_at timestamptz, deleted_by uuid, version bigint NOT NULL DEFAULT 0,
    CONSTRAINT project_tag_pkey PRIMARY KEY (project_id)
);

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

CREATE TABLE issue (
    issue_id uuid NOT NULL,
    project_id uuid NOT NULL,
    number bigint NOT NULL,
    title varchar(200) NOT NULL,
    type varchar(16) NOT NULL,
    column_id uuid NOT NULL,
    "position" double precision NOT NULL,
    priority varchar(8) NOT NULL,
    assignee_id uuid,
    start_date date,
    due_date date,
    parent_id uuid,
    closed_at timestamptz,
    version bigint DEFAULT 0 NOT NULL,
    created_at timestamptz DEFAULT (strftime('%Y-%m-%dT%H:%M:%S', 'now') || substr(strftime('%f', 'now'), 3) || '000Z') NOT NULL,
    created_by uuid,
    updated_at timestamptz DEFAULT (strftime('%Y-%m-%dT%H:%M:%S', 'now') || substr(strftime('%f', 'now'), 3) || '000Z') NOT NULL,
    updated_by uuid,
    deleted_at timestamptz,
    deleted_by uuid, started_at timestamptz, estimate_minutes integer, story_points double precision, cycle_id uuid,
    CONSTRAINT issue_next_pkey PRIMARY KEY (issue_id)
-- [jooq ignore start]

    , CONSTRAINT issue_next_project_fkey FOREIGN KEY (project_id) REFERENCES project (project_id) ON DELETE CASCADE
-- [jooq ignore stop]

-- [jooq ignore start]

    , CONSTRAINT issue_next_column_fkey FOREIGN KEY (column_id) REFERENCES issue_column (column_id) ON DELETE RESTRICT
-- [jooq ignore stop]

-- [jooq ignore start]

    , CONSTRAINT issue_next_parent_fkey FOREIGN KEY (parent_id) REFERENCES "issue" (issue_id) ON DELETE SET NULL
-- [jooq ignore stop]

-- [jooq ignore start]

    , CONSTRAINT issue_next_type_fkey FOREIGN KEY (type) REFERENCES work_item_type (code) ON DELETE RESTRICT
-- [jooq ignore stop]

    , CONSTRAINT issue_next_priority CHECK (priority IN ('NONE', 'URGENT', 'HIGH', 'MEDIUM', 'LOW'))
    , CONSTRAINT issue_next_dates CHECK (start_date IS NULL OR due_date IS NULL OR start_date <= due_date)
);

CREATE TABLE repository_integration (
    integration_id uuid NOT NULL,
    project_id uuid NOT NULL,
    provider varchar(8) NOT NULL,
    base_url varchar(255) NOT NULL,
    repository varchar(255) NOT NULL,
    external_repository_id varchar(64),
    web_url varchar(500) NOT NULL,
    token_cipher text,
    webhook_secret_cipher text NOT NULL,
    webhook_id varchar(64),
    account_login varchar(128),
    last_event_at timestamptz,
    last_error varchar(500),
    version bigint DEFAULT 0 NOT NULL,
    created_at timestamptz DEFAULT (strftime('%Y-%m-%dT%H:%M:%S', 'now') || substr(strftime('%f', 'now'), 3) || '000Z') NOT NULL,
    created_by uuid,
    updated_at timestamptz DEFAULT (strftime('%Y-%m-%dT%H:%M:%S', 'now') || substr(strftime('%f', 'now'), 3) || '000Z') NOT NULL,
    updated_by uuid,
    CONSTRAINT repository_integration_pkey PRIMARY KEY (integration_id)
-- [jooq ignore start]
    , CONSTRAINT repository_integration_project_fkey FOREIGN KEY (project_id) REFERENCES project (project_id)
    , CONSTRAINT repository_integration_provider CHECK (provider IN ('github', 'gitlab', 'gitea'))
-- [jooq ignore stop]
);

CREATE TABLE code_link (
    code_link_id uuid NOT NULL,
    integration_id uuid NOT NULL,
    issue_id uuid NOT NULL,
    kind varchar(16) NOT NULL,
    external_id varchar(255) NOT NULL,
    url varchar(1000) NOT NULL,
    title varchar(500) NOT NULL,
    state varchar(16) NOT NULL,
    author varchar(128),
    detail varchar(500),
    created_at timestamptz NOT NULL,
    updated_at timestamptz NOT NULL,
    CONSTRAINT code_link_pkey PRIMARY KEY (code_link_id)
-- [jooq ignore start]
    , CONSTRAINT code_link_integration_fkey FOREIGN KEY (integration_id) REFERENCES repository_integration (integration_id) ON DELETE CASCADE
    , CONSTRAINT code_link_issue_fkey FOREIGN KEY (issue_id) REFERENCES issue (issue_id) ON DELETE CASCADE
    , CONSTRAINT code_link_kind CHECK (kind IN ('branch', 'pull_request', 'commit'))
    , CONSTRAINT code_link_state CHECK (state IN ('open', 'draft', 'merged', 'closed'))
-- [jooq ignore stop]
);

CREATE TABLE document_folder (
    folder_id uuid NOT NULL,
    project_id uuid,
    parent_id uuid,
    name varchar(100) NOT NULL,
    version bigint DEFAULT 0 NOT NULL,
    created_at timestamptz DEFAULT (strftime('%Y-%m-%dT%H:%M:%S', 'now') || substr(strftime('%f', 'now'), 3) || '000Z') NOT NULL,
    created_by uuid,
    updated_at timestamptz DEFAULT (strftime('%Y-%m-%dT%H:%M:%S', 'now') || substr(strftime('%f', 'now'), 3) || '000Z') NOT NULL,
    updated_by uuid,
    deleted_at timestamptz,
    deleted_by uuid, icon varchar(64), color varchar(7),
    CONSTRAINT document_folder_pkey PRIMARY KEY (folder_id)
-- [jooq ignore start]
    , CONSTRAINT document_folder_project_fkey FOREIGN KEY (project_id) REFERENCES project (project_id) ON DELETE CASCADE
    , CONSTRAINT document_folder_parent_fkey FOREIGN KEY (parent_id) REFERENCES document_folder (folder_id) ON DELETE CASCADE
    , CONSTRAINT document_folder_name CHECK (length(trim(name)) > 0 AND instr(name, '/') = 0)
-- [jooq ignore stop]
);

CREATE TABLE document (
    document_id uuid NOT NULL,
    project_id uuid,
    folder_id uuid,
    title varchar(200) NOT NULL,
    body_text text DEFAULT '' NOT NULL,
    version bigint DEFAULT 0 NOT NULL,
    created_at timestamptz DEFAULT (strftime('%Y-%m-%dT%H:%M:%S', 'now') || substr(strftime('%f', 'now'), 3) || '000Z') NOT NULL,
    created_by uuid,
    updated_at timestamptz DEFAULT (strftime('%Y-%m-%dT%H:%M:%S', 'now') || substr(strftime('%f', 'now'), 3) || '000Z') NOT NULL,
    updated_by uuid,
    deleted_at timestamptz,
    deleted_by uuid, kind varchar(16) DEFAULT 'PAGE' NOT NULL, icon varchar(64), color varchar(7), facet_id uuid, parent_id uuid
-- [jooq ignore start]
 REFERENCES document(document_id)
-- [jooq ignore stop]
,
    CONSTRAINT document_pkey PRIMARY KEY (document_id)
-- [jooq ignore start]
    , CONSTRAINT document_project_fkey FOREIGN KEY (project_id) REFERENCES project (project_id) ON DELETE CASCADE
    , CONSTRAINT document_folder_fkey FOREIGN KEY (folder_id) REFERENCES document_folder (folder_id) ON DELETE SET NULL
    , CONSTRAINT document_title CHECK (length(trim(title)) > 0)
-- [jooq ignore stop]
);

CREATE TABLE document_editing (
 owner_type varchar(64) NOT NULL,
 owner_id uuid NOT NULL,
 user_id uuid NOT NULL,
 lease_id uuid NOT NULL,
 started_at timestamptz NOT NULL,
 last_seen_at timestamptz NOT NULL,
 PRIMARY KEY(owner_type,owner_id,user_id,lease_id)
-- [jooq ignore start]
 , FOREIGN KEY(user_id) REFERENCES users(user_id)
-- [jooq ignore stop]
);

CREATE TABLE document_grant (
    grant_id uuid NOT NULL,
    target_type varchar(16) NOT NULL,
    target_id uuid NOT NULL,
    subject_type varchar(16) NOT NULL,
    subject_id uuid,
    level varchar(16) NOT NULL,
    created_at timestamptz DEFAULT (strftime('%Y-%m-%dT%H:%M:%S', 'now') || substr(strftime('%f', 'now'), 3) || '000Z') NOT NULL,
    created_by uuid,
    CONSTRAINT document_grant_pkey PRIMARY KEY (grant_id)
-- [jooq ignore start]
    , CONSTRAINT document_grant_target CHECK (target_type IN ('FOLDER', 'DOCUMENT'))
    , CONSTRAINT document_grant_subject CHECK (
        (subject_type = 'OWNER' AND subject_id IS NULL)
        OR (subject_type IN ('USER', 'PROJECT') AND subject_id IS NOT NULL))
    , CONSTRAINT document_grant_level CHECK (level IN ('READ', 'WRITE', 'MANAGE'))
-- [jooq ignore stop]
);

CREATE TABLE document_label (
 label_id uuid PRIMARY KEY, name varchar(200) NOT NULL, color varchar(7) NOT NULL,
 position integer NOT NULL DEFAULT 0, version bigint NOT NULL DEFAULT 0
);

CREATE TABLE document_label_link (
 document_id uuid NOT NULL, label_id uuid NOT NULL, PRIMARY KEY(document_id,label_id)
-- [jooq ignore start]
 , FOREIGN KEY(document_id) REFERENCES document(document_id), FOREIGN KEY(label_id) REFERENCES "document_label"(label_id)
-- [jooq ignore stop]
);

CREATE TABLE document_library_order (
 project_id uuid PRIMARY KEY, ids text NOT NULL DEFAULT '[]', version bigint NOT NULL DEFAULT 0
-- [jooq ignore start]
 , FOREIGN KEY(project_id) REFERENCES project(project_id)
-- [jooq ignore stop]
);

CREATE TABLE document_view (
 view_id uuid PRIMARY KEY, project_id uuid NOT NULL, name varchar(200) NOT NULL,
 label_ids text NOT NULL DEFAULT '[]', layout varchar(16) NOT NULL DEFAULT 'LIST', sort varchar(16) NOT NULL DEFAULT 'CUSTOM',
 version bigint NOT NULL DEFAULT 0

 , direction varchar(4) NOT NULL DEFAULT 'ASC'
 , icon varchar(64)
 , color varchar(7)
 , position integer NOT NULL DEFAULT 0
-- [jooq ignore start]
 , FOREIGN KEY(project_id) REFERENCES project(project_id)
 , CHECK(layout IN ('LIST','GRID'))
 , CHECK(sort IN ('CUSTOM','TITLE','UPDATED','CREATED'))
-- [jooq ignore stop]
);

CREATE TABLE iam_otp (
    user_account_id uuid NOT NULL,
    code_hash varchar(64) NOT NULL,
    issued_at timestamptz NOT NULL,
    expires_at timestamptz NOT NULL,
    attempts integer DEFAULT 0 NOT NULL,
    consumed boolean DEFAULT 0 NOT NULL,
    CONSTRAINT iam_otp_pkey PRIMARY KEY (user_account_id)
-- [jooq ignore start]
    , CONSTRAINT iam_otp_user_account_id_fkey FOREIGN KEY (user_account_id) REFERENCES "users"(user_id)
    , CONSTRAINT iam_otp_attempts_check CHECK ((attempts >= 0))
-- [jooq ignore stop]
);

CREATE TABLE iam_permission_lock (
    id integer NOT NULL,
    CONSTRAINT iam_permission_lock_pkey PRIMARY KEY (id)
);

CREATE TABLE iam_session (
    token_hash varchar(64) NOT NULL,
    user_account_id uuid NOT NULL,
    created_at timestamptz NOT NULL,
    touched_at timestamptz NOT NULL,
    expires_at timestamptz NOT NULL,
    CONSTRAINT iam_session_pkey PRIMARY KEY (token_hash)
-- [jooq ignore start]
    , CONSTRAINT iam_session_user_account_id_fkey FOREIGN KEY (user_account_id) REFERENCES "users"(user_id)
-- [jooq ignore stop]
);

CREATE TABLE integration_rule (
    project_id uuid NOT NULL,
    event varchar(16) NOT NULL,
    column_id uuid,
    updated_at timestamptz NOT NULL,
    updated_by uuid,
    CONSTRAINT integration_rule_pkey PRIMARY KEY (project_id, event)
-- [jooq ignore start]
    , CONSTRAINT integration_rule_project_fkey FOREIGN KEY (project_id) REFERENCES project (project_id)
    , CONSTRAINT integration_rule_event CHECK (event IN ('branch_push', 'pr_opened', 'pr_merged'))
-- [jooq ignore stop]
);

CREATE TABLE issue_cycle (
    cycle_id uuid NOT NULL,
    project_id uuid NOT NULL,
    name varchar(80) NOT NULL,
    goal varchar(500),
    start_date date NOT NULL,
    end_date date NOT NULL,
    completed_at timestamptz,
    version bigint DEFAULT 0 NOT NULL,
    created_at timestamptz NOT NULL,
    created_by uuid,
    updated_at timestamptz NOT NULL,
    updated_by uuid,
    CONSTRAINT issue_cycle_pkey PRIMARY KEY (cycle_id)
-- [jooq ignore start]
    , CONSTRAINT issue_cycle_project_fkey FOREIGN KEY (project_id) REFERENCES project (project_id) ON DELETE CASCADE
    , CONSTRAINT issue_cycle_dates CHECK (start_date <= end_date)
-- [jooq ignore stop]
);

CREATE TABLE issue_cycle_settings (
    project_id uuid NOT NULL,
    is_enabled boolean DEFAULT 0 NOT NULL,
    weeks integer DEFAULT 2 NOT NULL,
    start_day integer DEFAULT 1 NOT NULL,
    upcoming integer DEFAULT 2 NOT NULL,
    adds_started boolean DEFAULT 1 NOT NULL,
    adds_completed boolean DEFAULT 1 NOT NULL,
    updated_at timestamptz NOT NULL,
    updated_by uuid,
    CONSTRAINT issue_cycle_settings_pkey PRIMARY KEY (project_id)
-- [jooq ignore start]
    , CONSTRAINT issue_cycle_settings_project_fkey FOREIGN KEY (project_id) REFERENCES project (project_id) ON DELETE CASCADE
    , CONSTRAINT issue_cycle_settings_weeks CHECK (weeks BETWEEN 1 AND 8)
    , CONSTRAINT issue_cycle_settings_start_day CHECK (start_day BETWEEN 1 AND 7)
    , CONSTRAINT issue_cycle_settings_upcoming CHECK (upcoming BETWEEN 0 AND 6)
-- [jooq ignore stop]
);

CREATE TABLE issue_label (
    label_id uuid NOT NULL,
    name varchar(32) NOT NULL,
    color varchar(7) NOT NULL,
    "position" integer NOT NULL,
    created_at timestamptz DEFAULT (strftime('%Y-%m-%dT%H:%M:%S', 'now') || substr(strftime('%f', 'now'), 3) || '000Z') NOT NULL,
    created_by uuid,
    updated_at timestamptz DEFAULT (strftime('%Y-%m-%dT%H:%M:%S', 'now') || substr(strftime('%f', 'now'), 3) || '000Z') NOT NULL,
    updated_by uuid,
    CONSTRAINT issue_label_next_pkey PRIMARY KEY (label_id)
-- [jooq ignore start]
    , CONSTRAINT issue_label_next_color CHECK (color GLOB '#[0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f]')
-- [jooq ignore stop]
);

CREATE TABLE issue_label_link (
    issue_id uuid NOT NULL,
    label_id uuid NOT NULL,
    created_at timestamptz DEFAULT (strftime('%Y-%m-%dT%H:%M:%S', 'now') || substr(strftime('%f', 'now'), 3) || '000Z') NOT NULL,
    created_by uuid,
    CONSTRAINT issue_label_link_next_pkey PRIMARY KEY (issue_id, label_id)
-- [jooq ignore start]
    , CONSTRAINT issue_label_link_next_issue_fkey FOREIGN KEY (issue_id) REFERENCES issue (issue_id) ON DELETE CASCADE
    , CONSTRAINT issue_label_link_next_label_fkey FOREIGN KEY (label_id) REFERENCES "issue_label" (label_id) ON DELETE CASCADE
-- [jooq ignore stop]
);

CREATE TABLE issue_time_entry (
    entry_id uuid NOT NULL,
    issue_id uuid NOT NULL,
    member_id uuid NOT NULL,
    spent_on date NOT NULL,
    minutes integer NOT NULL,
    note varchar(200),
    created_at timestamptz NOT NULL,
    created_by uuid,
    CONSTRAINT issue_time_entry_pkey PRIMARY KEY (entry_id)
-- [jooq ignore start]
    , CONSTRAINT issue_time_entry_issue_fkey FOREIGN KEY (issue_id) REFERENCES issue (issue_id) ON DELETE CASCADE
    , CONSTRAINT issue_time_entry_minutes CHECK (minutes > 0 AND minutes <= 1440)
-- [jooq ignore stop]
);

CREATE TABLE issue_view (
    view_id uuid NOT NULL,
    project_id uuid,
    owner_id uuid,
    is_personal boolean DEFAULT 0 NOT NULL,
    name varchar(32) NOT NULL,
    icon varchar(64) NOT NULL,
    color varchar(7) NOT NULL,
    layout varchar(8) NOT NULL,
    filters text NOT NULL,
    sort varchar(8) NOT NULL,
    direction varchar(4) NOT NULL,
    grouping varchar(16) NOT NULL,
    version bigint DEFAULT 0 NOT NULL,
    created_at timestamptz DEFAULT (strftime('%Y-%m-%dT%H:%M:%S', 'now') || substr(strftime('%f', 'now'), 3) || '000Z') NOT NULL,
    created_by uuid,
    updated_at timestamptz DEFAULT (strftime('%Y-%m-%dT%H:%M:%S', 'now') || substr(strftime('%f', 'now'), 3) || '000Z') NOT NULL,
    updated_by uuid,
    CONSTRAINT issue_view_next_pkey PRIMARY KEY (view_id)
-- [jooq ignore start]
    , CONSTRAINT issue_view_project_fkey FOREIGN KEY (project_id) REFERENCES project (project_id) ON DELETE CASCADE
    , CONSTRAINT issue_view_personal CHECK (is_personal IN (0, 1) AND (is_personal = 0 OR owner_id IS NOT NULL))
    , CONSTRAINT issue_view_name CHECK (length(trim(name)) > 0)
    , CONSTRAINT issue_view_color CHECK (color GLOB '#[0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f]')
    , CONSTRAINT issue_view_layout CHECK (layout IN ('LIST', 'BOARD', 'TIMELINE'))
    , CONSTRAINT issue_view_filters CHECK (length(filters) <= 8000 AND json_valid(filters) AND json_type(filters) = 'object')
    , CONSTRAINT issue_view_sort CHECK (sort IN ('BOARD', 'UPDATED', 'CREATED'))
    , CONSTRAINT issue_view_direction CHECK (direction IN ('ASC', 'DESC'))
    , CONSTRAINT issue_view_grouping CHECK (grouping IN ('STATUS', 'ASSIGNEE', 'PRIORITY', 'TYPE', 'PROJECT', 'NONE'))
-- [jooq ignore stop]
);

CREATE TABLE issue_view_order (
    scope varchar(40) NOT NULL,
    view_keys text NOT NULL,
    updated_at timestamptz DEFAULT (strftime('%Y-%m-%dT%H:%M:%S', 'now') || substr(strftime('%f', 'now'), 3) || '000Z') NOT NULL,
    updated_by uuid,
    CONSTRAINT issue_view_order_pkey PRIMARY KEY (scope)
-- [jooq ignore start]
    , CONSTRAINT issue_view_order_keys CHECK (length(view_keys) <= 8000 AND json_valid(view_keys) AND json_type(view_keys) = 'array')
-- [jooq ignore stop]
);

CREATE TABLE manual_chapter (
    chapter_id uuid NOT NULL,
    document_id uuid NOT NULL,
    parent_id uuid,
    position integer NOT NULL,
    title varchar(200) NOT NULL,
    body_text text DEFAULT '' NOT NULL,
    version bigint DEFAULT 0 NOT NULL,
    created_at timestamptz DEFAULT (strftime('%Y-%m-%dT%H:%M:%S', 'now') || substr(strftime('%f', 'now'), 3) || '000Z') NOT NULL,
    created_by uuid,
    updated_at timestamptz DEFAULT (strftime('%Y-%m-%dT%H:%M:%S', 'now') || substr(strftime('%f', 'now'), 3) || '000Z') NOT NULL,
    updated_by uuid,
    deleted_at timestamptz,
    deleted_by uuid,
    CONSTRAINT manual_chapter_pkey PRIMARY KEY (chapter_id)
-- [jooq ignore start]
    , CONSTRAINT manual_chapter_document_fkey FOREIGN KEY (document_id) REFERENCES document (document_id) ON DELETE CASCADE
    , CONSTRAINT manual_chapter_parent_fkey FOREIGN KEY (parent_id) REFERENCES manual_chapter (chapter_id) ON DELETE CASCADE
    , CONSTRAINT manual_chapter_title CHECK (length(trim(title)) > 0)
-- [jooq ignore stop]
);

CREATE TABLE notification_event (
    event_id uuid NOT NULL,
    kind varchar(64) NOT NULL,
    title varchar(200) NOT NULL,
    message text NOT NULL,
    link varchar(500),
    created_at timestamptz DEFAULT (strftime('%Y-%m-%dT%H:%M:%S', 'now') || substr(strftime('%f', 'now'), 3) || '000Z') NOT NULL,
    actor_id uuid, subject_type varchar(32), subject_id uuid, ends varchar(8) DEFAULT 'SEEN' NOT NULL, expires_at timestamptz,
    CONSTRAINT notification_event_pkey PRIMARY KEY (event_id)
);

CREATE TABLE notification_recipient (
    event_id uuid NOT NULL,
    recipient_id uuid NOT NULL,
    read_at timestamptz,
    CONSTRAINT notification_recipient_new_pkey PRIMARY KEY (event_id, recipient_id)
-- [jooq ignore start]
    , CONSTRAINT notification_recipient_event_id_notification_event_event_id_fk FOREIGN KEY (event_id) REFERENCES notification_event(event_id) ON DELETE CASCADE
    , CONSTRAINT notification_recipient_recipient_id_users_user_id_fk FOREIGN KEY (recipient_id) REFERENCES users(user_id) ON DELETE CASCADE
-- [jooq ignore stop]
);

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

CREATE TABLE project_favorite (
    user_id uuid NOT NULL,
    project_id uuid NOT NULL,
    created_at timestamptz DEFAULT (strftime('%Y-%m-%dT%H:%M:%S', 'now') || substr(strftime('%f', 'now'), 3) || '000Z') NOT NULL, is_favorite boolean NOT NULL DEFAULT true,
    CONSTRAINT project_favorite_pkey PRIMARY KEY (user_id, project_id)
-- [jooq ignore start]
    , CONSTRAINT project_favorite_project_fkey FOREIGN KEY (project_id) REFERENCES project (project_id) ON DELETE CASCADE
    , CONSTRAINT project_favorite_user_fkey FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE
-- [jooq ignore stop]
);

CREATE TABLE project_key (
    prefix varchar(10) NOT NULL,
    project_id uuid NOT NULL,
    is_current boolean NOT NULL,
    created_at timestamptz DEFAULT (strftime('%Y-%m-%dT%H:%M:%S', 'now') || substr(strftime('%f', 'now'), 3) || '000Z') NOT NULL,
    CONSTRAINT project_key_pkey PRIMARY KEY (prefix)
-- [jooq ignore start]
    , CONSTRAINT project_key_project_fkey FOREIGN KEY (project_id) REFERENCES project (project_id) ON DELETE CASCADE
    , CONSTRAINT project_key_format CHECK (length(prefix) BETWEEN 2 AND 10 AND prefix NOT GLOB '*[^A-Z0-9]*')
-- [jooq ignore stop]
);

CREATE TABLE project_member (
    project_id uuid NOT NULL,
    user_id uuid NOT NULL,
    created_at timestamptz DEFAULT (strftime('%Y-%m-%dT%H:%M:%S', 'now') || substr(strftime('%f', 'now'), 3) || '000Z') NOT NULL,
    created_by uuid, role text NOT NULL DEFAULT 'EDITOR' CHECK (role IN ('VIEWER', 'EDITOR', 'ADMIN')),
    CONSTRAINT project_member_pkey PRIMARY KEY (project_id, user_id)
-- [jooq ignore start]
    , CONSTRAINT project_member_project_fkey FOREIGN KEY (project_id) REFERENCES project (project_id) ON DELETE CASCADE
    , CONSTRAINT project_member_user_fkey FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE
-- [jooq ignore stop]
);

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
    , CONSTRAINT push_subscription_user_account_id_user_account_user_account_id_ FOREIGN KEY (user_account_id) REFERENCES "users"(user_id) ON DELETE CASCADE
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
    CONSTRAINT push_delivery_new_pkey PRIMARY KEY (delivery_id)
-- [jooq ignore start]
    , CONSTRAINT push_delivery_event_id_fkey FOREIGN KEY (event_id) REFERENCES notification_event(event_id) ON DELETE CASCADE
    , CONSTRAINT push_delivery_recipient_id_fkey FOREIGN KEY (recipient_id) REFERENCES users(user_id) ON DELETE CASCADE
    , CONSTRAINT push_delivery_subscription_id_fkey FOREIGN KEY (subscription_id) REFERENCES push_subscription(subscription_id) ON DELETE SET NULL
-- [jooq ignore stop]
);

CREATE TABLE push_preference (
    user_id uuid NOT NULL,
    topic varchar(32) NOT NULL,
    CONSTRAINT push_preference_new_pkey PRIMARY KEY (user_id, topic)
-- [jooq ignore start]
    , CONSTRAINT push_preference_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
-- [jooq ignore stop]
);

CREATE TABLE refresh_token (
    refresh_token_id uuid NOT NULL,
    session_id uuid NOT NULL,
    user_account_id uuid NOT NULL,
    token_hash varchar(128) NOT NULL,
    expires_at timestamptz NOT NULL,
    created_at timestamptz DEFAULT (strftime('%Y-%m-%dT%H:%M:%S', 'now') || substr(strftime('%f', 'now'), 3) || '000Z') NOT NULL,
    rotated_to_id uuid,
    revoked_at timestamptz,
    CONSTRAINT refresh_token_pkey PRIMARY KEY (refresh_token_id)
);

CREATE TABLE rich_body (
    owner_id uuid NOT NULL,
    owner_type varchar(32) NOT NULL,
    body text NOT NULL,
    anchors text NOT NULL,
    comment_seq bigint DEFAULT 0 NOT NULL,
    version bigint DEFAULT 0 NOT NULL,
    updated_at timestamptz DEFAULT (strftime('%Y-%m-%dT%H:%M:%S', 'now') || substr(strftime('%f', 'now'), 3) || '000Z') NOT NULL,
    updated_by uuid, attrs text,
    CONSTRAINT rich_body_pkey PRIMARY KEY (owner_id)
-- [jooq ignore start]
    , CONSTRAINT rich_body_json CHECK (json_valid(body) AND json_valid(anchors))
-- [jooq ignore stop]
);

CREATE TABLE rich_block (
    owner_id uuid NOT NULL,
    block_id varchar(64) NOT NULL,
    -- 끼워 넣기 쉬운 순서 키(사전순). 블록을 넣거나 옮길 때 그 블록의 키만 앞뒤 사이 값으로 새로 정한다.
    position varchar(255) NOT NULL,
    node text NOT NULL,
    version bigint NOT NULL,
    updated_at timestamptz DEFAULT (strftime('%Y-%m-%dT%H:%M:%S', 'now') || substr(strftime('%f', 'now'), 3) || '000Z') NOT NULL,
    updated_by uuid,
    CONSTRAINT rich_block_pkey PRIMARY KEY (owner_id, block_id)
-- [jooq ignore start]
    , CONSTRAINT rich_block_owner_fkey FOREIGN KEY (owner_id) REFERENCES rich_body (owner_id) ON DELETE CASCADE
    , CONSTRAINT rich_block_node CHECK (json_valid(node))
-- [jooq ignore stop]
);

CREATE TABLE rich_block_change (
    owner_id uuid NOT NULL,
    version bigint NOT NULL,
    block_id varchar(64) NOT NULL,
    node text,
    changed_at timestamptz DEFAULT (strftime('%Y-%m-%dT%H:%M:%S', 'now') || substr(strftime('%f', 'now'), 3) || '000Z') NOT NULL,
    changed_by uuid,
    CONSTRAINT rich_block_change_pkey PRIMARY KEY (owner_id, version, block_id)
-- [jooq ignore start]
    , CONSTRAINT rich_block_change_owner_fkey FOREIGN KEY (owner_id) REFERENCES rich_body (owner_id) ON DELETE CASCADE
-- [jooq ignore stop]
);

CREATE TABLE rich_body_revision (
    revision_id uuid NOT NULL,
    owner_id uuid NOT NULL,
    body text NOT NULL,
    anchors text NOT NULL,
    comment_seq bigint NOT NULL,
    reason varchar(16) NOT NULL,
    created_at timestamptz DEFAULT (strftime('%Y-%m-%dT%H:%M:%S', 'now') || substr(strftime('%f', 'now'), 3) || '000Z') NOT NULL,
    created_by uuid, body_gz blob,
    CONSTRAINT rich_body_revision_pkey PRIMARY KEY (revision_id)
-- [jooq ignore start]
    , CONSTRAINT rich_body_revision_owner_fkey FOREIGN KEY (owner_id) REFERENCES rich_body (owner_id) ON DELETE CASCADE
    , CONSTRAINT rich_body_revision_reason CHECK (reason IN ('baseline', 'automatic', 'before-restore', 'restored'))
-- [jooq ignore stop]
);

CREATE TABLE seed_import (
    file_name varchar(255) NOT NULL,
    checksum varchar(64) NOT NULL,
    imported_at timestamptz NOT NULL,
    summary varchar(1000) NOT NULL,
    CONSTRAINT seed_import_pkey PRIMARY KEY (file_name)
);

CREATE TABLE user_role (
    user_id uuid NOT NULL,
    role varchar(32) NOT NULL CHECK (role IN ('INSTANCE_ADMIN', 'WORKSPACE_ADMIN')),
    granted_at timestamptz NOT NULL,
    granted_by uuid,
    CONSTRAINT user_role_next_pkey PRIMARY KEY (user_id, role)
-- [jooq ignore start]
    , CONSTRAINT user_role_user_fk FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
-- [jooq ignore stop]
);

-- [jooq ignore start]
CREATE INDEX ix_activity_entry_block ON activity_entry (owner_id, block_id);
CREATE INDEX ix_activity_entry_owner ON activity_entry (owner_id, created_at);
CREATE INDEX ix_activity_entry_parent ON activity_entry (parent_id);
CREATE UNIQUE INDEX ux_users_email ON users (email);
CREATE INDEX ix_agent_profile_user ON agent_profile(user_id,name,profile_id);
CREATE INDEX ix_agent_token_user ON agent_token (user_id, created_at, token_id);
CREATE UNIQUE INDEX uq_agent_token_profile ON agent_token(profile_id);
CREATE UNIQUE INDEX ux_agent_token_hash ON agent_token (token_hash);
CREATE INDEX ix_blob_checksum ON blob (checksum);
CREATE INDEX ix_attachment_blob ON attachment (blob_id);
CREATE INDEX ix_attachment_owner ON attachment (owner_type, owner_id);
CREATE INDEX ix_work_item_type_position ON work_item_type ("position", code);
CREATE UNIQUE INDEX ux_work_item_type_name ON work_item_type (lower(name));
CREATE INDEX ix_issue_column_project ON issue_column (project_id, "position");
CREATE INDEX ix_issue_assignee ON issue (assignee_id);
CREATE INDEX ix_issue_column_position ON issue (column_id, "position", issue_id);
CREATE INDEX ix_issue_cycle_id ON issue (cycle_id);
CREATE INDEX ix_issue_parent ON issue (parent_id);
CREATE INDEX ix_issue_type ON issue (type);
CREATE INDEX ix_issue_updated ON issue (updated_at, issue_id);
CREATE UNIQUE INDEX ux_issue_project_number ON issue (project_id, number);
CREATE UNIQUE INDEX ux_repository_integration_project_repository
    ON repository_integration (project_id, provider, base_url, repository COLLATE NOCASE);
CREATE INDEX ix_code_link_issue ON code_link (issue_id, updated_at);
CREATE UNIQUE INDEX ux_code_link_integration_kind_external_issue ON code_link (integration_id, kind, external_id, issue_id);
CREATE INDEX ix_document_folder_space ON document_folder (project_id, parent_id);
CREATE UNIQUE INDEX ux_document_folder_name ON document_folder (ifnull(project_id, ''), ifnull(parent_id, ''), lower(name))
    WHERE deleted_at IS NULL;
CREATE INDEX ix_document_created ON document (created_at, document_id);
CREATE INDEX ix_document_kind ON document (kind, updated_at);
CREATE INDEX ix_document_parent ON document(parent_id);
CREATE INDEX ix_document_space ON document (project_id, folder_id);
CREATE INDEX ix_document_updated ON document (updated_at, document_id);
CREATE INDEX ix_document_editing_expiry ON document_editing(last_seen_at);
CREATE INDEX ix_document_grant_target ON document_grant (target_type, target_id);
CREATE UNIQUE INDEX ux_document_grant_subject ON document_grant (target_type, target_id, subject_type, ifnull(subject_id, ''));
CREATE UNIQUE INDEX ux_document_label_new_name ON "document_label"(lower(name));
CREATE INDEX iam_session_expiry ON iam_session (expires_at);
CREATE INDEX iam_session_user ON iam_session (user_account_id);
CREATE INDEX ix_issue_cycle_project ON issue_cycle (project_id, start_date);
CREATE INDEX ix_issue_label_position ON issue_label ("position", label_id);
CREATE UNIQUE INDEX ux_issue_label_name ON issue_label (lower(name));
CREATE INDEX ix_issue_label_link_label ON issue_label_link (label_id, issue_id);
CREATE INDEX ix_issue_time_entry_issue ON issue_time_entry (issue_id, spent_on);
CREATE INDEX ix_issue_time_entry_member ON issue_time_entry (member_id, spent_on);
CREATE INDEX ix_issue_view_scope ON issue_view (project_id, created_at, view_id);
CREATE INDEX ix_manual_chapter_manual ON manual_chapter (document_id, parent_id, position);
CREATE INDEX ix_notification_event_created ON notification_event (created_at, event_id);
CREATE INDEX ix_notification_event_expires ON notification_event (expires_at);
CREATE INDEX ix_notification_event_kind_created ON notification_event (kind, created_at);
CREATE INDEX ix_notification_event_subject ON notification_event (subject_type, subject_id);
CREATE INDEX ix_notification_recipient_by_recipient ON notification_recipient (recipient_id, event_id);
CREATE INDEX ix_notification_recipient_unread ON notification_recipient (recipient_id) WHERE (read_at IS NULL);
CREATE INDEX pending_upload_created_at_idx ON pending_upload (created_at);
CREATE INDEX ix_project_key_project ON project_key (project_id);
CREATE UNIQUE INDEX ux_project_key_current ON project_key (project_id) WHERE is_current = 1;
CREATE INDEX ix_project_member_user ON project_member (user_id);
CREATE INDEX ix_push_subscription_user ON push_subscription (user_account_id, expired_at);
CREATE UNIQUE INDEX ux_push_subscription_endpoint ON push_subscription (endpoint);
CREATE INDEX ix_push_delivery_recipient ON push_delivery (recipient_id, created_at DESC);
CREATE INDEX ix_push_delivery_status ON push_delivery (status, created_at);
CREATE UNIQUE INDEX ux_refresh_token_token_hash ON refresh_token (token_hash);
CREATE INDEX ix_rich_block_order ON rich_block (owner_id, position);
CREATE INDEX ix_rich_body_revision_owner ON rich_body_revision (owner_id, created_at);
-- [jooq ignore stop]

-- [jooq ignore start]
INSERT INTO iam_permission_lock (id) VALUES (1);
INSERT INTO work_item_type (code, name, icon, color, position, is_default, created_by, updated_by) VALUES ('TASK', '작업', 'checklist', '#95959f', 3, 1, NULL, NULL);
INSERT INTO work_item_type (code, name, icon, color, position, is_default, created_by, updated_by) VALUES ('BUG', '버그', 'bug', '#eb5757', 4, 0, NULL, NULL);
INSERT INTO work_item_type (code, name, icon, color, position, is_default, created_by, updated_by) VALUES ('FEATURE', '기능', 'idea', '#f2994a', 2, 0, NULL, NULL);
INSERT INTO work_item_type (code, name, icon, color, position, is_default, created_by, updated_by) VALUES ('EPIC', '에픽', 'epic', '#5e6ad2', 0, 0, NULL, NULL);
INSERT INTO work_item_type (code, name, icon, color, position, is_default, created_by, updated_by) VALUES ('STORY', '스토리', 'document', '#4cb782', 1, 0, NULL, NULL);
INSERT INTO issue_view (view_id, project_id, owner_id, is_personal, name, icon, color, layout, filters, sort, direction, grouping, version, created_by, updated_by) VALUES ('528046ee-ccef-49ef-acee-6c5e5606f5cf', NULL, NULL, 0, '칸반보드', 'layout-board', '#f2c94c', 'BOARD', '{}', 'UPDATED', 'DESC', 'STATUS', 0, NULL, NULL);
INSERT INTO issue_view (view_id, project_id, owner_id, is_personal, name, icon, color, layout, filters, sort, direction, grouping, version, created_by, updated_by) VALUES ('da6dadeb-2907-4a4c-8c49-c074cdf8d3d0', NULL, NULL, 0, '백로그', 'layout-list', '#4cb782', 'LIST', '{"status":"BACKLOG"}', 'UPDATED', 'DESC', 'STATUS', 0, NULL, NULL);
INSERT INTO issue_view_order (scope, view_keys, updated_by) VALUES ('area', '["all","528046ee-ccef-49ef-acee-6c5e5606f5cf","da6dadeb-2907-4a4c-8c49-c074cdf8d3d0"]', NULL);
-- [jooq ignore stop]
