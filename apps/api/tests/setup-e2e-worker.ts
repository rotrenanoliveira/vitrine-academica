import { afterAll, beforeEach } from 'vitest'
import { resetTestStorage } from '@/infra/storage/test-storage'
import { __setAppForTest } from './app'
import { cleanupDatabase, resetDatabase, setupDatabase } from './setup-e2e'

// Top-level: rewrite DATABASE_URL and boot the app before any test file imports env/db.
await setupDatabase()

const server = await import('@/infra/http/app.js')
await server.app.ready()

__setAppForTest(server.app)

beforeEach(async () => {
  await resetDatabase()
  resetTestStorage()
})

afterAll(async () => {
  await server.app.close()
  await cleanupDatabase()
})
