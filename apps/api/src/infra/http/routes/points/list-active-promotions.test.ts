import { appForTest as app } from '@tests/app'
import { makeAccessCodeOnDatabase } from '@tests/factories/make-access-code'
import { makeAccountOnDatabase } from '@tests/factories/make-account'
import { makeProjectOnDatabase } from '@tests/factories/make-project'
import { makePromotionOnDatabase } from '@tests/factories/make-promotion'
import { makeUserOnDatabase } from '@tests/factories/make-user'
import request from 'supertest'
import { UserStatus } from '@/domain/identity/enterprise/entities/user'
import { PromotionStatus } from '@/domain/points/enterprise/entities/promotion'
import { ProjectStatus } from '@/domain/project/enterprise/entities/project'

const DAY_IN_MS = 24 * 60 * 60 * 1000

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

async function makeProjectWithPromoter(status: ProjectStatus = ProjectStatus.PUBLISHED) {
  const { user: author } = await makeUserOnDatabase()
  const { user: promoter } = await makeUserOnDatabase()
  const { project } = await makeProjectOnDatabase({ author: author.id, status })

  return { project, author, promoter }
}

async function listActive(accessToken: string) {
  const response = await request(app.server)
    .get('/api/v1/promotions/active')
    .set('Authorization', `Bearer ${accessToken}`)

  return response
}

