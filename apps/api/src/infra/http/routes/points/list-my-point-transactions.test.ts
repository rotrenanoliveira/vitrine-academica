import { appForTest as app } from '@tests/app'
import { makeAccessCodeOnDatabase } from '@tests/factories/make-access-code'
import { makeAccountOnDatabase } from '@tests/factories/make-account'
import { makePointTransactionOnDatabase } from '@tests/factories/make-point-transaction'
import { makeUserOnDatabase } from '@tests/factories/make-user'
import request from 'supertest'
import { PointTransactionReason, PointTransactionType } from '@/domain/points/enterprise/entities/point-transaction'

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

describe('(E2E) - GET /api/v1/points/me/transactions', () => {
  afterAll(async () => await app.close())

  it('should return an empty list for a user without transactions', async () => {
    const { accessToken } = await authenticateUser()

    const response = await request(app.server)
      .get('/api/v1/points/me/transactions')
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.status).toBe(200)
    expect(response.body).toEqual({ transactions: [] })
  })

  it('should list the transactions from the newest to the oldest', async () => {
    const { accessToken, user } = await authenticateUser()

    const { pointTransaction: oldest } = await makePointTransactionOnDatabase({
      userId: user.id,
      type: PointTransactionType.CREDIT,
      amount: 5,
      createdAt: new Date('2026-01-01T10:00:00Z'),
    })
    const { pointTransaction: newest } = await makePointTransactionOnDatabase({
      userId: user.id,
      type: PointTransactionType.DEBIT,
      amount: 3,
      reason: PointTransactionReason.PROMOTION,
      createdAt: new Date('2026-01-02T10:00:00Z'),
    })

    const response = await request(app.server)
      .get('/api/v1/points/me/transactions')
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.status).toBe(200)
    expect(response.body.transactions).toEqual([
      {
        id: newest.id.toString(),
        type: 'DEBIT',
        amount: 3,
        reason: 'PROMOTION',
        referenceId: newest.referenceId.toString(),
        createdAt: '2026-01-02T10:00:00.000Z',
      },
      {
        id: oldest.id.toString(),
        type: 'CREDIT',
        amount: 5,
        reason: 'STAR_RECEIVED',
        referenceId: oldest.referenceId.toString(),
        createdAt: '2026-01-01T10:00:00.000Z',
      },
    ])
  })

  it('should respect the limit parameter', async () => {
    const { accessToken, user } = await authenticateUser()

    await makePointTransactionOnDatabase({ userId: user.id, createdAt: new Date('2026-01-01T10:00:00Z') })
    await makePointTransactionOnDatabase({ userId: user.id, createdAt: new Date('2026-01-02T10:00:00Z') })
    await makePointTransactionOnDatabase({ userId: user.id, createdAt: new Date('2026-01-03T10:00:00Z') })

    const response = await request(app.server)
      .get('/api/v1/points/me/transactions?limit=2')
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.status).toBe(200)
    expect(response.body.transactions).toHaveLength(2)
  })

  it('should not list transactions from other users', async () => {
    const { accessToken } = await authenticateUser()
    const { user: otherUser } = await makeUserOnDatabase()

    await makePointTransactionOnDatabase({ userId: otherUser.id })

    const response = await request(app.server)
      .get('/api/v1/points/me/transactions')
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.status).toBe(200)
    expect(response.body.transactions).toEqual([])
  })

  it('should not accept an invalid limit', async () => {
    const { accessToken } = await authenticateUser()

    const response = await request(app.server)
      .get('/api/v1/points/me/transactions?limit=0')
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.status).toBe(400)
  })

  it('should not be able to list transactions without authentication', async () => {
    const response = await request(app.server).get('/api/v1/points/me/transactions')

    expect(response.status).toBe(401)
    expect(response.body).toEqual({ message: expect.any(String) })
  })
})
