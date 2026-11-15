import type { FastifyInstance } from 'fastify'

let app: FastifyInstance

export function __setAppForTest(instance: FastifyInstance) {
  app = instance
}

export { app as appForTest }
