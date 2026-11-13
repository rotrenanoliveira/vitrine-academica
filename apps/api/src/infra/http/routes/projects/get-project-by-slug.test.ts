import { appForTest as app } from '@tests/app'
import { makeAccessCodeOnDatabase } from '@tests/factories/make-access-code'
import { makeAccountOnDatabase } from '@tests/factories/make-account'
import { makeProjectOnDatabase } from '@tests/factories/make-project'
import { makeProjectMemberOnDatabase } from '@tests/factories/make-project-member'
import { makeUserOnDatabase } from '@tests/factories/make-user'
import request from 'supertest'
import { ProjectStatus } from '@/domain/project/enterprise/entities/project'
import { ProjectMemberStatus } from '@/domain/project/enterprise/entities/project-member'

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

describe('(E2E) - GET /api/v1/projects/slug/:slug', () => {
  afterAll(async () => await app.close())

  it('deve permitir o dono ver um rascunho', async () => {
    const { accessToken, user } = await authenticateUser()
    const { project } = await makeProjectOnDatabase({
      author: user.id,
      status: ProjectStatus.SKETCH,
    })

    const response = await request(app.server)
      .get(`/api/v1/projects/slug/${project.slug}`)
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.status).toBe(200)
    expect(response.body.project.id).toBe(project.id.toString())
    expect(response.body.project.slug).toBe(project.slug)
  })

  it('não deve permitir outro usuário ver um rascunho', async () => {
    const { accessToken } = await authenticateUser()
    const { user: owner } = await makeUserOnDatabase()
    const { project } = await makeProjectOnDatabase({
      author: owner.id,
      status: ProjectStatus.SKETCH,
    })

    const response = await request(app.server)
      .get(`/api/v1/projects/slug/${project.slug}`)
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.status).toBe(404)
  })

  it('deve permitir qualquer autenticado ver projeto publicado', async () => {
    const { accessToken } = await authenticateUser()
    const { user: owner } = await makeUserOnDatabase()
    const { project } = await makeProjectOnDatabase({
      author: owner.id,
      status: ProjectStatus.PUBLISHED,
    })

    const response = await request(app.server)
      .get(`/api/v1/projects/slug/${project.slug}`)
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.status).toBe(200)
  })

  it('deve retornar 404 quando o projeto não existe', async () => {
    const { accessToken } = await authenticateUser()

    const response = await request(app.server)
      .get('/api/v1/projects/slug/projeto-inexistente')
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.status).toBe(404)
  })

  it('deve permitir ao coautor que aceitou o convite ver um rascunho', async () => {
    const { accessToken, user } = await authenticateUser()
    const { user: owner } = await makeUserOnDatabase()
    const { project } = await makeProjectOnDatabase({
      author: owner.id,
      status: ProjectStatus.SKETCH,
    })
    await makeProjectMemberOnDatabase({
      projectId: project.id,
      userId: user.id,
      status: ProjectMemberStatus.ACCEPTED,
    })

    const response = await request(app.server)
      .get(`/api/v1/projects/slug/${project.slug}`)
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.status).toBe(200)
    expect(response.body.project.id).toBe(project.id.toString())
    expect(response.body.project.status).toBe('SKETCH')
  })

  it.each([ProjectMemberStatus.PENDING, ProjectMemberStatus.REJECTED])(
    'não deve permitir a quem tem convite %s ver um rascunho',
    async (memberStatus) => {
      const { accessToken, user } = await authenticateUser()
      const { user: owner } = await makeUserOnDatabase()
      const { project } = await makeProjectOnDatabase({
        author: owner.id,
        status: ProjectStatus.SKETCH,
      })
      await makeProjectMemberOnDatabase({
        projectId: project.id,
        userId: user.id,
        status: memberStatus,
      })

      const response = await request(app.server)
        .get(`/api/v1/projects/slug/${project.slug}`)
        .set('Authorization', `Bearer ${accessToken}`)

      expect(response.status).toBe(404)
    },
  )
})
