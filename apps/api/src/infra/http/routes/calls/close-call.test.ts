import { appForTest as app } from '@tests/app'
import { makeAccessCodeOnDatabase } from '@tests/factories/make-access-code'
import { makeAccountOnDatabase } from '@tests/factories/make-account'
import { makeCallOnDatabase } from '@tests/factories/make-call'
import { makeCallApplicationOnDatabase } from '@tests/factories/make-call-application'
import { makeCallSkillOnDatabase } from '@tests/factories/make-call-skill'
import { makeTagOnDatabase } from '@tests/factories/make-tag'
import { makeUserOnDatabase } from '@tests/factories/make-user'
import request from 'supertest'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { CallStatus } from '@/domain/call/enterprise/entities/call'
import { CallApplicationStatus } from '@/domain/call/enterprise/entities/call-application'
import { ProjectStatus } from '@/domain/project/enterprise/entities/project'
import { ProjectMemberStatus } from '@/domain/project/enterprise/entities/project-member'
import { db } from '@/infra/database/drizzle/client'
import { DrizzleCallsRepository } from '@/infra/database/repositories/drizzle-calls-repository'
import { DrizzleProjectMembersRepository } from '@/infra/database/repositories/drizzle-project-members-repository'
import { DrizzleProjectTagsRepository } from '@/infra/database/repositories/drizzle-project-tags-repository'
import { DrizzleProjectsRepository } from '@/infra/database/repositories/drizzle-projects-repository'

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

describe('(E2E) - POST /api/v1/calls/:callId/close', () => {
  afterAll(async () => await app.close())

  it('should be able to close a call as owner', async () => {
    const { accessToken, user } = await authenticateUser()
    const { call } = await makeCallOnDatabase({ authorId: user.id })

    const response = await request(app.server)
      .post(`/api/v1/calls/${call.id.toString()}/close`)
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.status).toBe(200)
    expect(response.body.call.id).toBe(call.id.toString())
    expect(response.body.call.status).toBe('CLOSED')
    expect(response.body.call.projectId).toEqual(expect.any(String))
  })

  it('should create a sketch project with the data, tags and approved members of the call', async () => {
    const { accessToken, user } = await authenticateUser()
    const { call } = await makeCallOnDatabase({ authorId: user.id })
    const { tag: tagA } = await makeTagOnDatabase()
    const { tag: tagB } = await makeTagOnDatabase()
    await makeCallSkillOnDatabase({ callId: call.id, tagId: tagA.id })
    await makeCallSkillOnDatabase({ callId: call.id, tagId: tagB.id })
    const { user: approved } = await makeUserOnDatabase()
    const { user: rejected } = await makeUserOnDatabase()
    const { user: pending } = await makeUserOnDatabase()
    await makeCallApplicationOnDatabase({
      callId: call.id,
      applicantId: approved.id,
      status: CallApplicationStatus.APPROVED,
    })
    await makeCallApplicationOnDatabase({
      callId: call.id,
      applicantId: rejected.id,
      status: CallApplicationStatus.REJECTED,
    })
    await makeCallApplicationOnDatabase({
      callId: call.id,
      applicantId: pending.id,
      status: CallApplicationStatus.PENDING,
    })

    const response = await request(app.server)
      .post(`/api/v1/calls/${call.id.toString()}/close`)
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.status).toBe(200)

    const projectId = response.body.call.projectId as string
    expect(projectId).toEqual(expect.any(String))

    const project = await new DrizzleProjectsRepository(db).findById(projectId)
    expect(project?.title).toBe(call.title)
    expect(project?.description).toBe(call.description)
    expect(project?.author.toString()).toBe(user.id.toString())
    expect(project?.status).toBe(ProjectStatus.SKETCH)
    expect(project?.tags).toHaveLength(2)
    expect(project?.tags).toEqual(expect.arrayContaining([tagA.id.toString(), tagB.id.toString()]))

    const projectTags = await new DrizzleProjectTagsRepository(db).findByProjectId(projectId)
    expect(projectTags).toHaveLength(2)
    expect(projectTags.map((projectTag) => projectTag.tagId.toString())).toEqual(
      expect.arrayContaining([tagA.id.toString(), tagB.id.toString()]),
    )

    const members = await new DrizzleProjectMembersRepository(db).findManyByProjectId(projectId)
    expect(members).toHaveLength(1)
    expect(members[0].userId.toString()).toBe(approved.id.toString())
    expect(members[0].status).toBe(ProjectMemberStatus.ACCEPTED)

    const savedCall = await new DrizzleCallsRepository(db).findById(call.id.toString())
    expect(savedCall?.status).toBe(CallStatus.CLOSED)
    expect(savedCall?.projectId?.toString()).toBe(projectId)
  })

  it('should not create another project when the call is closed again', async () => {
    const { accessToken, user } = await authenticateUser()
    const { call } = await makeCallOnDatabase({ authorId: user.id })

    const first = await request(app.server)
      .post(`/api/v1/calls/${call.id.toString()}/close`)
      .set('Authorization', `Bearer ${accessToken}`)

    const second = await request(app.server)
      .post(`/api/v1/calls/${call.id.toString()}/close`)
      .set('Authorization', `Bearer ${accessToken}`)

    expect(first.status).toBe(200)
    expect(second.status).toBe(409)

    const projects = await new DrizzleProjectsRepository(db).findManyByAuthorId(user.id.toString())
    expect(projects).toHaveLength(1)
    expect(projects[0].id.toString()).toBe(first.body.call.projectId)
  })

  it('should not be able to close a call of another author', async () => {
    const { accessToken } = await authenticateUser()
    const { user: author } = await makeUserOnDatabase()
    const { call } = await makeCallOnDatabase({ authorId: author.id })

    const response = await request(app.server)
      .post(`/api/v1/calls/${call.id.toString()}/close`)
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.status).toBe(403)
    expect(response.body).toEqual({
      message: expect.any(String),
    })

    const projects = await new DrizzleProjectsRepository(db).findManyByAuthorId(author.id.toString())
    expect(projects).toHaveLength(0)
  })

  it('should not be able to close a call that is already closed', async () => {
    const { accessToken, user } = await authenticateUser()
    const { call } = await makeCallOnDatabase({ authorId: user.id, status: CallStatus.CLOSED })

    const response = await request(app.server)
      .post(`/api/v1/calls/${call.id.toString()}/close`)
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.status).toBe(409)
  })

  it('should not be able to close a call that does not exist', async () => {
    const { accessToken } = await authenticateUser()

    const response = await request(app.server)
      .post(`/api/v1/calls/${new UniqueEntityId().toString()}/close`)
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.status).toBe(404)
  })

  it('should not be able to close a call without authentication', async () => {
    const response = await request(app.server).post(`/api/v1/calls/${new UniqueEntityId().toString()}/close`)

    expect(response.status).toBe(401)
  })
})
