import path from 'node:path'
import { sql } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/node-postgres'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import { Pool } from 'pg'

const migrationsFolder = path.resolve(process.cwd(), 'src/infra/database/drizzle/migrations')
const DRIZZLE_MIGRATIONS_TABLE = '__drizzle_migrations'

let pool: Pool
let databaseForTest: ReturnType<typeof drizzle>
let schemaName: string
let setupDone = false

export function getWorkerSchemaName() {
  const poolId = process.env.VITEST_POOL_ID ?? '0'
  return `vitest_${poolId}`
}

function applySearchPath(databaseUrl: string, schema: string) {
  const url = new URL(databaseUrl)
  url.searchParams.set('options', `-csearch_path=${schema}`)
  return url.toString()
}

export async function setupDatabase() {
  if (setupDone) {
    return { databaseForTest }
  }

  const databaseUrl = process.env.DATABASE_URL

  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not set. Load it via .env.local before running e2e tests.')
  }

  schemaName = getWorkerSchemaName()

  const adminPool = new Pool({ connectionString: databaseUrl })
  try {
    await adminPool.query(`CREATE SCHEMA IF NOT EXISTS "${schemaName}"`)
  } finally {
    await adminPool.end()
  }

  const workerUrl = applySearchPath(databaseUrl, schemaName)
  process.env.DATABASE_URL = workerUrl

  pool = new Pool({ connectionString: workerUrl })
  databaseForTest = drizzle({ client: pool })

  // Journal must be per worker schema — the default `drizzle` schema is shared and
  // would skip applying tables into an empty vitest_* schema.
  await migrate(databaseForTest, {
    migrationsFolder,
    migrationsSchema: schemaName,
    migrationsTable: DRIZZLE_MIGRATIONS_TABLE,
  })
  setupDone = true

  return { databaseForTest }
}

export async function resetDatabase() {
  if (!databaseForTest || !pool) {
    throw new Error('Database has not been set up. Call setupDatabase() first.')
  }

  const result = await pool.query<{ tablename: string }>(
    `SELECT tablename
     FROM pg_tables
     WHERE schemaname = $1
       AND tablename <> $2
     ORDER BY tablename`,
    [schemaName, DRIZZLE_MIGRATIONS_TABLE],
  )

  if (result.rows.length === 0) {
    return
  }

  const tableList = result.rows.map((row) => `"${schemaName}"."${row.tablename}"`).join(', ')

  await databaseForTest.execute(sql.raw(`TRUNCATE TABLE ${tableList} CASCADE`))
}

export async function cleanupDatabase() {
  if (pool) {
    await pool.end()
  }

  setupDone = false
}

export { databaseForTest }
