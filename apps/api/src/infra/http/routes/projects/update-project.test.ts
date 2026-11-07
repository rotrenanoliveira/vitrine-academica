import { appForTest as app } from '@tests/app'
import { makeAccessCodeOnDatabase } from '@tests/factories/make-access-code'
import { makeAccountOnDatabase } from '@tests/factories/make-account'
import { makeProjectOnDatabase } from '@tests/factories/make-project'
import { makeUserOnDatabase } from '@tests/factories/make-user'
import request from 'supertest'
import { ProjectStatus } from '@/domain/project/enterprise/entities/project'
import { makeProjectMemberOnDatabase } from '@tests/factories/make-project-member'
import { ProjectMemberStatus } from '@/domain/project/enterprise/entities/project-member'
import { db } from '@/infra/database/drizzle/client'
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

describe('(E2E) - PUT /api/v1/projects/:projectId', () => {
  afterAll(async () => await app.close())

  it('deve atualizar um rascunho do autor', async () => {
    const { accessToken, user } = await authenticateUser()
    const { project } = await makeProjectOnDatabase({
      author: user.id,
      status: ProjectStatus.SKETCH,
    })

    const response = await request(app.server)
      .put(`/api/v1/projects/${project.id.toString()}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        title: 'Título atualizado',
        description: 'Descrição atualizada',
      })

    expect(response.status).toBe(200)
    expect(response.body.project.title).toBe('Título atualizado')
    expect(response.body.project.description).toBe('Descrição atualizada')
  })

  it('deve publicar o projeto alterando o status', async () => {
    const { accessToken, user } = await authenticateUser()
    const { project } = await makeProjectOnDatabase({
      author: user.id,
      status: ProjectStatus.SKETCH,
    })

    const response = await request(app.server)
      .put(`/api/v1/projects/${project.id.toString()}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        title: project.title,
        description: project.description,
        status: 'PUBLISHED',
      })

    expect(response.status).toBe(200)
    expect(response.body.project.status).toBe('PUBLISHED')
  })

  it('deve atualizar projeto que não é rascunho', async () => {
    const { accessToken, user } = await authenticateUser()
    const { project } = await makeProjectOnDatabase({
      author: user.id,
      status: ProjectStatus.SCHEDULED,
    })

    const response = await request(app.server)
      .put(`/api/v1/projects/${project.id.toString()}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        title: 'Novo',
        description: 'Novo',
        status: 'PUBLISHED',
      })

    expect(response.status).toBe(200)
    expect(response.body.project.status).toBe('PUBLISHED')
  })

  it('não deve atualizar projeto de outro autor', async () => {
    const { accessToken } = await authenticateUser()
    const { user: owner } = await makeUserOnDatabase()
    const { project } = await makeProjectOnDatabase({
      author: owner.id,
      status: ProjectStatus.SKETCH,
    })

    const response = await request(app.server)
      .put(`/api/v1/projects/${project.id.toString()}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        title: 'Hack',
        description: 'Hack',
      })

    expect(response.status).toBe(403)
  })


  it('deve permitir ao coautor que aceitou o convite editar o projeto', async () => {
    const { accessToken, user } = await authenticateUser()
    const { user: owner } = await makeUserOnDatabase()
    const { project } = await makeProjectOnDatabase({ author: owner.id, status: ProjectStatus.SKETCH })
    await makeProjectMemberOnDatabase({ projectId: project.id, userId: user.id, status: ProjectMemberStatus.ACCEPTED })

    const response = await request(app.server)
      .put(`/api/v1/projects/${project.id.toString()}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ title: 'Título do coautor', description: 'Descrição do coautor' })

    expect(response.status).toBe(200)
    expect(response.body.project.title).toBe('Título do coautor')

    const saved = await new DrizzleProjectsRepository(db).findById(project.id.toString())

    expect(saved?.title).toBe('Título do coautor')
  })

  it('deve permitir ao coautor enviar o mesmo status do projeto, sem alterá-lo', async () => {
    const { accessToken, user } = await authenticateUser()
    const { user: owner } = await makeUserOnDatabase()
    const { project } = await makeProjectOnDatabase({ author: owner.id, status: ProjectStatus.SCHEDULED })
    await makeProjectMemberOnDatabase({ projectId: project.id, userId: user.id, status: ProjectMemberStatus.ACCEPTED })

    const response = await request(app.server)
      .put(`/api/v1/projects/${project.id.toString()}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ title: 'Novo título', description: 'Nova descrição', status: 'SCHEDULED' })

    expect(response.status).toBe(200)
    expect(response.body.project.status).toBe('SCHEDULED')
  })

  it('não deve permitir ao coautor publicar o projeto, retornando 403 e nada muda', async () => {
    const { accessToken, user } = await authenticateUser()
    const { user: owner } = await makeUserOnDatabase()
    const { project } = await makeProjectOnDatabase({ author: owner.id, status: ProjectStatus.SKETCH })
    await makeProjectMemberOnDatabase({ projectId: project.id, userId: user.id, status: ProjectMemberStatus.ACCEPTED })

    const response = await request(app.server)
      .put(`/api/v1/projects/${project.id.toString()}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ title: 'Título que não deve ser gravado', description: project.description, status: 'PUBLISHED' })

    expect(response.status).toBe(403)
    expect(response.body.message).toBe('Somente o dono do projeto pode alterar o status')

    const saved = await new DrizzleProjectsRepository(db).findById(project.id.toString())

    expect(saved?.status).toBe(ProjectStatus.SKETCH)
    expect(saved?.title).toBe(project.title)
  })

  it('não deve permitir a quem tem convite pendente editar o projeto', async () => {
    const { accessToken, user } = await authenticateUser()
    const { user: owner } = await makeUserOnDatabase()
    const { project } = await makeProjectOnDatabase({ author: owner.id, status: ProjectStatus.SKETCH })
    await makeProjectMemberOnDatabase({ projectId: project.id, userId: user.id, status: ProjectMemberStatus.PENDING })

    const response = await request(app.server)
      .put(`/api/v1/projects/${project.id.toString()}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ title: 'Alteração indevida', description: 'Alteração indevida' })

    expect(response.status).toBe(403)
  })
})
