-- Which main screens a member opened. Opening the same screen again within 30 minutes of the last time adds to the
-- same row (visits, last_at), so a member going back and forth is one line; a later visit starts a new one.
CREATE TABLE screen_visit (
    screen_visit_id integer,
    employee_id uuid NOT NULL,
    screen varchar(100) NOT NULL,
    ip varchar(45) NOT NULL,
    user_agent varchar(300),
    first_at timestamptz NOT NULL,
    last_at timestamptz NOT NULL,
    visits integer NOT NULL,
    CONSTRAINT screen_visit_pkey PRIMARY KEY (screen_visit_id)
);

CREATE INDEX screen_visit_employee_screen_last_idx ON screen_visit (employee_id, screen, last_at);
CREATE INDEX screen_visit_last_at_idx ON screen_visit (last_at);
