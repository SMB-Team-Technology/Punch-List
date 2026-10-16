-- Opt-in password per link, the column 0005 deferred. NULL is the default and
-- means today's open link. The value is a self-describing PBKDF2 record
-- (`pbkdf2-sha256$<iterations>$<salt>$<key>`, see src/lock/password.ts), never
-- the password. `password_gen` bumps on every set, change and removal: unlock
-- cookies embed it, so a change invalidates every cookie issued before it.
ALTER TABLE annotations ADD COLUMN password_hash TEXT DEFAULT NULL;
ALTER TABLE annotations ADD COLUMN password_gen INTEGER NOT NULL DEFAULT 0;

-- Wrong guesses per (room, client) in a fixed window. A table rather than a
-- RateLimit binding because the gate must ask "over the limit?" without
-- spending an attempt: an agent sends the right password on every MCP call and
-- must never be throttled for it. `client` is a SHA-256 of the IP, not the IP.
CREATE TABLE IF NOT EXISTS unlock_failures (
  room_id TEXT NOT NULL,
  client TEXT NOT NULL,
  window_start INTEGER NOT NULL,
  failures INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (room_id, client)
);
CREATE INDEX IF NOT EXISTS unlock_failures_window_idx ON unlock_failures(window_start);
