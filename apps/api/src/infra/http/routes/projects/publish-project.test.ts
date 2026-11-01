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

function publishNow(projectId: string, accessToken?: string) {
  const req = request(app.server).post(`/api/v1/projects/${projectId}/publish-now`)

  return accessToken ? req.set('Authorization', `Bearer ${accessToken}`) : req
}

describe('(E2E) - POST /api/v1/projects/:projectId/publish-now', () => {
  afterAll(async () => await app.close())

  it('publicar agora: com projeto em rascunho, deve retornar 200 e publicar no banco', async () => {
    const { accessToken, user } = await authenticateUser()
    const { project } = await makeProjectOnDatabase({ author: user.id, status: ProjectStatus.SKETCH })

    const response = await publishNow(project.id.toString(), accessToken)

    expect(response.status).toBe(200)
    expect(response.body.project.id).toBe(project.id.toString())
    expect(response.body.project.title).toBe(project.title)
    expect(response.body.project.status).toBe('PUBLISHED')

    const saved = await new DrizzleProjectsRepository(db).findById(project.id.toString())

    expect(saved?.status).toBe(ProjectStatus.PUBLISHED)
  })

  it('publicar agora: com projeto agendado, deve retornar 200 e trazer o lançamento para agora', async () => {
    const { accessToken, user } = await authenticateUser()
    const { project } = await makeProjectOnDatabase({ author: user.id, status: ProjectStatus.SCHEDULED })
    await makeProjectScheduledOnDatabase({
      projectId: project.id,
      publishedIn: new Date('2030-01-15T12:00:00.000Z'),
    })

    const response = await publishNow(project.id.toString(), accessToken)

    expect(response.status).toBe(200)
    expect(response.body.project.status).toBe('PUBLISHED')

    const savedProject = await new DrizzleProjectsRepository(db).findById(project.id.toString())
    const savedSchedule = await new DrizzleProjectScheduledRepository(db).findById(project.id.toString())

    expect(savedProject?.status).toBe(ProjectStatus.PUBLISHED)
    expect(savedSchedule).not.toBeNull()
    expect(Math.abs((savedSchedule?.publishedIn.getTime() ?? 0) - Date.now())).toBeLessThan(ONE_MINUTE_IN_MS)
  })

  it('publicar agora: com projeto em rascunho, deve aparecer na listagem de hoje', async () => {
    const { accessToken, user } = await authenticateUser()
    const { project } = await makeProjectOnDatabase({ author: user.id, status: ProjectStatus.SKETCH })

    await publishNow(project.id.toString(), accessToken)
    const response = await request(app.server).get('/api/v1/projects/published/today')

    expect(response.status).toBe(200)

    const listed = response.body.projects.find((item: { id: string }) => item.id === project.id.toString())

    expect(listed).toBeDefined()
    expect(listed.status).toBe('PUBLISHED')
  })

  it('publicar agora: com projeto inexistente, deve retornar 404 com mensagem', async () => {
    const { accessToken } = await authenticateUser()

    const response = await publishNow(new UniqueEntityId().toString(), accessToken)

    expect(response.status).toBe(404)
    expect(response.body.message).toBe('Projeto não encontrado')
  })

  it('publicar agora: com projeto de outro usuário, deve retornar 403 e manter rascunho', async () => {
    const { accessToken } = await authenticateUser()
    const { user: owner } = await makeUserOnDatabase()
    const { project } = await makeProjectOnDatabase({ author: owner.id, status: ProjectStatus.SKETCH })

    const response = await publishNow(project.id.toString(), accessToken)

    expect(response.status).toBe(403)
    expect(response.body.message).toBe('Você não é o autor deste projeto.')

    const saved = await new DrizzleProjectsRepository(db).findById(project.id.toString())

    expect(saved?.status).toBe(ProjectStatus.SKETCH)
  })

  it('publicar agora: com projeto já publicado, deve retornar 400 com mensagem', async () => {
    const { accessToken, user } = await authenticateUser()
    const { project } = await makeProjectOnDatabase({ author: user.id, status: ProjectStatus.PUBLISHED })

    const response = await publishNow(project.id.toString(), accessToken)

    expect(response.status).toBe(400)
    expect(response.body.message).toBe('Somente projetos em rascunho ou agendados podem ser publicados')
  })

  it('publicar agora: sem token, deve retornar 401 e manter rascunho', async () => {
    const { user } = await makeUserOnDatabase()
    const { project } = await makeProjectOnDatabase({ author: user.id, status: ProjectStatus.SKETCH })

    const response = await publishNow(project.id.toString())

    expect(response.status).toBe(401)
    expect(response.body.message).toBe('Não autenticado.')

    const saved = await new DrizzleProjectsRepository(db).findById(project.id.toString())

    expect(saved?.status).toBe(ProjectStatus.SKETCH)
  })
})
