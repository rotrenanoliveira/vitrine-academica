import { appForTest as app } from '@tests/app'
import { makeAccessCodeOnDatabase } from '@tests/factories/make-access-code'
import { makeAccountOnDatabase } from '@tests/factories/make-account'
import { makePointTransactionOnDatabase } from '@tests/factories/make-point-transaction'
import { makeProjectOnDatabase } from '@tests/factories/make-project'
import { makeUserOnDatabase } from '@tests/factories/make-user'
import request from 'supertest'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { PROMOTION_COST } from '@/domain/points/application/constants/promotion-rules'
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

async function authenticatePromoter(balance: number) {
  const auth = await authenticateUser()

  if (balance > 0) {
    await makePointTransactionOnDatabase({ userId: auth.user.id, amount: balance })
  }

  return auth
}

async function makePublishedProject() {
  const { user: author } = await makeUserOnDatabase()
  const { project } = await makeProjectOnDatabase({ author: author.id, status: ProjectStatus.PUBLISHED })

  return { project, author }
}

function promote(accessToken: string, projectId: string) {
  return request(app.server)
    .post(`/api/v1/projects/${projectId}/promotions`)
    .set('Authorization', `Bearer ${accessToken}`)
}

async function getBalance(accessToken: string) {
  const response = await request(app.server).get('/api/v1/points/me').set('Authorization', `Bearer ${accessToken}`)

  return response.body.balance as number
}

describe('(E2E) - POST /api/v1/projects/:projectId/promotions', () => {
  afterAll(async () => await app.close())

  it('should be able to promote a published project', async () => {
    const { accessToken, user } = await authenticatePromoter(PROMOTION_COST)
    const { project } = await makePublishedProject()

    const response = await promote(accessToken, project.id.toString())

    expect(response.status).toBe(201)
    expect(response.body).toEqual({
      promotion: {
        id: expect.any(String),
        projectId: project.id.toString(),
        promoterId: user.id.toString(),
        cost: PROMOTION_COST,
        status: 'ACTIVE',
        expiresAt: expect.any(String),
        createdAt: expect.any(String),
      },
    })
  })

  it('should debit the cost and register the transaction in the history', async () => {
    const { accessToken } = await authenticatePromoter(PROMOTION_COST + 100)
    const { project } = await makePublishedProject()

    const response = await promote(accessToken, project.id.toString())

    expect(response.status).toBe(201)
    expect(await getBalance(accessToken)).toBe(100)

    const history = await request(app.server)
      .get('/api/v1/points/me/transactions')
      .set('Authorization', `Bearer ${accessToken}`)

    expect(history.body.transactions[0]).toEqual({
      id: expect.any(String),
      type: 'DEBIT',
      amount: PROMOTION_COST,
      reason: 'PROMOTION',
      referenceId: response.body.promotion.id,
      createdAt: expect.any(String),
    })
  })

  it('should not promote when the balance is insufficient', async () => {
    const { accessToken } = await authenticatePromoter(PROMOTION_COST - 1)
    const { project } = await makePublishedProject()

    const response = await promote(accessToken, project.id.toString())

    expect(response.status).toBe(409)
    expect(response.body).toEqual({ message: expect.any(String) })
    expect(await getBalance(accessToken)).toBe(PROMOTION_COST - 1)
  })

  it('should not promote the same project twice with the same user', async () => {
    const { accessToken } = await authenticatePromoter(PROMOTION_COST * 2)
    const { project } = await makePublishedProject()

    const first = await promote(accessToken, project.id.toString())
    const second = await promote(accessToken, project.id.toString())

    expect(first.status).toBe(201)
    expect(second.status).toBe(409)
    expect(await getBalance(accessToken)).toBe(PROMOTION_COST)
  })

  it('should not spend the same points on two promotions at the same time', async () => {
    const { accessToken } = await authenticatePromoter(PROMOTION_COST)
    const { project: firstProject } = await makePublishedProject()
    const { project: secondProject } = await makePublishedProject()

    const responses = await Promise.all([
      promote(accessToken, firstProject.id.toString()),
      promote(accessToken, secondProject.id.toString()),
    ])

    expect(responses.map((response) => response.status).sort()).toEqual([201, 409])
    expect(await getBalance(accessToken)).toBe(0)
  })

  it('should not promote the own project', async () => {
    const { accessToken, user } = await authenticatePromoter(PROMOTION_COST)
    const { project } = await makeProjectOnDatabase({ author: user.id, status: ProjectStatus.PUBLISHED })

    const response = await promote(accessToken, project.id.toString())

    expect(response.status).toBe(403)
    expect(response.body).toEqual({ message: expect.any(String) })
    expect(await getBalance(accessToken)).toBe(PROMOTION_COST)
  })

  it('should not promote a project that is not published', async () => {
    const { accessToken } = await authenticatePromoter(PROMOTION_COST)
    const { user: author } = await makeUserOnDatabase()
    const { project } = await makeProjectOnDatabase({ author: author.id, status: ProjectStatus.SKETCH })

    const response = await promote(accessToken, project.id.toString())

    expect(response.status).toBe(400)
    expect(response.body).toEqual({ message: expect.any(String) })
  })

  it('should not promote an inexistent project', async () => {
    const { accessToken } = await authenticatePromoter(PROMOTION_COST)

    const response = await promote(accessToken, new UniqueEntityId().toString())

    expect(response.status).toBe(404)
    expect(response.body).toEqual({ message: expect.any(String) })
  })

  it('should not promote a project with an unauthenticated user', async () => {
    const { project } = await makePublishedProject()

    const response = await request(app.server).post(`/api/v1/projects/${project.id.toString()}/promotions`)

    expect(response.status).toBe(401)
  })
})
