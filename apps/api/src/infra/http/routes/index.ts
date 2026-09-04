import type { FastifyInstance } from 'fastify'
import { registerUserRoute } from './users/register-user'

/**
 * Routes prefix: /api/v1
 */
export async function routes(app: FastifyInstance) {
  /** Users routes */
  /** POST /users */
  await app.register(registerUserRoute)
}
