import { appForTest as app } from '@tests/app'
import { makeAccessCodeOnDatabase } from '@tests/factories/make-access-code'
import { makeAccountOnDatabase } from '@tests/factories/make-account'
import { makeProjectOnDatabase } from '@tests/factories/make-project'
import { makeProjectScheduledOnDatabase } from '@tests/factories/make-project-scheduled'
import { makeUserOnDatabase } from '@tests/factories/make-user'
import request from 'supertest'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { ProjectStatus } from '@/domain/project/enterprise/entities/project'
import { db } from '@/infra/database/drizzle/client'
import { DrizzleProjectScheduledRepository } from '@/infra/database/repositories/drizzle-project-scheduled-repository'
import { DrizzleProjectsRepository } from '@/infra/database/repositories/drizzle-projects-repository'

const ONE_MINUTE_IN_MS = 60 * 1000

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

describe('(E2E) - POST /api/v1/projects/:projectId/publish-now', () => {
  afterAll(async () => await app.close())

  it('deve ser possível publicar agora um projeto em rascunho', async () => {
    const { accessToken, user } = await authenticateUser()
    const { project } = await makeProjectOnDatabase({ author: user.id, status: ProjectStatus.SKETCH })

    const response = await request(app.server)
      .post(`/api/v1/projects/${project.id.toString()}/publish-now`)
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.status).toBe(200)
    expect(response.body.project.id).toBe(project.id.toString())
    expect(response.body.project.status).toBe('PUBLISHED')

    const saved = await new DrizzleProjectsRepository(db).findById(project.id.toString())
    const savedSchedule = await new DrizzleProjectScheduledRepository(db).findById(project.id.toString())

    expect(saved?.status).toBe(ProjectStatus.PUBLISHED)
    expect(savedSchedule).not.toBeNull()
    expect(Math.abs((savedSchedule?.publishedIn.getTime() ?? 0) - Date.now())).toBeLessThan(ONE_MINUTE_IN_MS)
  })

  it('deve trazer o lançamento de um projeto agendado para o momento da publicação', async () => {
    const { accessToken, user } = await authenticateUser()
    const { project } = await makeProjectOnDatabase({ author: user.id, status: ProjectStatus.SCHEDULED })
    await makeProjectScheduledOnDatabase({
      projectId: project.id,
      publishedIn: new Date('2030-01-15T12:00:00.000Z'),
    })

    const response = await request(app.server)
      .post(`/api/v1/projects/${project.id.toString()}/publish-now`)
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.status).toBe(200)
    expect(response.body.project.status).toBe('PUBLISHED')

    const savedProject = await new DrizzleProjectsRepository(db).findById(project.id.toString())
    const savedSchedule = await new DrizzleProjectScheduledRepository(db).findById(project.id.toString())

    expect(savedProject?.status).toBe(ProjectStatus.PUBLISHED)
    expect(savedSchedule).not.toBeNull()
    expect(Math.abs((savedSchedule?.publishedIn.getTime() ?? 0) - Date.now())).toBeLessThan(ONE_MINUTE_IN_MS)
  })

  it('deve fazer o projeto publicado agora aparecer na listagem de hoje', async () => {
    const { accessToken, user } = await authenticateUser()
    const { project } = await makeProjectOnDatabase({ author: user.id, status: ProjectStatus.SKETCH })

    await request(app.server)
      .post(`/api/v1/projects/${project.id.toString()}/publish-now`)
      .set('Authorization', `Bearer ${accessToken}`)

    const response = await request(app.server).get('/api/v1/projects/published/today')

    expect(response.status).toBe(200)

    const ids = response.body.projects.map((item: { id: string }) => item.id)

    expect(ids).toContain(project.id.toString())
  })

  it('não deve publicar um projeto que não existe', async () => {
    const { accessToken } = await authenticateUser()

    const response = await request(app.server)
      .post(`/api/v1/projects/${new UniqueEntityId().toString()}/publish-now`)
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.status).toBe(404)
    expect(response.body).toEqual({ message: expect.any(String) })
  })

  it('não deve publicar um projeto de outro usuário', async () => {
    const { accessToken } = await authenticateUser()
    const { user: owner } = await makeUserOnDatabase()
    const { project } = await makeProjectOnDatabase({ author: owner.id, status: ProjectStatus.SKETCH })

    const response = await request(app.server)
      .post(`/api/v1/projects/${project.id.toString()}/publish-now`)
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.status).toBe(403)

    const saved = await new DrizzleProjectsRepository(db).findById(project.id.toString())

    expect(saved?.status).toBe(ProjectStatus.SKETCH)
  })

  it('não deve publicar um projeto que já está publicado', async () => {
    const { accessToken, user } = await authenticateUser()
    const { project } = await makeProjectOnDatabase({ author: user.id, status: ProjectStatus.PUBLISHED })

    const response = await request(app.server)
      .post(`/api/v1/projects/${project.id.toString()}/publish-now`)
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.status).toBe(400)
    expect(response.body).toEqual({ message: expect.any(String) })
  })

  it('não deve publicar sem estar logado', async () => {
    const { user } = await makeUserOnDatabase()
    const { project } = await makeProjectOnDatabase({ author: user.id, status: ProjectStatus.SKETCH })

    const response = await request(app.server).post(`/api/v1/projects/${project.id.toString()}/publish-now`)

    expect(response.status).toBe(401)

    const saved = await new DrizzleProjectsRepository(db).findById(project.id.toString())

    expect(saved?.status).toBe(ProjectStatus.SKETCH)
  })
})