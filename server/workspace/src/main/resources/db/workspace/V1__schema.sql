-- workspace의 표. 프로젝트 · 이슈 · 문서 · 활동 · 본문.
-- jOOQ의 DDL 파서(H2)가 다시 실행하지 못하는 제약과 색인은 [jooq ignore] 표시 사이에 둔다.
-- 다른 하위 프로젝트의 표(사용자 · 파일)는 가리키지 않는다. 그쪽 ID는 값으로만 둔다.

CREATE TABLE activity_entry (
    entry_id uuid NOT NULL,
    owner_type varchar(32) NOT NULL,
    owner_id uuid NOT NULL,
    kind varchar(16) NOT NULL,
    field varchar(32),
    before_value varchar(400),
    after_value varchar(400),
    body TEXT,
    quote TEXT,
    created_at timestamptz DEFAULT (strftime('%Y-%m-%dT%H:%M:%S', 'now') || substr(strftime('%f', 'now'), 3) || '000Z') NOT NULL,
    created_by uuid,
    edited_at timestamptz,
    deleted_at timestamptz,
    parent_id uuid,
    actor_source varchar(8),
    agent_profile_id uuid,
    agent_name varchar(64),
    agent_icon varchar(100),
    agent_color varchar(7),
    block_id varchar(64),
    resolved_at timestamptz,
    resolved_by uuid,
    CONSTRAINT activity_entry_pkey PRIMARY KEY (entry_id)
);

-- [jooq ignore start]
CREATE INDEX ix_activity_entry_block ON activity_entry (owner_id, block_id);
CREATE INDEX ix_activity_entry_owner ON activity_entry (owner_id, created_at);
CREATE INDEX ix_activity_entry_parent ON activity_entry (parent_id);
-- [jooq ignore stop]

CREATE TABLE document_editing (
    owner_type varchar(64) NOT NULL,
    owner_id uuid NOT NULL,
    user_id uuid NOT NULL,
    lease_id uuid NOT NULL,
    started_at timestamptz NOT NULL,
    last_seen_at timestamptz NOT NULL,
    CONSTRAINT document_editing_pkey PRIMARY KEY (owner_type, owner_id, user_id, lease_id)
);

-- [jooq ignore start]
CREATE INDEX ix_document_editing_expiry ON document_editing(last_seen_at);
-- [jooq ignore stop]

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
    , CHECK (target_type IN ('FOLDER', 'DOCUMENT'))
    , CHECK ((subject_type = 'OWNER' AND subject_id IS NULL) OR (subject_type IN ('USER', 'DEPARTMENT', 'PROJECT') AND subject_id IS NOT NULL))
    , CHECK (level IN ('READ', 'WRITE', 'MANAGE'))
-- [jooq ignore stop]
);

-- [jooq ignore start]
CREATE INDEX ix_document_grant_target ON document_grant (target_type, target_id);
CREATE UNIQUE INDEX ux_document_grant_subject ON document_grant (target_type, target_id, subject_type, ifnull(subject_id, ''));
-- [jooq ignore stop]

CREATE TABLE document_label (
    label_id uuid,
    name varchar(200) NOT NULL,
    color varchar(7) NOT NULL,
    "position" INTEGER DEFAULT 0 NOT NULL,
    version bigint DEFAULT 0 NOT NULL,
    CONSTRAINT document_label_pkey PRIMARY KEY (label_id)
);

-- [jooq ignore start]
CREATE UNIQUE INDEX ux_document_label_new_name ON "document_label"(lower(name));
-- [jooq ignore stop]

CREATE TABLE issue_label (
    label_id uuid NOT NULL,
    name varchar(32) NOT NULL,
    color varchar(7) NOT NULL,
    "position" INTEGER NOT NULL,
    created_at timestamptz DEFAULT (strftime('%Y-%m-%dT%H:%M:%S', 'now') || substr(strftime('%f', 'now'), 3) || '000Z') NOT NULL,
    created_by uuid,
    updated_at timestamptz DEFAULT (strftime('%Y-%m-%dT%H:%M:%S', 'now') || substr(strftime('%f', 'now'), 3) || '000Z') NOT NULL,
    updated_by uuid,
    CONSTRAINT issue_label_pkey PRIMARY KEY (label_id)
-- [jooq ignore start]
    , CHECK (color GLOB '#[0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f]')
-- [jooq ignore stop]
);

