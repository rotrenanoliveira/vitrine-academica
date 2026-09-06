import { sql } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/node-postgres'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import { Pool } from 'pg'

let pool: Pool
let databaseForTest: ReturnType<typeof drizzle>

export async function setupDatabase() {
  const databaseUrl = process.env.DATABASE_URL

  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not set. Load it via .env.local before running e2e tests.')
  }

  pool = new Pool({ connectionString: databaseUrl })
  databaseForTest = drizzle({ client: pool })

  await migrate(databaseForTest, {
    migrationsFolder: './src/infra/database/drizzle/migrations',
  })

  return { databaseForTest }
}

export async function resetDatabase() {
  if (!databaseForTest) {
    throw new Error('Database has not been set up. Call setupDatabase() first.')
  }

  await databaseForTest.execute(sql`TRUNCATE TABLE "users", "attachments" CASCADE`)
}

export async function cleanupDatabase() {
  if (pool) {
    await pool.end()
  }
}

export { databaseForTest }
