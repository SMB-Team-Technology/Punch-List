-- A folder belongs to one owner and is only a label on their links: deleting
-- one unfiles its links, never deletes them. folder_id is a plain nullable
-- column, not a foreign key, so every write checks owner_id on both sides.
CREATE TABLE IF NOT EXISTS folders (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS folders_owner_idx ON folders(owner_id);
ALTER TABLE annotations ADD COLUMN folder_id TEXT DEFAULT NULL;
ALTER TABLE projects ADD COLUMN folder_id TEXT DEFAULT NULL;
CREATE INDEX IF NOT EXISTS annotations_folder_idx ON annotations(folder_id);
