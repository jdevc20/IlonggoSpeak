import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { execFile } from "child_process";
import { readFile } from "fs/promises";
import { promisify } from "util";
import { fileURLToPath } from "url";
import pg from "pg";

const execFileAsync = promisify(execFile);
const projectRoot = fileURLToPath(new URL("../../", import.meta.url));
const connectionString = process.env.DATABASE_URL;
const databaseSchema = process.env.DB_SCHEMA?.trim() || "ilonggo_speak";

if (!connectionString) {
  throw new Error("DATABASE_URL is not configured");
}

if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(databaseSchema)) {
  throw new Error("DB_SCHEMA contains invalid characters");
}

const schemaUrl = new URL(connectionString);
if (databaseSchema !== "public") {
  schemaUrl.searchParams.set("schema", databaseSchema);
  schemaUrl.searchParams.set("options", `-c search_path=${databaseSchema}`);
}

const schemaConnectionString = schemaUrl.toString();
process.env.DATABASE_URL = schemaConnectionString;

export const pool = new pg.Pool({
  connectionString: schemaConnectionString,
});

const adapter = new PrismaPg(
  { connectionString: schemaConnectionString },
  { schema: databaseSchema }
);

export const prisma = new PrismaClient({
  adapter,
});

const LINGUISTIC_MIGRATION =
  "20261001073000_force_repair_linguistic_schema";

const REPAIRED_MIGRATIONS = [
  "20261001063000_repair_production_schema",
  "20261001070000_refactor_linguistic_engine",
  LINGUISTIC_MIGRATION,
] as const;

const RETRYABLE_FAILED_MIGRATIONS = [
  "20261005133000_add_maintenance_options",
] as const;

async function ensureDatabaseNamespace() {
  if (databaseSchema === "public") return;

  const adminPool = new pg.Pool({ connectionString });
  try {
    await adminPool.query(`CREATE SCHEMA IF NOT EXISTS "${databaseSchema}"`);
  } finally {
    await adminPool.end();
  }
}

async function hasAnyIlonggoTables() {
  const result = await pool.query<{ count: string }>(`
    SELECT COUNT(*)::text AS count
    FROM information_schema.tables
    WHERE table_schema = current_schema()
      AND table_name IN ('Sentence', 'Translation', 'TextUnit', 'Language');
  `);

  return Number(result.rows[0]?.count ?? 0) > 0;
}

async function hasTeamOnlySchema() {
  const result = await pool.query<{
    translation: string | null;
    has_up_votes: boolean;
    has_down_votes: boolean;
  }>(`
    SELECT
      to_regclass('"Translation"')::text AS translation,
      EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = current_schema()
          AND table_name = 'Translation'
          AND column_name = 'upVotes'
      ) AS has_up_votes,
      EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = current_schema()
          AND table_name = 'Translation'
          AND column_name = 'downVotes'
      ) AS has_down_votes;
  `);

  const row = result.rows[0];
  return Boolean(row?.translation && !row.has_up_votes && !row.has_down_votes);
}

async function ensureLegacySchema() {
  await pool.query(`
    ALTER TABLE "Sentence"
      ADD COLUMN IF NOT EXISTS "sentiment" INTEGER NOT NULL DEFAULT 1,
      ADD COLUMN IF NOT EXISTS "intent" TEXT,
      ADD COLUMN IF NOT EXISTS "isSarcastic" BOOLEAN NOT NULL DEFAULT false;
  `);

  await pool.query(`
    ALTER TABLE "Token"
      ADD COLUMN IF NOT EXISTS "isSlang" BOOLEAN NOT NULL DEFAULT false,
      ADD COLUMN IF NOT EXISTS "contextNote" TEXT;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS "Idiom" (
      "id" TEXT NOT NULL,
      "phrase" TEXT NOT NULL,
      "meaning" TEXT NOT NULL,
      "type" TEXT NOT NULL DEFAULT 'colloquial',
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "Idiom_pkey" PRIMARY KEY ("id")
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS "Vote" (
      "id" TEXT NOT NULL,
      "sentenceId" TEXT NOT NULL,
      "userId" TEXT,
      "ipAddress" TEXT NOT NULL,
      "type" TEXT NOT NULL,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "Vote_pkey" PRIMARY KEY ("id")
    );
  `);

  await pool.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS "Idiom_phrase_key" ON "Idiom"("phrase");
    CREATE INDEX IF NOT EXISTS "Idiom_phrase_idx" ON "Idiom"("phrase");
    CREATE INDEX IF NOT EXISTS "Vote_sentenceId_idx" ON "Vote"("sentenceId");
    CREATE UNIQUE INDEX IF NOT EXISTS "Vote_sentenceId_ipAddress_key" ON "Vote"("sentenceId", "ipAddress");
    CREATE INDEX IF NOT EXISTS "Sentence_normalizedEnglish_idx" ON "Sentence"("normalizedEnglish");
    CREATE INDEX IF NOT EXISTS "Sentence_normalizedHiligaynon_idx" ON "Sentence"("normalizedHiligaynon");
    CREATE INDEX IF NOT EXISTS "Sentence_sentiment_idx" ON "Sentence"("sentiment");
    CREATE INDEX IF NOT EXISTS "Sentence_createdAt_idx" ON "Sentence"("createdAt" DESC);
    CREATE INDEX IF NOT EXISTS "Token_sentenceId_idx" ON "Token"("sentenceId");
  `);

  await pool.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'Vote_sentenceId_fkey'
      ) THEN
        ALTER TABLE "Vote"
          ADD CONSTRAINT "Vote_sentenceId_fkey"
          FOREIGN KEY ("sentenceId") REFERENCES "Sentence"("id")
          ON DELETE CASCADE ON UPDATE CASCADE;
      END IF;
    END $$;
  `);
}

