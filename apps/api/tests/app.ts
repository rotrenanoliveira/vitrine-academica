import type { FastifyInstance } from 'fastify'
import { afterAll, beforeAll, beforeEach } from 'vitest'
import { cleanupDatabase, resetDatabase, setupDatabase } from './setup-e2e'

let app: FastifyInstance

beforeAll(async () => {
  await setupDatabase()

  const server = await import('@/infra/http/app.js')
  await server.app.ready()
  app = server.app
})

beforeEach(async () => {
  await resetDatabase()
})

afterAll(async () => {
  await cleanupDatabase()
})

export { app as appForTest }
