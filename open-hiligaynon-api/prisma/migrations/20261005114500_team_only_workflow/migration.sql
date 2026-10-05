-- Ilonggo Speak is a team-only workflow.
-- Remove community voting and anonymous contributor metadata.
DROP TABLE IF EXISTS "TranslationVote";
DROP TABLE IF EXISTS "Vote";

ALTER TABLE "Translation"
  DROP COLUMN IF EXISTS "upVotes",
  DROP COLUMN IF EXISTS "downVotes",
  DROP COLUMN IF EXISTS "contributorType";

ALTER TABLE "SourceRecord"
  ALTER COLUMN "sourceType" SET DEFAULT 'team';

UPDATE "SourceRecord"
SET "sourceType" = 'team'
WHERE "sourceType" = 'community';
