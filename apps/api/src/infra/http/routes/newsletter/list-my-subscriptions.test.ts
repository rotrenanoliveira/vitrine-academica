import { appForTest as app } from '@tests/app'
import { makeAccessCodeOnDatabase } from '@tests/factories/make-access-code'
import { makeAccountOnDatabase } from '@tests/factories/make-account'
import { makeAuthorSubscriptionOnDatabase } from '@tests/factories/make-author-subscription'
import { makeUserOnDatabase } from '@tests/factories/make-user'
import request from 'supertest'
import { SubscriptionStatus } from '@/domain/newsletter/enterprise/entities/author-subscription'

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

function listMine(accessToken?: string, query = '') {
  const req = request(app.server).get(`/api/v1/subscriptions/me${query}`)

  return accessToken ? req.set('Authorization', `Bearer ${accessToken}`) : req
}

describe('(E2E) - GET /api/v1/subscriptions/me', () => {
  afterAll(async () => await app.close())

  it('minhas assinaturas: com assinatura ativa, deve retornar 200 com o autor e sem o token nem o e-mail', async () => {
    const { accessToken, user } = await authenticateUser()
    const { user: author } = await makeUserOnDatabase({ name: 'Autora Exemplo' })
    const { subscription } = await makeAuthorSubscriptionOnDatabase({ subscriberId: user.id, authorId: author.id })

    const response = await listMine(accessToken)

    expect(response.status).toBe(200)
    expect(response.body).toEqual({
      subscriptions: [
        {
          id: subscription.id.toString(),
          status: 'ACTIVE',
          subscribedAt: expect.any(String),
          author: { id: author.id.toString(), name: 'Autora Exemplo' },
        },
      ],
    })
  })

  it('minhas assinaturas: por padrão, deve mostrar só as ativas', async () => {
    const { accessToken, user } = await authenticateUser()
    const { user: first } = await makeUserOnDatabase()
    const { user: second } = await makeUserOnDatabase()
    const { subscription: active } = await makeAuthorSubscriptionOnDatabase({
      subscriberId: user.id,
      authorId: first.id,
    })
    await makeAuthorSubscriptionOnDatabase({
      subscriberId: user.id,
      authorId: second.id,
      status: SubscriptionStatus.UNSUBSCRIBED,
      unsubscribedAt: new Date(),
    })

    const response = await listMine(accessToken)

    expect(response.status).toBe(200)
    expect(response.body.subscriptions).toHaveLength(1)
    expect(response.body.subscriptions[0].id).toBe(active.id.toString())
  })

  it('minhas assinaturas: filtrando por canceladas, deve mostrar só as canceladas', async () => {
    const { accessToken, user } = await authenticateUser()
    const { user: first } = await makeUserOnDatabase()
    const { user: second } = await makeUserOnDatabase()
    await makeAuthorSubscriptionOnDatabase({ subscriberId: user.id, authorId: first.id })
    const { subscription: cancelled } = await makeAuthorSubscriptionOnDatabase({
      subscriberId: user.id,
      authorId: second.id,
      status: SubscriptionStatus.UNSUBSCRIBED,
      unsubscribedAt: new Date(),
    })

    const response = await listMine(accessToken, '?status=UNSUBSCRIBED')

    expect(response.status).toBe(200)
    expect(response.body.subscriptions).toHaveLength(1)
    expect(response.body.subscriptions[0].id).toBe(cancelled.id.toString())
  })

  it('minhas assinaturas: com assinaturas de outras pessoas, não deve mostrá-las', async () => {
    const { accessToken, user } = await authenticateUser()
    const { user: stranger } = await makeUserOnDatabase()
    const { user: author } = await makeUserOnDatabase()
    const { subscription: mine } = await makeAuthorSubscriptionOnDatabase({
      subscriberId: user.id,
      authorId: author.id,
    })
    await makeAuthorSubscriptionOnDatabase({ subscriberId: stranger.id, authorId: author.id })

    const response = await listMine(accessToken)

    expect(response.status).toBe(200)
    expect(response.body.subscriptions).toHaveLength(1)
    expect(response.body.subscriptions[0].id).toBe(mine.id.toString())
  })

  it('minhas assinaturas: sem token, deve retornar 401', async () => {
    const response = await listMine()

    expect(response.status).toBe(401)
    expect(response.body.message).toBe('Não autenticado.')
  })

  it('minhas assinaturas: sem nenhuma assinatura, deve retornar 200 com lista vazia', async () => {
    const { accessToken } = await authenticateUser()

    const response = await listMine(accessToken)

    expect(response.status).toBe(200)
    expect(response.body).toEqual({ subscriptions: [] })
  })

  it('minhas assinaturas: com status inválido, deve retornar 400', async () => {
    const { accessToken } = await authenticateUser()

    const response = await listMine(accessToken, '?status=QUALQUER')

    expect(response.status).toBe(400)
  })
})
