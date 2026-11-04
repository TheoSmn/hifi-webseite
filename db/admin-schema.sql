-- Admin-Bereich: Accounts, Sitzungen und Lagerliste (Cloudflare D1, Binding "DB")
-- Einmalig ausführen:
--   npx wrangler d1 execute hifi-chat --remote --file=db/admin-schema.sql

CREATE TABLE IF NOT EXISTS admin_users (
  username TEXT PRIMARY KEY,
  salt     TEXT NOT NULL,
  hash     TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS admin_sessions (
  token_hash TEXT PRIMARY KEY,
  username   TEXT NOT NULL,
  expires    INTEGER NOT NULL
);

-- Brutto (= Netto * 1,2) und "Aktuell im Lager" (= Eingekauft - Verkauft)
-- werden automatisch berechnet und deshalb nicht gespeichert.
CREATE TABLE IF NOT EXISTS lager (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  artikelnummer TEXT    NOT NULL,
  name          TEXT    NOT NULL,
  ek_netto      REAL    NOT NULL DEFAULT 0,
  vk_netto      REAL    NOT NULL DEFAULT 0,
  eingekauft    INTEGER NOT NULL DEFAULT 0,
  verkauft      INTEGER NOT NULL DEFAULT 0,
  updated_at    INTEGER,
  updated_by    TEXT
);
