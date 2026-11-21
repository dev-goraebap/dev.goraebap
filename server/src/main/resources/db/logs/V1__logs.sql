-- The log database (logs.db), a SQLite file apart from the business one so its writes never wait on the business
-- write lock and its rows are not replicated with the business data. Rows older than 30 days are dropped each
-- night. Moments are UTC text of one width (InstantTextBinding), as in the business database.
-- An integer primary key is SQLite's own row number, so a row inserted without one gets the next.

-- What a member did: every request that changes something, sign-ins, and the few reads marked as worth keeping.
-- route is the mapping (PUT /api/v1/meetings/{id}/tag) and target its path values, so neither bodies nor query
-- strings, where personal data travels, are kept.
CREATE TABLE activity (
    activity_id integer,
    at timestamptz NOT NULL,
    employee_id uuid,
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

CREATE INDEX activity_at_idx ON activity (at);
CREATE INDEX activity_employee_at_idx ON activity (employee_id, at);

-- Every request to the API counted by hour, mapping and status class (2 to 5), for the traffic and response time
-- charts; slow counts those that took a second or more.
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

-- A server error or warning as the server logged it, with the request it happened in (method, path without the
-- query, member, address) when it happened in one. The same one (fingerprint: logger, exception and message
-- without numbers) within a minute is one row whose occurrences grows, so a burst stays one line.
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
    employee_id uuid,
    ip varchar(45),
    CONSTRAINT server_error_pkey PRIMARY KEY (server_error_id),
    CONSTRAINT server_error_fingerprint_minute_key UNIQUE (fingerprint, minute)
);

CREATE INDEX server_error_last_at_idx ON server_error (last_at);

-- Each weekly copy of this database sent to object storage, or why it could not be.
CREATE TABLE log_backup (
    log_backup_id integer,
    at timestamptz NOT NULL,
    object_key varchar(300),
    bytes integer,
    error varchar(500),
    CONSTRAINT log_backup_pkey PRIMARY KEY (log_backup_id)
);