-- [jooq ignore start]
CREATE INDEX ix_issue_label_position ON issue_label ("position", label_id);
CREATE UNIQUE INDEX ux_issue_label_name ON issue_label (lower(name));
-- [jooq ignore stop]

CREATE TABLE issue_view_order (
    scope varchar(40) NOT NULL,
    view_keys TEXT NOT NULL,
    updated_at timestamptz DEFAULT (strftime('%Y-%m-%dT%H:%M:%S', 'now') || substr(strftime('%f', 'now'), 3) || '000Z') NOT NULL,
    updated_by uuid,
    CONSTRAINT issue_view_order_pkey PRIMARY KEY (scope)
-- [jooq ignore start]
    , CHECK (length(view_keys) <= 8000 AND json_valid(view_keys) AND json_type(view_keys) = 'array')
-- [jooq ignore stop]
);

CREATE TABLE project (
    project_id uuid NOT NULL,
    name TEXT NOT NULL,
    created_at timestamptz DEFAULT (strftime('%Y-%m-%dT%H:%M:%S', 'now') || substr(strftime('%f', 'now'), 3) || '000Z') NOT NULL,
    updated_at timestamptz DEFAULT (strftime('%Y-%m-%dT%H:%M:%S', 'now') || substr(strftime('%f', 'now'), 3) || '000Z') NOT NULL,
    created_by uuid,
    updated_by uuid,
    description TEXT,
    icon varchar(32),
    color varchar(7),
    "position" INTEGER DEFAULT 0 NOT NULL,
    last_work_item_number bigint DEFAULT 0 NOT NULL,
    archived_at timestamptz,
    deleted_at timestamptz,
    deleted_by uuid,
    version bigint DEFAULT 0 NOT NULL,
    CONSTRAINT project_pkey PRIMARY KEY (project_id)
);

CREATE TABLE project_favorite (
    user_id uuid NOT NULL,
    project_id uuid NOT NULL,
    created_at timestamptz DEFAULT (strftime('%Y-%m-%dT%H:%M:%S', 'now') || substr(strftime('%f', 'now'), 3) || '000Z') NOT NULL,
    is_favorite boolean DEFAULT true NOT NULL,
    CONSTRAINT project_favorite_pkey PRIMARY KEY (user_id, project_id)
-- [jooq ignore start]
    , FOREIGN KEY (project_id) REFERENCES project (project_id) ON DELETE CASCADE
-- [jooq ignore stop]
);

CREATE TABLE project_key (
    prefix varchar(10) NOT NULL,
    project_id uuid NOT NULL,
    is_current boolean NOT NULL,
    created_at timestamptz DEFAULT (strftime('%Y-%m-%dT%H:%M:%S', 'now') || substr(strftime('%f', 'now'), 3) || '000Z') NOT NULL,
    CONSTRAINT project_key_pkey PRIMARY KEY (prefix)
-- [jooq ignore start]
    , FOREIGN KEY (project_id) REFERENCES project (project_id) ON DELETE CASCADE
    , CHECK (length(prefix) BETWEEN 2 AND 10 AND prefix NOT GLOB '*[^A-Z0-9]*')
-- [jooq ignore stop]
);

-- [jooq ignore start]
CREATE INDEX ix_project_key_project ON project_key (project_id);
CREATE UNIQUE INDEX ux_project_key_current ON project_key (project_id) WHERE is_current = 1;
-- [jooq ignore stop]

CREATE TABLE project_member (
    project_id uuid NOT NULL,
    user_id uuid NOT NULL,
    created_at timestamptz DEFAULT (strftime('%Y-%m-%dT%H:%M:%S', 'now') || substr(strftime('%f', 'now'), 3) || '000Z') NOT NULL,
    created_by uuid,
    role TEXT DEFAULT 'EDITOR' NOT NULL,
    CONSTRAINT project_member_pkey PRIMARY KEY (project_id, user_id)
-- [jooq ignore start]
    , FOREIGN KEY (project_id) REFERENCES project (project_id) ON DELETE CASCADE
    , CHECK (role IN ('VIEWER', 'EDITOR', 'ADMIN'))
-- [jooq ignore stop]
);

