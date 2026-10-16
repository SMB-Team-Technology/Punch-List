-- Review rooms an agent opens for a preview build (POST /api/:id/preview, marklayer_share_preview).
-- `version` and `prev_id` chain a branch's previews: a room created with the same repo + branch as
-- a room the caller already holds becomes that room's next version. All NULL on ordinary rooms.
ALTER TABLE annotations ADD COLUMN title TEXT;
ALTER TABLE annotations ADD COLUMN note TEXT;
ALTER TABLE annotations ADD COLUMN repo TEXT;
ALTER TABLE annotations ADD COLUMN branch TEXT;
ALTER TABLE annotations ADD COLUMN sha TEXT;
ALTER TABLE annotations ADD COLUMN version INTEGER;
ALTER TABLE annotations ADD COLUMN prev_id TEXT;

-- The viewer's "next version" lookup is by prev_id.
CREATE INDEX IF NOT EXISTS idx_annotations_prev_id ON annotations (prev_id);
