CREATE TABLE IF NOT EXISTS branches (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  branch_name   TEXT    NOT NULL,
  city          TEXT    NOT NULL,
  state         TEXT    NOT NULL,
  opened_date   TEXT    NOT NULL
);

CREATE TABLE IF NOT EXISTS customers (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  first_name    TEXT    NOT NULL,
  last_name     TEXT    NOT NULL,
  email         TEXT    NOT NULL UNIQUE,
  segment       TEXT    NOT NULL CHECK(segment IN ('retail','SME','corporate')),
  branch_id     INTEGER NOT NULL REFERENCES branches(id),
  created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS onboarding_applications (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id      INTEGER NOT NULL REFERENCES customers(id),
  application_type TEXT    NOT NULL CHECK(application_type IN ('savings','checking','loan','credit_card')),
  status           TEXT    NOT NULL CHECK(status IN ('pending','approved','rejected','withdrawn')),
  submitted_at     TEXT    NOT NULL,
  decided_at       TEXT
);

CREATE TABLE IF NOT EXISTS transactions (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id      INTEGER NOT NULL REFERENCES customers(id),
  type             TEXT    NOT NULL CHECK(type IN ('deposit','withdrawal','transfer','payment')),
  amount           REAL    NOT NULL CHECK(amount > 0),
  description      TEXT,
  transaction_date TEXT    NOT NULL
);
