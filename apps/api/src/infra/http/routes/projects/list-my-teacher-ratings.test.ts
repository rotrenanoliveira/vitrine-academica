import { appForTest as app } from '@tests/app'
import { makeAccessCodeOnDatabase } from '@tests/factories/make-access-code'
import { makeAccountOnDatabase } from '@tests/factories/make-account'
import { makeInstitutionOnDatabase } from '@tests/factories/make-institution'
import { makeInstitutionMemberOnDatabase } from '@tests/factories/make-institution-member'
import { makeProjectOnDatabase } from '@tests/factories/make-project'
import { makeRatingCriterionOnDatabase } from '@tests/factories/make-rating-criterion'
import { makeUserOnDatabase } from '@tests/factories/make-user'
import request from 'supertest'
import {
  InstitutionMemberRole,
  InstitutionMemberStatus,
} from '@/domain/institution/enterprise/entities/institution-member'
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

async function seedCriteria() {
  const criteria = []
  for (const name of ['A', 'B', 'C', 'D']) {
    const { criterion } = await makeRatingCriterionOnDatabase({ name, active: true })
    criteria.push(criterion)
  }
  return criteria
}

describe('(E2E) - GET /api/v1/me/teacher-ratings', () => {
  afterAll(async () => await app.close())

  it('should be able to list projects rated by the teacher', async () => {
    const { accessToken, user } = await authenticateUser()
    const { user: author } = await makeUserOnDatabase()
    const { institution } = await makeInstitutionOnDatabase({ registerBy: user.id })
    await makeInstitutionMemberOnDatabase({
      institutionId: institution.id.toString(),
      userId: user.id.toString(),
      role: InstitutionMemberRole.PROFESSOR,
      status: InstitutionMemberStatus.ACTIVE,
    })
    const { project } = await makeProjectOnDatabase({
      author: author.id,
      status: ProjectStatus.PUBLISHED,
    })
    const criteria = await seedCriteria()

    await request(app.server)
      .put(`/api/v1/projects/${project.id.toString()}/teacher-ratings`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        scores: criteria.map((criterion) => ({
          criterionId: criterion.id.toString(),
          score: 8,
        })),
      })

    const response = await request(app.server)
      .get('/api/v1/me/teacher-ratings')
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.status).toBe(200)
    expect(response.body.items).toHaveLength(1)
    expect(response.body.items[0].project.id).toBe(project.id.toString())
    expect(response.body.items[0].rating.overallScore).toBe(8)
    expect(response.body.items[0].rating.items).toHaveLength(4)
  })
})
