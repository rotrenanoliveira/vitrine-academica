import { appForTest as app } from '@tests/app'
import { makeAccessCodeOnDatabase } from '@tests/factories/make-access-code'
import { makeAccountOnDatabase } from '@tests/factories/make-account'
import { makeAuthorSubscriptionOnDatabase } from '@tests/factories/make-author-subscription'
import { makeProjectOnDatabase } from '@tests/factories/make-project'
import { makeUserOnDatabase } from '@tests/factories/make-user'
import request from 'supertest'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { SubscriptionStatus } from '@/domain/newsletter/enterprise/entities/author-subscription'
import { ProjectStatus } from '@/domain/project/enterprise/entities/project'
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

function follow(authorId: string, accessToken?: string) {
  const req = request(app.server).post(`/api/v1/authors/${authorId}/subscriptions`)

  return accessToken ? req.set('Authorization', `Bearer ${accessToken}`) : req
}

async function createAuthor(projectStatus: ProjectStatus = ProjectStatus.PUBLISHED) {
  const { user: author } = await makeUserOnDatabase()
  await makeProjectOnDatabase({ author: author.id, status: projectStatus })

  return { author }
}

async function findSubscription(subscriberId: string, authorId: string) {
  return new DrizzleAuthorSubscriptionsRepository(db).findBySubscriberAndAuthor(subscriberId, authorId)
}

describe('(E2E) - POST /api/v1/authors/:authorId/subscriptions', () => {
  afterAll(async () => await app.close())

  it('acompanhar autor: com projeto publicado, deve retornar 201 com a assinatura ativa e sem o token', async () => {
    const { accessToken, user } = await authenticateUser()
    const { author } = await createAuthor()

    const response = await follow(author.id.toString(), accessToken)

    expect(response.status).toBe(201)
    expect(response.body.subscription).toEqual({
      id: expect.any(String),
      authorId: author.id.toString(),
      status: 'ACTIVE',
      subscribedAt: expect.any(String),
      unsubscribedAt: null,
    })

    const saved = await findSubscription(user.id.toString(), author.id.toString())

    expect(saved?.status).toBe(SubscriptionStatus.ACTIVE)
    expect(saved?.email).toBe(user.email)
    expect(saved?.unsubscribeToken).toHaveLength(64)
  })

  it('acompanhar autor: sem token, deve retornar 401', async () => {
    const { author } = await createAuthor()

    const response = await follow(author.id.toString())

    expect(response.status).toBe(401)
    expect(response.body.message).toBe('Não autenticado.')
  })

  it('acompanhar autor: com autor inexistente, deve retornar 404 com mensagem', async () => {
    const { accessToken } = await authenticateUser()

    const response = await follow(new UniqueEntityId().toString(), accessToken)

    expect(response.status).toBe(404)
    expect(response.body.message).toBe('Autor não encontrado')
  })

  it('acompanhar autor: a si mesmo, deve retornar 400 com mensagem', async () => {
    const { accessToken, user } = await authenticateUser()

    const response = await follow(user.id.toString(), accessToken)

    expect(response.status).toBe(400)
    expect(response.body.message).toBe('Você não pode acompanhar a si mesmo')
  })

  it('acompanhar autor: sem projeto publicado, deve retornar 400 e não criar assinatura', async () => {
    const { accessToken, user } = await authenticateUser()
    const { author } = await createAuthor(ProjectStatus.SKETCH)

    const response = await follow(author.id.toString(), accessToken)

    expect(response.status).toBe(400)
    expect(response.body.message).toBe('Este autor ainda não tem projetos publicados')
    expect(await findSubscription(user.id.toString(), author.id.toString())).toBeNull()
  })

  it('acompanhar autor: já acompanhado, deve retornar 409 com mensagem', async () => {
    const { accessToken, user } = await authenticateUser()
    const { author } = await createAuthor()
    await makeAuthorSubscriptionOnDatabase({ subscriberId: user.id, authorId: author.id })

    const response = await follow(author.id.toString(), accessToken)

    expect(response.status).toBe(409)
    expect(response.body.message).toBe('Você já acompanha este autor')
  })

  it('acompanhar autor: depois de cancelar, deve retornar 201 e reativar a mesma assinatura', async () => {
    const { accessToken, user } = await authenticateUser()
    const { author } = await createAuthor()
    const { subscription } = await makeAuthorSubscriptionOnDatabase({
      subscriberId: user.id,
      authorId: author.id,
      status: SubscriptionStatus.UNSUBSCRIBED,
      unsubscribedAt: new Date(),
    })

    const response = await follow(author.id.toString(), accessToken)

    expect(response.status).toBe(201)
    expect(response.body.subscription.id).toBe(subscription.id.toString())
    expect(response.body.subscription.status).toBe('ACTIVE')

    const saved = await findSubscription(user.id.toString(), author.id.toString())

    expect(saved?.status).toBe(SubscriptionStatus.ACTIVE)
    expect(saved?.unsubscribeToken).toBe(subscription.unsubscribeToken)
    expect(saved?.unsubscribedAt).toBeNull()
  })

  it('acompanhar autor: a assinatura criada, deve guardar o e-mail da conta e não o de outra pessoa', async () => {
    const { accessToken, user } = await authenticateUser()
    const { author } = await createAuthor()

    await follow(author.id.toString(), accessToken)

    const saved = await findSubscription(user.id.toString(), author.id.toString())

    expect(saved?.email).toBe(user.email)
    expect(saved?.email).not.toBe(author.email)
  })
})
