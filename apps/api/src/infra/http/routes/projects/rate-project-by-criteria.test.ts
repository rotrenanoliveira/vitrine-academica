import { appForTest as app } from '@tests/app'
import { makeAccessCodeOnDatabase } from '@tests/factories/make-access-code'
import { makeAccountOnDatabase } from '@tests/factories/make-account'
import { makeInstitutionOnDatabase } from '@tests/factories/make-institution'
import { makeInstitutionMemberOnDatabase } from '@tests/factories/make-institution-member'
import { makeProjectOnDatabase } from '@tests/factories/make-project'
import { makeRatingCriterionOnDatabase } from '@tests/factories/make-rating-criterion'
import { makeUserOnDatabase } from '@tests/factories/make-user'
import request from 'supertest'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
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
  const names = [
    'Originalidade e inovação',
    'Rigor metodológico e qualidade técnica',
    'Clareza e organização da apresentação',
    'Relevância e impacto',
  ]

  const criteria = []

  for (const name of names) {
    const { criterion } = await makeRatingCriterionOnDatabase({ name, active: true, weight: 1 })
    criteria.push(criterion)
  }

  return criteria
}

describe('(E2E) - PUT /api/v1/projects/:projectId/teacher-ratings', () => {
  afterAll(async () => await app.close())

  it('should be able to rate a project as teacher', async () => {
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

    const scores = criteria.map((criterion, index) => ({
      criterionId: criterion.id.toString(),
      score: 7 + (index % 3),
    }))

    const response = await request(app.server)
      .put(`/api/v1/projects/${project.id.toString()}/teacher-ratings`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ scores })

    expect(response.status).toBe(201)
    expect(response.body.rating.overallScore).toBeCloseTo(scores.reduce((sum, item) => sum + item.score, 0) / 4, 1)
    expect(response.body.rating.items).toHaveLength(4)
    expect(response.body.rating.teacherId).toBe(user.id.toString())
  })

  it('should not be able to rate with an unauthenticated user', async () => {
    const { user: author } = await makeUserOnDatabase()
    const { project } = await makeProjectOnDatabase({
      author: author.id,
      status: ProjectStatus.PUBLISHED,
    })
    const criteria = await seedCriteria()

    const response = await request(app.server)
      .put(`/api/v1/projects/${project.id.toString()}/teacher-ratings`)
      .send({
        scores: criteria.map((criterion) => ({
          criterionId: criterion.id.toString(),
          score: 8,
        })),
      })

    expect(response.status).toBe(401)
  })

  it('should not be able to rate if user is not a teacher', async () => {
    const { accessToken } = await authenticateUser()
    const { user: author } = await makeUserOnDatabase()
    const { project } = await makeProjectOnDatabase({
      author: author.id,
      status: ProjectStatus.PUBLISHED,
    })
    const criteria = await seedCriteria()

    const response = await request(app.server)
      .put(`/api/v1/projects/${project.id.toString()}/teacher-ratings`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        scores: criteria.map((criterion) => ({
          criterionId: criterion.id.toString(),
          score: 8,
        })),
      })

    expect(response.status).toBe(403)
  })

  it('should not be able to rate if the teacher is the owner of the project', async () => {
    const { accessToken, user } = await authenticateUser()
    const { institution } = await makeInstitutionOnDatabase({ registerBy: user.id })
    await makeInstitutionMemberOnDatabase({
      institutionId: institution.id.toString(),
      userId: user.id.toString(),
      role: InstitutionMemberRole.TEACHER,
      status: InstitutionMemberStatus.ACTIVE,
    })
    const { project } = await makeProjectOnDatabase({
      author: user.id,
      status: ProjectStatus.PUBLISHED,
    })
    const criteria = await seedCriteria()

    const response = await request(app.server)
      .put(`/api/v1/projects/${project.id.toString()}/teacher-ratings`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        scores: criteria.map((criterion) => ({
          criterionId: criterion.id.toString(),
          score: 8,
        })),
      })

    expect(response.status).toBe(403)
  })

  it('should be able to update a project rating', async () => {
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

    const firstScores = criteria.map((criterion) => ({
      criterionId: criterion.id.toString(),
      score: 5,
    }))

    await request(app.server)
      .put(`/api/v1/projects/${project.id.toString()}/teacher-ratings`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ scores: firstScores })

    const secondScores = criteria.map((criterion) => ({
      criterionId: criterion.id.toString(),
      score: 10,
    }))

    const response = await request(app.server)
      .put(`/api/v1/projects/${project.id.toString()}/teacher-ratings`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ scores: secondScores })

    expect(response.status).toBe(200)
    expect(response.body.rating.overallScore).toBe(10)
  })

  it('should not be able to rate inexistent project', async () => {
    const { accessToken, user } = await authenticateUser()
    const { institution } = await makeInstitutionOnDatabase({ registerBy: user.id })
    await makeInstitutionMemberOnDatabase({
      institutionId: institution.id.toString(),
      userId: user.id.toString(),
      role: InstitutionMemberRole.PROFESSOR,
      status: InstitutionMemberStatus.ACTIVE,
    })
    const criteria = await seedCriteria()

    const response = await request(app.server)
      .put(`/api/v1/projects/${new UniqueEntityId().toString()}/teacher-ratings`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        scores: criteria.map((criterion) => ({
          criterionId: criterion.id.toString(),
          score: 8,
        })),
      })

    expect(response.status).toBe(404)
  })
})
