-- The two-way Slack app (src/integrations/slack-*.ts), one install per room.
-- Its own table rather than an entry in `annotations.integrations`: that column
-- is readable by anyone with the share link, and a bot token can read the
-- channel, not just post to it. `bot_token` is AES-GCM ciphertext under the
-- SLACK_TOKEN_KEY secret, bound to `room_id`, so a D1 export alone yields nothing.
CREATE TABLE IF NOT EXISTS slack_installs (
  room_id TEXT PRIMARY KEY,
  team_id TEXT NOT NULL,
  team_name TEXT,
  channel_id TEXT NOT NULL,
  channel_name TEXT,
  bot_user_id TEXT NOT NULL,
  bot_token TEXT NOT NULL,
  installed_by TEXT,
  created_at INTEGER DEFAULT (unixepoch())
);
-- `app_uninstalled` / `tokens_revoked` arrive per workspace.
CREATE INDEX IF NOT EXISTS slack_installs_team_idx ON slack_installs(team_id);

-- Which Slack thread carries which annotation, written when the parent posts.
-- Read both ways: outbound by (room, annotation) to reply in-thread, inbound by
-- (team, channel, thread_ts) to find the annotation a Slack reply belongs to.
CREATE TABLE IF NOT EXISTS slack_threads (
  room_id TEXT NOT NULL,
  annotation_id TEXT NOT NULL,
  team_id TEXT NOT NULL,
  channel_id TEXT NOT NULL,
  thread_ts TEXT NOT NULL,
  created_at INTEGER DEFAULT (unixepoch()),
  PRIMARY KEY (room_id, annotation_id)
);
CREATE UNIQUE INDEX IF NOT EXISTS slack_threads_thread_idx ON slack_threads(team_id, channel_id, thread_ts);