describe('(E2E) - GET /api/v1/promotions/active', () => {
  afterAll(async () => await app.close())

  it('should list an active promotion with the project and the promoter', async () => {
    const { accessToken } = await authenticateUser()
    const { project, author, promoter } = await makeProjectWithPromoter()
    const { promotion } = await makePromotionOnDatabase({ projectId: project.id, promoterId: promoter.id })

    const response = await listActive(accessToken)

    expect(response.status).toBe(200)

    const item = response.body.items.find(
      (entry: { promotion: { id: string } }) => entry.promotion.id === promotion.id.toString(),
    )

    expect(item).toEqual({
      promotion: {
        id: promotion.id.toString(),
        projectId: project.id.toString(),
        promoterId: promoter.id.toString(),
        cost: promotion.cost,
        status: 'ACTIVE',
        expiresAt: expect.any(String),
        createdAt: expect.any(String),
      },
      project: {
        id: project.id.toString(),
        title: project.title,
        slug: project.slug,
        description: project.description,
        authorId: author.id.toString(),
        status: 'PUBLISHED',
        coverUrl: project.coverUrl,
        attachments: [],
        tags: [],
        createdAt: expect.any(String),
      },
      promoter: {
        id: promoter.id.toString(),
        name: promoter.name,
      },
    })
    expect(response.body.page).toBe(1)
    expect(response.body.limit).toBe(20)
    expect(typeof response.body.total).toBe('number')
  })

  it('should not list a promotion whose validity has passed', async () => {
    const { accessToken } = await authenticateUser()
    const { project, promoter } = await makeProjectWithPromoter()
    const { promotion } = await makePromotionOnDatabase({
      projectId: project.id,
      promoterId: promoter.id,
      expiresAt: new Date(Date.now() - 1000),
    })

    const response = await listActive(accessToken)

    expect(response.status).toBe(200)
    expect(
      response.body.items.some(
        (entry: { promotion: { id: string } }) => entry.promotion.id === promotion.id.toString(),
      ),
    ).toBe(false)
  })

  it('should not list a promotion marked as expired', async () => {
    const { accessToken } = await authenticateUser()
    const { project, promoter } = await makeProjectWithPromoter()
    const { promotion } = await makePromotionOnDatabase({
      projectId: project.id,
      promoterId: promoter.id,
      status: PromotionStatus.EXPIRED,
    })

    const response = await listActive(accessToken)

    expect(
      response.body.items.some(
        (entry: { promotion: { id: string } }) => entry.promotion.id === promotion.id.toString(),
      ),
    ).toBe(false)
  })

  it('should not list a promotion of a project that is not published', async () => {
    const { accessToken } = await authenticateUser()
    const { project, promoter } = await makeProjectWithPromoter(ProjectStatus.ARCHIVED)
    const { promotion } = await makePromotionOnDatabase({ projectId: project.id, promoterId: promoter.id })

    const response = await listActive(accessToken)

    expect(
      response.body.items.some(
        (entry: { promotion: { id: string } }) => entry.promotion.id === promotion.id.toString(),
      ),
    ).toBe(false)
  })

  it('should keep listing an active promotion whose promoter has deleted the account', async () => {
    const { accessToken } = await authenticateUser()
    const { user: author } = await makeUserOnDatabase()
    const { user: promoter } = await makeUserOnDatabase({
      name: 'Conta anonimizada',
      status: UserStatus.DELETED,
    })
    const { project } = await makeProjectOnDatabase({ author: author.id, status: ProjectStatus.PUBLISHED })
    const { promotion } = await makePromotionOnDatabase({ projectId: project.id, promoterId: promoter.id })

    const response = await listActive(accessToken)

    const item = response.body.items.find(
      (entry: { promotion: { id: string } }) => entry.promotion.id === promotion.id.toString(),
    )

    expect(response.status).toBe(200)
    expect(item.promoter).toEqual({ id: promoter.id.toString(), name: 'Conta anonimizada' })
  })

  it('should list the newest promotions first', async () => {
    const { accessToken } = await authenticateUser()
    const { project: olderProject, promoter: olderPromoter } = await makeProjectWithPromoter()
    const { project: newerProject, promoter: newerPromoter } = await makeProjectWithPromoter()

    const { promotion: older } = await makePromotionOnDatabase({
      projectId: olderProject.id,
      promoterId: olderPromoter.id,
      createdAt: new Date(Date.now() - 2 * DAY_IN_MS),
    })
    const { promotion: newer } = await makePromotionOnDatabase({
      projectId: newerProject.id,
      promoterId: newerPromoter.id,
      createdAt: new Date(Date.now() - DAY_IN_MS),
    })

    const response = await listActive(accessToken)
    const ids = response.body.items.map((entry: { promotion: { id: string } }) => entry.promotion.id)

    expect(ids.indexOf(newer.id.toString())).toBeGreaterThanOrEqual(0)
    expect(ids.indexOf(newer.id.toString())).toBeLessThan(ids.indexOf(older.id.toString()))
  })

  it('should be able to list promotions without authentication', async () => {
    const response = await request(app.server).get('/api/v1/promotions/active')

    expect(response.status).toBe(200)
    expect(response.body.items).toEqual(expect.any(Array))
    expect(response.body.page).toBe(1)
    expect(response.body.limit).toBe(20)
    expect(typeof response.body.total).toBe('number')
  })

  it('should paginate unique promoted projects', async () => {
    const { accessToken } = await authenticateUser()
    const created: string[] = []

    for (let index = 0; index < 3; index++) {
      const { project, promoter } = await makeProjectWithPromoter()
      const { promotion } = await makePromotionOnDatabase({
        projectId: project.id,
        promoterId: promoter.id,
        createdAt: new Date(Date.now() - (3 - index) * DAY_IN_MS),
      })
      created.push(promotion.id.toString())
    }

    const page1 = await request(app.server)
      .get('/api/v1/promotions/active')
      .query({ page: 1, limit: 2 })
      .set('Authorization', `Bearer ${accessToken}`)

    const page2 = await request(app.server)
      .get('/api/v1/promotions/active')
      .query({ page: 2, limit: 2 })
      .set('Authorization', `Bearer ${accessToken}`)

    expect(page1.status).toBe(200)
    expect(page1.body.page).toBe(1)
    expect(page1.body.limit).toBe(2)
    expect(page1.body.total).toBeGreaterThanOrEqual(3)
    expect(page1.body.items).toHaveLength(2)

    expect(page2.status).toBe(200)
    expect(page2.body.page).toBe(2)
    expect(page2.body.limit).toBe(2)
    expect(page2.body.items.length).toBeGreaterThanOrEqual(1)

    const page1Ids = page1.body.items.map((entry: { promotion: { id: string } }) => entry.promotion.id)
    const page2Ids = page2.body.items.map((entry: { promotion: { id: string } }) => entry.promotion.id)
    expect(page1Ids.some((id: string) => page2Ids.includes(id))).toBe(false)
  })

  it('should keep only one entry when the same project has multiple active promotions', async () => {
    const { accessToken } = await authenticateUser()
    const { project, promoter: firstPromoter } = await makeProjectWithPromoter()
    const { user: secondPromoter } = await makeUserOnDatabase()

    const { promotion: older } = await makePromotionOnDatabase({
      projectId: project.id,
      promoterId: firstPromoter.id,
      createdAt: new Date(Date.now() - 2 * DAY_IN_MS),
    })
    const { promotion: newer } = await makePromotionOnDatabase({
      projectId: project.id,
      promoterId: secondPromoter.id,
      createdAt: new Date(Date.now() - DAY_IN_MS),
    })

    const response = await listActive(accessToken)
    const matches = response.body.items.filter(
      (entry: { project: { id: string } }) => entry.project.id === project.id.toString(),
    )

    expect(matches).toHaveLength(1)
    expect(matches[0].promotion.id).toBe(newer.id.toString())
    expect(matches[0].promotion.id).not.toBe(older.id.toString())
  })
})