-- [jooq ignore start]
CREATE INDEX ix_project_member_user ON project_member (user_id);
-- [jooq ignore stop]

CREATE TABLE repository_integration (
    integration_id uuid NOT NULL,
    project_id uuid NOT NULL,
    provider varchar(8) NOT NULL,
    base_url varchar(255) NOT NULL,
    repository varchar(255) NOT NULL,
    external_repository_id varchar(64),
    web_url varchar(500) NOT NULL,
    token_cipher TEXT,
    webhook_secret_cipher TEXT NOT NULL,
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
    , FOREIGN KEY (project_id) REFERENCES project (project_id)
    , CHECK (provider IN ('github', 'gitlab', 'gitea'))
-- [jooq ignore stop]
);

-- [jooq ignore start]
CREATE UNIQUE INDEX ux_repository_integration_project_repository ON repository_integration (project_id, provider, base_url, repository COLLATE NOCASE);
-- [jooq ignore stop]

CREATE TABLE rich_body (
    owner_id uuid NOT NULL,
    owner_type varchar(32) NOT NULL,
    body TEXT NOT NULL,
    anchors TEXT NOT NULL,
    comment_seq bigint DEFAULT 0 NOT NULL,
    version bigint DEFAULT 0 NOT NULL,
    updated_at timestamptz DEFAULT (strftime('%Y-%m-%dT%H:%M:%S', 'now') || substr(strftime('%f', 'now'), 3) || '000Z') NOT NULL,
    updated_by uuid,
    attrs TEXT,
    CONSTRAINT rich_body_pkey PRIMARY KEY (owner_id)
-- [jooq ignore start]
    , CHECK (json_valid(body) AND json_valid(anchors))
-- [jooq ignore stop]
);

CREATE TABLE rich_body_revision (
    revision_id uuid NOT NULL,
    owner_id uuid NOT NULL,
    body TEXT NOT NULL,
    anchors TEXT NOT NULL,
    comment_seq bigint NOT NULL,
    reason varchar(16) NOT NULL,
    created_at timestamptz DEFAULT (strftime('%Y-%m-%dT%H:%M:%S', 'now') || substr(strftime('%f', 'now'), 3) || '000Z') NOT NULL,
    created_by uuid,
    body_gz BLOB,
    CONSTRAINT rich_body_revision_pkey PRIMARY KEY (revision_id)
-- [jooq ignore start]
    , FOREIGN KEY (owner_id) REFERENCES rich_body (owner_id) ON DELETE CASCADE
    , CHECK (reason IN ('baseline', 'automatic', 'before-restore', 'restored'))
-- [jooq ignore stop]
);

-- [jooq ignore start]
CREATE INDEX ix_rich_body_revision_owner ON rich_body_revision (owner_id, created_at);
-- [jooq ignore stop]

CREATE TABLE work_item_type (
    code varchar(16) NOT NULL,
    name varchar(32) NOT NULL,
    icon varchar(40) NOT NULL,
    color varchar(7) NOT NULL,
    "position" INTEGER NOT NULL,
    is_default boolean DEFAULT false NOT NULL,
    created_at timestamptz DEFAULT (strftime('%Y-%m-%dT%H:%M:%S', 'now') || substr(strftime('%f', 'now'), 3) || '000Z') NOT NULL,
    created_by uuid,
    updated_at timestamptz DEFAULT (strftime('%Y-%m-%dT%H:%M:%S', 'now') || substr(strftime('%f', 'now'), 3) || '000Z') NOT NULL,
    updated_by uuid,
    CONSTRAINT work_item_type_pkey PRIMARY KEY (code)
-- [jooq ignore start]
    , CHECK (color GLOB '#[0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f]')
-- [jooq ignore stop]
);

-- [jooq ignore start]
CREATE INDEX ix_work_item_type_position ON work_item_type ("position", code);
CREATE UNIQUE INDEX ux_work_item_type_name ON work_item_type (lower(name));
-- [jooq ignore stop]

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
    deleted_by uuid,
    icon varchar(64),
    color varchar(7),
    CONSTRAINT document_folder_pkey PRIMARY KEY (folder_id)
