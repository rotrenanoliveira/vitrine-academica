import { appForTest as app } from '@tests/app'
import { makeAccessCodeOnDatabase } from '@tests/factories/make-access-code'
import { makeAccountOnDatabase } from '@tests/factories/make-account'
import { makePointTransactionOnDatabase } from '@tests/factories/make-point-transaction'
import { makeProjectOnDatabase } from '@tests/factories/make-project'
import { makeUserOnDatabase } from '@tests/factories/make-user'
import request from 'supertest'
import { PointTransactionReason, PointTransactionType } from '@/domain/points/enterprise/entities/point-transaction'
import { ProjectStatus } from '@/domain/project/enterprise/entities/project'

async function authenticateUser() {
  const { user } = await makeUserOnDatabase()
  const { account } = await makeAccountOnDatabase({ userId: user.id })
  const { plainCode } = await makeAccessCodeOnDatabase({ accountId: account.id })

  const loginResponse = await request(app.server).post('/api/v1/auth/sessions').send({
    email: user.email,
    code: plainCode,
  })

  return {
    accessToken: loginResponse.body.accessToken as string,
    user,
  }
}

describe('(E2E) - GET /api/v1/points/me', () => {
  afterAll(async () => await app.close())

  it('should return zero for a user without transactions', async () => {
    const { accessToken } = await authenticateUser()

    const response = await request(app.server).get('/api/v1/points/me').set('Authorization', `Bearer ${accessToken}`)

    expect(response.status).toBe(200)
    expect(response.body).toEqual({ balance: 0 })
  })

  it('should return the sum of credits minus debits', async () => {
    const { accessToken, user } = await authenticateUser()

    await makePointTransactionOnDatabase({
      userId: user.id,
      type: PointTransactionType.CREDIT,
      amount: 12,
      reason: PointTransactionReason.STAR_RECEIVED,
    })
    await makePointTransactionOnDatabase({
      userId: user.id,
      type: PointTransactionType.DEBIT,
      amount: 10,
      reason: PointTransactionReason.PROMOTION,
    })

    const response = await request(app.server).get('/api/v1/points/me').set('Authorization', `Bearer ${accessToken}`)

    expect(response.status).toBe(200)
    expect(response.body).toEqual({ balance: 2 })
  })

  it('should show the points received when someone stars the project of the user', async () => {
    const { accessToken: authorToken, user: author } = await authenticateUser()
    const { accessToken: starrerToken } = await authenticateUser()
    const { project } = await makeProjectOnDatabase({
      author: author.id,
      status: ProjectStatus.PUBLISHED,
    })

    await request(app.server)
      .post(`/api/v1/projects/${project.id.toString()}/stars`)
      .set('Authorization', `Bearer ${starrerToken}`)

    const response = await request(app.server).get('/api/v1/points/me').set('Authorization', `Bearer ${authorToken}`)

    expect(response.status).toBe(200)
    expect(response.body).toEqual({ balance: 1 })
  })

  it('should not be able to get the balance without authentication', async () => {
    const response = await request(app.server).get('/api/v1/points/me')

    expect(response.status).toBe(401)
    expect(response.body).toEqual({ message: expect.any(String) })
  })
})