async function forceLinguisticSchema() {
  const migrationUrl = new URL(
    `../../prisma/migrations/${LINGUISTIC_MIGRATION}/migration.sql`,
    import.meta.url
  );

  const migrationSql = await readFile(migrationUrl, "utf8");

  console.log(
    `🛠️ Force-applying idempotent schema repair: ${LINGUISTIC_MIGRATION}`
  );

  await pool.query(migrationSql);
}

async function enforceTeamOnlySchema() {
  console.log("🔒 Enforcing Ilonggo Speak team-only schema cleanup");

  await pool.query(`
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
  `);
}

async function runPrismaCli(args: string[]) {
  const executable = process.platform === "win32" ? "npx.cmd" : "npx";

  return execFileAsync(executable, ["prisma", ...args], {
    cwd: projectRoot,
    env: process.env,
  });
}

async function getMigrationState(migration: string) {
  const result = await pool.query<{
    finished_at: Date | null;
    rolled_back_at: Date | null;
  }>(
    `
      SELECT finished_at, rolled_back_at
      FROM "_prisma_migrations"
      WHERE migration_name = $1
      ORDER BY started_at DESC
      LIMIT 1
    `,
    [migration]
  );

  return result.rows[0] ?? null;
}

async function reconcileMigrationHistory() {
  for (const migration of RETRYABLE_FAILED_MIGRATIONS) {
    const state = await getMigrationState(migration);

    if (state && !state.finished_at && !state.rolled_back_at) {
      console.warn(`↩️ Marking failed migration as rolled back: ${migration}`);
      const { stdout, stderr } = await runPrismaCli([
        "migrate",
        "resolve",
        "--rolled-back",
        migration,
      ]);
      if (stdout.trim()) console.log(stdout.trim());
      if (stderr.trim()) console.warn(stderr.trim());
    }
  }

  for (const migration of REPAIRED_MIGRATIONS) {
    const state = await getMigrationState(migration);

    if (state?.finished_at && !state.rolled_back_at) {
      continue;
    }

    try {
      const { stdout, stderr } = await runPrismaCli([
        "migrate",
        "resolve",
        "--applied",
        migration,
      ]);

      if (stdout.trim()) console.log(stdout.trim());
      if (stderr.trim()) console.warn(stderr.trim());
    } catch (error: any) {
      const output = [
        error?.stdout,
        error?.stderr,
        error?.message,
      ]
        .filter(Boolean)
        .join("\n");

      if (!/already applied|already recorded/i.test(output)) {
        console.warn(
          `⚠️ Could not mark migration ${migration} as applied. Continuing because the schema repair itself succeeded.`
        );
        if (output) console.warn(output);
      }
    }
  }

  try {
    const { stdout, stderr } = await runPrismaCli(["migrate", "deploy"]);
    if (stdout.trim()) console.log(stdout.trim());
    if (stderr.trim()) console.warn(stderr.trim());
  } catch (error: any) {
    const output = [
      error?.stdout,
      error?.stderr,
      error?.message,
    ]
      .filter(Boolean)
      .join("\n");

    throw new Error(
      `Prisma migration reconciliation failed after schema repair.\n${output}`
    );
  }
}

/**
 * Production-safe forced migration:
 * 1. repairs the legacy schema needed for backfill,
 * 2. force-runs the idempotent linguistic migration SQL,
 * 3. reconciles Prisma migration history,
 * 4. deploys any remaining/future migrations.
 *
 * The HTTP server is not started unless all required schema work succeeds.
 */
export async function ensureDatabaseSchema() {
  await ensureDatabaseNamespace();

  const hasExistingIlonggoSchema = await hasAnyIlonggoTables();

  if (!hasExistingIlonggoSchema) {
    console.log(`🆕 Fresh Ilonggo Speak schema detected: ${databaseSchema}`);
    await runPrismaCli(["migrate", "deploy"]);
  } else {
    const teamOnlySchemaExists = await hasTeamOnlySchema();

    if (teamOnlySchemaExists) {
      console.log("✅ Team-only corpus schema detected; skipping legacy vote-era backfill.");
    } else {
      await ensureLegacySchema();
      await forceLinguisticSchema();
    }

    await enforceTeamOnlySchema();
    await reconcileMigrationHistory();
  }

  const verification = await pool.query<{
    translation: string | null;
    text_unit: string | null;
    language: string | null;
  }>(`
    SELECT
      to_regclass('"Translation"')::text AS translation,
      to_regclass('"TextUnit"')::text AS text_unit,
      to_regclass('"Language"')::text AS language;
  `);

  const row = verification.rows[0];

  if (!row?.translation || !row?.text_unit || !row?.language) {
    throw new Error(
      "Forced migration completed without all required linguistic tables."
    );
  }
}