-- [jooq ignore start]
    , FOREIGN KEY (parent_id) REFERENCES document_folder (folder_id) ON DELETE CASCADE
    , FOREIGN KEY (project_id) REFERENCES project (project_id) ON DELETE CASCADE
    , CHECK (length(trim(name)) > 0 AND instr(name, '/') = 0)
-- [jooq ignore stop]
);

-- [jooq ignore start]
CREATE INDEX ix_document_folder_space ON document_folder (project_id, parent_id);
CREATE UNIQUE INDEX ux_document_folder_name ON document_folder (ifnull(project_id, ''), ifnull(parent_id, ''), lower(name)) WHERE deleted_at IS NULL;
-- [jooq ignore stop]

CREATE TABLE document_library_order (
    project_id uuid,
    ids TEXT DEFAULT '[]' NOT NULL,
    version bigint DEFAULT 0 NOT NULL,
    CONSTRAINT document_library_order_pkey PRIMARY KEY (project_id)
-- [jooq ignore start]
    , FOREIGN KEY (project_id) REFERENCES project (project_id)
-- [jooq ignore stop]
);

CREATE TABLE document_view (
    view_id uuid,
    project_id uuid NOT NULL,
    name varchar(200) NOT NULL,
    label_ids TEXT DEFAULT '[]' NOT NULL,
    layout varchar(16) DEFAULT 'LIST' NOT NULL,
    sort varchar(16) DEFAULT 'CUSTOM' NOT NULL,
    version bigint DEFAULT 0 NOT NULL,
    direction varchar(4) DEFAULT 'ASC' NOT NULL,
    icon varchar(64),
    color varchar(7),
    "position" INTEGER DEFAULT 0 NOT NULL,
    CONSTRAINT document_view_pkey PRIMARY KEY (view_id)
-- [jooq ignore start]
    , FOREIGN KEY (project_id) REFERENCES project (project_id)
    , CHECK (layout IN ('LIST','GRID'))
    , CHECK (sort IN ('CUSTOM','TITLE','UPDATED','CREATED'))
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
    , FOREIGN KEY (project_id) REFERENCES project (project_id)
    , CHECK (event IN ('branch_push', 'pr_opened', 'pr_merged'))
-- [jooq ignore stop]
);

CREATE TABLE issue_column (
    column_id uuid NOT NULL,
    project_id uuid NOT NULL,
    name varchar(32) NOT NULL,
    category varchar(16) NOT NULL,
    "position" INTEGER NOT NULL,
    created_at timestamptz DEFAULT (strftime('%Y-%m-%dT%H:%M:%S', 'now') || substr(strftime('%f', 'now'), 3) || '000Z') NOT NULL,
    created_by uuid,
    updated_at timestamptz DEFAULT (strftime('%Y-%m-%dT%H:%M:%S', 'now') || substr(strftime('%f', 'now'), 3) || '000Z') NOT NULL,
    updated_by uuid,
    CONSTRAINT issue_column_pkey PRIMARY KEY (column_id)
-- [jooq ignore start]
    , FOREIGN KEY (project_id) REFERENCES project (project_id) ON DELETE CASCADE
    , CHECK (category IN ('BACKLOG', 'UNSTARTED', 'STARTED', 'COMPLETED', 'CANCELED'))
-- [jooq ignore stop]
);

-- [jooq ignore start]
CREATE INDEX ix_issue_column_project ON issue_column (project_id, "position");
-- [jooq ignore stop]

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
    , FOREIGN KEY (project_id) REFERENCES project (project_id) ON DELETE CASCADE
    , CHECK (start_date <= end_date)
-- [jooq ignore stop]
);

-- [jooq ignore start]
CREATE INDEX ix_issue_cycle_project ON issue_cycle (project_id, start_date);
-- [jooq ignore stop]

