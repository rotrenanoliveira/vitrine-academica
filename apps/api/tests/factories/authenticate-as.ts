import { makeAccessCodeOnDatabase } from '@tests/factories/make-access-code'
import { makeAccountOnDatabase } from '@tests/factories/make-account'
import { makeUserOnDatabase } from '@tests/factories/make-user'
import type { FastifyInstance } from 'fastify'
import request from 'supertest'
import type { UserRole } from '@/domain/identity/enterprise/entities/user'

export async function authenticateAs(app: FastifyInstance, role: UserRole) {
  const { user } = await makeUserOnDatabase({ role })
  const { account } = await makeAccountOnDatabase({ userId: user.id })
  const { plainCode } = await makeAccessCodeOnDatabase({ accountId: account.id })

  const response = await request(app.server).post('/api/v1/auth/sessions').send({
    email: user.email,
    code: plainCode,
  })

  return {
    accessToken: response.body.accessToken as string,
    user,
  }
}
