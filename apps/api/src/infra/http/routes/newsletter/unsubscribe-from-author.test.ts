import { appForTest as app } from '@tests/app'
import { makeAccessCodeOnDatabase } from '@tests/factories/make-access-code'
import { makeAccountOnDatabase } from '@tests/factories/make-account'
import { makeAuthorSubscriptionOnDatabase } from '@tests/factories/make-author-subscription'
import { makeUserOnDatabase } from '@tests/factories/make-user'
import request from 'supertest'
import { SubscriptionStatus } from '@/domain/newsletter/enterprise/entities/author-subscription'
import { db } from '@/infra/database/drizzle/client'
import { DrizzleAuthorSubscriptionsRepository } from '@/infra/database/repositories/drizzle-author-subscriptions-repository'

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

function unsubscribe(subscriptionId: string, accessToken?: string) {
  const req = request(app.server).post(`/api/v1/subscriptions/${subscriptionId}/unsubscribe`)

  return accessToken ? req.set('Authorization', `Bearer ${accessToken}`) : req
}

async function findSubscription(id: string) {
  return new DrizzleAuthorSubscriptionsRepository(db).findById(id)
}

describe('(E2E) - POST /api/v1/subscriptions/:subscriptionId/unsubscribe', () => {
  afterAll(async () => await app.close())

  it('cancelar assinatura: pela dona, deve retornar 200 e gravar como cancelada', async () => {
    const { accessToken, user } = await authenticateUser()
    const { user: author } = await makeUserOnDatabase()
    const { subscription } = await makeAuthorSubscriptionOnDatabase({ subscriberId: user.id, authorId: author.id })

    const response = await unsubscribe(subscription.id.toString(), accessToken)

    expect(response.status).toBe(200)
    expect(response.body.subscription).toEqual({
      id: subscription.id.toString(),
      authorId: author.id.toString(),
      status: 'UNSUBSCRIBED',
      subscribedAt: expect.any(String),
      unsubscribedAt: expect.any(String),
    })

    const saved = await findSubscription(subscription.id.toString())

    expect(saved?.status).toBe(SubscriptionStatus.UNSUBSCRIBED)
    expect(saved?.unsubscribedAt).toBeInstanceOf(Date)
  })

  it('cancelar assinatura: sem token, deve retornar 401 e manter a assinatura ativa', async () => {
    const { user } = await makeUserOnDatabase()
    const { user: author } = await makeUserOnDatabase()
    const { subscription } = await makeAuthorSubscriptionOnDatabase({ subscriberId: user.id, authorId: author.id })

    const response = await unsubscribe(subscription.id.toString())

    expect(response.status).toBe(401)
    expect(response.body.message).toBe('Não autenticado.')

    const saved = await findSubscription(subscription.id.toString())

    expect(saved?.status).toBe(SubscriptionStatus.ACTIVE)
  })

  it('cancelar assinatura: de outra pessoa, deve retornar 403 e manter a assinatura ativa', async () => {
    const { accessToken } = await authenticateUser()
    const { user: stranger } = await makeUserOnDatabase()
    const { user: author } = await makeUserOnDatabase()
    const { subscription } = await makeAuthorSubscriptionOnDatabase({
      subscriberId: stranger.id,
      authorId: author.id,
    })

    const response = await unsubscribe(subscription.id.toString(), accessToken)

    expect(response.status).toBe(403)
    expect(response.body.message).toBe('Esta assinatura não é sua')

    const saved = await findSubscription(subscription.id.toString())

    expect(saved?.status).toBe(SubscriptionStatus.ACTIVE)
  })

  it('cancelar assinatura: inexistente, deve retornar 404 com mensagem', async () => {
    const { accessToken } = await authenticateUser()

    const response = await unsubscribe('assinatura-inexistente', accessToken)

    expect(response.status).toBe(404)
    expect(response.body.message).toBe('Assinatura não encontrada')
  })

  it('cancelar assinatura: já cancelada, deve retornar 200 e manter a data original', async () => {
    const { accessToken, user } = await authenticateUser()
    const { user: author } = await makeUserOnDatabase()
    const { subscription } = await makeAuthorSubscriptionOnDatabase({
      subscriberId: user.id,
      authorId: author.id,
      status: SubscriptionStatus.UNSUBSCRIBED,
      unsubscribedAt: new Date('2026-02-01T10:00:00.000Z'),
    })

    const response = await unsubscribe(subscription.id.toString(), accessToken)

    expect(response.status).toBe(200)
    expect(response.body.subscription.unsubscribedAt).toBe('2026-02-01T10:00:00.000Z')
  })
})