CREATE TABLE issue_cycle_settings (
    project_id uuid NOT NULL,
    is_enabled boolean DEFAULT 0 NOT NULL,
    weeks INTEGER DEFAULT 2 NOT NULL,
    start_day INTEGER DEFAULT 1 NOT NULL,
    upcoming INTEGER DEFAULT 2 NOT NULL,
    adds_started boolean DEFAULT 1 NOT NULL,
    adds_completed boolean DEFAULT 1 NOT NULL,
    updated_at timestamptz NOT NULL,
    updated_by uuid,
    CONSTRAINT issue_cycle_settings_pkey PRIMARY KEY (project_id)
-- [jooq ignore start]
    , FOREIGN KEY (project_id) REFERENCES project (project_id) ON DELETE CASCADE
    , CHECK (weeks BETWEEN 1 AND 8)
    , CHECK (start_day BETWEEN 1 AND 7)
    , CHECK (upcoming BETWEEN 0 AND 6)
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
    filters TEXT NOT NULL,
    sort varchar(8) NOT NULL,
    direction varchar(4) NOT NULL,
    "grouping" varchar(16) NOT NULL,
    version bigint DEFAULT 0 NOT NULL,
    created_at timestamptz DEFAULT (strftime('%Y-%m-%dT%H:%M:%S', 'now') || substr(strftime('%f', 'now'), 3) || '000Z') NOT NULL,
    created_by uuid,
    updated_at timestamptz DEFAULT (strftime('%Y-%m-%dT%H:%M:%S', 'now') || substr(strftime('%f', 'now'), 3) || '000Z') NOT NULL,
    updated_by uuid,
    CONSTRAINT issue_view_pkey PRIMARY KEY (view_id)
-- [jooq ignore start]
    , FOREIGN KEY (project_id) REFERENCES project (project_id) ON DELETE CASCADE
    , CHECK (is_personal IN (0, 1) AND (is_personal = 0 OR owner_id IS NOT NULL))
    , CHECK (length(trim(name)) > 0)
    , CHECK (color GLOB '#[0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f]')
    , CHECK (layout IN ('LIST', 'BOARD', 'TIMELINE'))
    , CHECK (length(filters) <= 8000 AND json_valid(filters) AND json_type(filters) = 'object')
    , CHECK (sort IN ('BOARD', 'UPDATED', 'CREATED'))
    , CHECK (direction IN ('ASC', 'DESC'))
    , CHECK (grouping IN ('STATUS', 'ASSIGNEE', 'PRIORITY', 'TYPE', 'PROJECT', 'NONE'))
-- [jooq ignore stop]
);

-- [jooq ignore start]
CREATE INDEX ix_issue_view_scope ON issue_view (project_id, created_at, view_id);
-- [jooq ignore stop]

CREATE TABLE rich_block (
    owner_id uuid NOT NULL,
    block_id varchar(64) NOT NULL,
    "position" varchar(255) NOT NULL,
    node TEXT NOT NULL,
    version bigint NOT NULL,
    updated_at timestamptz DEFAULT (strftime('%Y-%m-%dT%H:%M:%S', 'now') || substr(strftime('%f', 'now'), 3) || '000Z') NOT NULL,
    updated_by uuid,
    CONSTRAINT rich_block_pkey PRIMARY KEY (owner_id, block_id)
-- [jooq ignore start]
    , FOREIGN KEY (owner_id) REFERENCES rich_body (owner_id) ON DELETE CASCADE
    , CHECK (json_valid(node))
-- [jooq ignore stop]
);

-- [jooq ignore start]
CREATE INDEX ix_rich_block_order ON rich_block (owner_id, position);
-- [jooq ignore stop]

CREATE TABLE rich_block_change (
    owner_id uuid NOT NULL,
    version bigint NOT NULL,
    block_id varchar(64) NOT NULL,
    node TEXT,
    changed_at timestamptz DEFAULT (strftime('%Y-%m-%dT%H:%M:%S', 'now') || substr(strftime('%f', 'now'), 3) || '000Z') NOT NULL,
    changed_by uuid,
    CONSTRAINT rich_block_change_pkey PRIMARY KEY (owner_id, version, block_id)
-- [jooq ignore start]
    , FOREIGN KEY (owner_id) REFERENCES rich_body (owner_id) ON DELETE CASCADE
-- [jooq ignore stop]
);

