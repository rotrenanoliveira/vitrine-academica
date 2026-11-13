import { appForTest as app } from '@tests/app'
import { makeAuthorSubscriptionOnDatabase } from '@tests/factories/make-author-subscription'
import { makeUserOnDatabase } from '@tests/factories/make-user'
import request from 'supertest'
import { SubscriptionStatus } from '@/domain/newsletter/enterprise/entities/author-subscription'
import { db } from '@/infra/database/drizzle/client'
import { DrizzleAuthorSubscriptionsRepository } from '@/infra/database/repositories/drizzle-author-subscriptions-repository'

function unsubscribeByToken(body: Record<string, unknown>) {
  return request(app.server).post('/api/v1/subscriptions/unsubscribe').send(body)
}

async function createSubscription(overrides: Parameters<typeof makeAuthorSubscriptionOnDatabase>[0] = {}) {
  const { user: subscriber } = await makeUserOnDatabase()
  const { user: author } = await makeUserOnDatabase()
  const { subscription } = await makeAuthorSubscriptionOnDatabase({
    subscriberId: subscriber.id,
    authorId: author.id,
    ...overrides,
  })

  return { subscription }
}

async function findSubscription(id: string) {
  return new DrizzleAuthorSubscriptionsRepository(db).findById(id)
}

describe('(E2E) - POST /api/v1/subscriptions/unsubscribe', () => {
  afterAll(async () => await app.close())

  it('cancelar pelo link: com o token certo e sem login, deve retornar 200 e gravar como cancelada', async () => {
    const { subscription } = await createSubscription()

    const response = await unsubscribeByToken({ token: subscription.unsubscribeToken })

    expect(response.status).toBe(200)
    expect(response.body).toEqual({ status: 'UNSUBSCRIBED' })

    const saved = await findSubscription(subscription.id.toString())

    expect(saved?.status).toBe(SubscriptionStatus.UNSUBSCRIBED)
    expect(saved?.unsubscribedAt).toBeInstanceOf(Date)
  })

  it('cancelar pelo link: com token desconhecido, deve retornar 404 com mensagem', async () => {
    const response = await unsubscribeByToken({ token: 'a'.repeat(64) })

    expect(response.status).toBe(404)
    expect(response.body.message).toBe('Assinatura não encontrada')
  })

  it('cancelar pelo link: com token em formato inválido, deve retornar 400 e não cancelar nada', async () => {
    const { subscription } = await createSubscription()

    const response = await unsubscribeByToken({ token: 'token-curto' })

    expect(response.status).toBe(400)

    const saved = await findSubscription(subscription.id.toString())

    expect(saved?.status).toBe(SubscriptionStatus.ACTIVE)
  })

  it('cancelar pelo link: sem o token no corpo, deve retornar 400', async () => {
    const response = await unsubscribeByToken({})

    expect(response.status).toBe(400)
  })

  it('cancelar pelo link: com assinatura já cancelada, deve retornar 200 e manter a data original', async () => {
    const { subscription } = await createSubscription({
      status: SubscriptionStatus.UNSUBSCRIBED,
      unsubscribedAt: new Date('2026-02-01T10:00:00.000Z'),
    })

    const response = await unsubscribeByToken({ token: subscription.unsubscribeToken })

    expect(response.status).toBe(200)

    const saved = await findSubscription(subscription.id.toString())

    expect(saved?.unsubscribedAt?.toISOString()).toBe('2026-02-01T10:00:00.000Z')
  })

  it('cancelar pelo link: deve cancelar só a assinatura do token e manter as outras ativas', async () => {
    const { subscription: target } = await createSubscription()
    const { subscription: other } = await createSubscription()

    await unsubscribeByToken({ token: target.unsubscribeToken })

    const savedOther = await findSubscription(other.id.toString())

    expect(savedOther?.status).toBe(SubscriptionStatus.ACTIVE)
  })
})