CREATE TABLE document (
    document_id uuid NOT NULL,
    project_id uuid,
    folder_id uuid,
    title varchar(200) NOT NULL,
    body_text TEXT DEFAULT '' NOT NULL,
    version bigint DEFAULT 0 NOT NULL,
    created_at timestamptz DEFAULT (strftime('%Y-%m-%dT%H:%M:%S', 'now') || substr(strftime('%f', 'now'), 3) || '000Z') NOT NULL,
    created_by uuid,
    updated_at timestamptz DEFAULT (strftime('%Y-%m-%dT%H:%M:%S', 'now') || substr(strftime('%f', 'now'), 3) || '000Z') NOT NULL,
    updated_by uuid,
    deleted_at timestamptz,
    deleted_by uuid,
    kind varchar(16) DEFAULT 'PAGE' NOT NULL,
    icon varchar(64),
    color varchar(7),
    facet_id uuid,
    parent_id uuid,
    CONSTRAINT document_pkey PRIMARY KEY (document_id)
-- [jooq ignore start]
    , FOREIGN KEY (folder_id) REFERENCES document_folder (folder_id) ON DELETE SET NULL
    , FOREIGN KEY (project_id) REFERENCES project (project_id) ON DELETE CASCADE
    , FOREIGN KEY (parent_id) REFERENCES document (document_id)
    , CHECK (length(trim(title)) > 0)
-- [jooq ignore stop]
);

-- [jooq ignore start]
CREATE INDEX ix_document_created ON document (created_at, document_id);
CREATE INDEX ix_document_kind ON document (kind, updated_at);
CREATE INDEX ix_document_parent ON document(parent_id);
CREATE INDEX ix_document_space ON document (project_id, folder_id);
CREATE INDEX ix_document_updated ON document (updated_at, document_id);
-- [jooq ignore stop]

CREATE TABLE document_label_link (
    document_id uuid NOT NULL,
    label_id uuid NOT NULL,
    CONSTRAINT document_label_link_pkey PRIMARY KEY (document_id, label_id)
-- [jooq ignore start]
    , FOREIGN KEY (label_id) REFERENCES document_label (label_id)
    , FOREIGN KEY (document_id) REFERENCES document (document_id)
-- [jooq ignore stop]
);

CREATE TABLE issue (
    issue_id uuid NOT NULL,
    project_id uuid NOT NULL,
    number bigint NOT NULL,
    title varchar(200) NOT NULL,
    "type" varchar(16) NOT NULL,
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
    deleted_by uuid,
    started_at timestamptz,
    estimate_minutes INTEGER,
    story_points double precision,
    cycle_id uuid,
    CONSTRAINT issue_pkey PRIMARY KEY (issue_id)
-- [jooq ignore start]
    , FOREIGN KEY (type) REFERENCES work_item_type (code) ON DELETE RESTRICT
    , FOREIGN KEY (parent_id) REFERENCES issue (issue_id) ON DELETE SET NULL
    , FOREIGN KEY (column_id) REFERENCES issue_column (column_id) ON DELETE RESTRICT
    , FOREIGN KEY (project_id) REFERENCES project (project_id) ON DELETE CASCADE
    , CHECK (priority IN ('NONE', 'URGENT', 'HIGH', 'MEDIUM', 'LOW'))
    , CHECK (start_date IS NULL OR due_date IS NULL OR start_date <= due_date)
-- [jooq ignore stop]
);

-- [jooq ignore start]
CREATE INDEX ix_issue_assignee ON issue (assignee_id);
CREATE INDEX ix_issue_column_position ON issue (column_id, "position", issue_id);
CREATE INDEX ix_issue_cycle_id ON issue (cycle_id);
CREATE INDEX ix_issue_parent ON issue (parent_id);
CREATE INDEX ix_issue_type ON issue (type);
CREATE INDEX ix_issue_updated ON issue (updated_at, issue_id);
CREATE UNIQUE INDEX ux_issue_project_number ON issue (project_id, number);
-- [jooq ignore stop]

CREATE TABLE issue_label_link (
    issue_id uuid NOT NULL,
    label_id uuid NOT NULL,
    created_at timestamptz DEFAULT (strftime('%Y-%m-%dT%H:%M:%S', 'now') || substr(strftime('%f', 'now'), 3) || '000Z') NOT NULL,
    created_by uuid,
    CONSTRAINT issue_label_link_pkey PRIMARY KEY (issue_id, label_id)
-- [jooq ignore start]
    , FOREIGN KEY (label_id) REFERENCES issue_label (label_id) ON DELETE CASCADE
    , FOREIGN KEY (issue_id) REFERENCES issue (issue_id) ON DELETE CASCADE
-- [jooq ignore stop]
);

-- [jooq ignore start]
CREATE INDEX ix_issue_label_link_label ON issue_label_link (label_id, issue_id);
-- [jooq ignore stop]

CREATE TABLE issue_time_entry (
    entry_id uuid NOT NULL,
    issue_id uuid NOT NULL,
    member_id uuid NOT NULL,
    spent_on date NOT NULL,
    minutes INTEGER NOT NULL,
    note varchar(200),
    created_at timestamptz NOT NULL,
    created_by uuid,
    CONSTRAINT issue_time_entry_pkey PRIMARY KEY (entry_id)
-- [jooq ignore start]
    , FOREIGN KEY (issue_id) REFERENCES issue (issue_id) ON DELETE CASCADE
    , CHECK (minutes > 0 AND minutes <= 1440)
-- [jooq ignore stop]
);

-- [jooq ignore start]
CREATE INDEX ix_issue_time_entry_issue ON issue_time_entry (issue_id, spent_on);
CREATE INDEX ix_issue_time_entry_member ON issue_time_entry (member_id, spent_on);
-- [jooq ignore stop]

CREATE TABLE manual_chapter (
    chapter_id uuid NOT NULL,
    document_id uuid NOT NULL,
    parent_id uuid,
    "position" INTEGER NOT NULL,
    title varchar(200) NOT NULL,
    body_text TEXT DEFAULT '' NOT NULL,
    version bigint DEFAULT 0 NOT NULL,
    created_at timestamptz DEFAULT (strftime('%Y-%m-%dT%H:%M:%S', 'now') || substr(strftime('%f', 'now'), 3) || '000Z') NOT NULL,
    created_by uuid,
    updated_at timestamptz DEFAULT (strftime('%Y-%m-%dT%H:%M:%S', 'now') || substr(strftime('%f', 'now'), 3) || '000Z') NOT NULL,
    updated_by uuid,
    deleted_at timestamptz,
    deleted_by uuid,
    CONSTRAINT manual_chapter_pkey PRIMARY KEY (chapter_id)
-- [jooq ignore start]
    , FOREIGN KEY (parent_id) REFERENCES manual_chapter (chapter_id) ON DELETE CASCADE
    , FOREIGN KEY (document_id) REFERENCES document (document_id) ON DELETE CASCADE
    , CHECK (length(trim(title)) > 0)
-- [jooq ignore stop]
);

-- [jooq ignore start]
CREATE INDEX ix_manual_chapter_manual ON manual_chapter (document_id, parent_id, position);
-- [jooq ignore stop]

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
    , FOREIGN KEY (issue_id) REFERENCES issue (issue_id) ON DELETE CASCADE
    , FOREIGN KEY (integration_id) REFERENCES repository_integration (integration_id) ON DELETE CASCADE
    , CHECK (kind IN ('branch', 'pull_request', 'commit'))
    , CHECK (state IN ('open', 'draft', 'merged', 'closed'))
-- [jooq ignore stop]
);

-- [jooq ignore start]
CREATE INDEX ix_code_link_issue ON code_link (issue_id, updated_at);
CREATE UNIQUE INDEX ux_code_link_integration_kind_external_issue ON code_link (integration_id, kind, external_id, issue_id);
-- [jooq ignore stop]

-- 업무에는 유형이 하나 있어야 하므로 기본 유형을 둔다.
-- [jooq ignore start]
INSERT INTO work_item_type (code, name, icon, color, "position", is_default) VALUES
    ('TASK', '작업', 'checklist', '#95959f', 0, 1),
    ('BUG', '버그', 'bug', '#eb5757', 1, 0),
    ('FEATURE', '기능', 'idea', '#f2994a', 2, 0),
    ('EPIC', '에픽', 'epic', '#5e6ad2', 3, 0),
    ('STORY', '스토리', 'document', '#4cb782', 4, 0);
-- [jooq ignore stop]
