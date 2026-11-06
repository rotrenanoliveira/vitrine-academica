import { appForTest as app } from '@tests/app'
import { makeAccessCodeOnDatabase } from '@tests/factories/make-access-code'
import { makeAccountOnDatabase } from '@tests/factories/make-account'
import { makeProjectOnDatabase } from '@tests/factories/make-project'
import { makeProjectMemberOnDatabase } from '@tests/factories/make-project-member'
import { makeUserOnDatabase } from '@tests/factories/make-user'
import request from 'supertest'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { UserStatus } from '@/domain/identity/enterprise/entities/user'
import { ProjectStatus } from '@/domain/project/enterprise/entities/project'
import { ProjectMemberStatus } from '@/domain/project/enterprise/entities/project-member'
import { db } from '@/infra/database/drizzle/client'
import { DrizzleProjectMembersRepository } from '@/infra/database/repositories/drizzle-project-members-repository'

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

function invite(projectId: string, email: string, accessToken?: string) {
  const req = request(app.server).post(`/api/v1/projects/${projectId}/members`)

  return (accessToken ? req.set('Authorization', `Bearer ${accessToken}`) : req).send({ email })
}

describe('(E2E) - POST /api/v1/projects/:projectId/members', () => {
  afterAll(async () => await app.close())

  it('convidar membro: com dono e e-mail de usuário ativo, deve retornar 201 com convite pendente', async () => {
    const { accessToken, user } = await authenticateUser()
    const { user: guest } = await makeUserOnDatabase({ status: UserStatus.ACTIVE })
    const { project } = await makeProjectOnDatabase({ author: user.id, status: ProjectStatus.SKETCH })

    const response = await invite(project.id.toString(), guest.email, accessToken)

    expect(response.status).toBe(201)
    expect(response.body).toEqual({
      projectMember: {
        id: expect.any(String),
        projectId: project.id.toString(),
        userId: guest.id.toString(),
        status: 'PENDING',
        createdAt: expect.any(String),
      },
    })

    const saved = await new DrizzleProjectMembersRepository(db).findByProjectAndUser(
      project.id.toString(),
      guest.id.toString(),
    )

    expect(saved?.status).toBe(ProjectMemberStatus.PENDING)
  })

  it('convidar membro: sem token, deve retornar 401 e não criar convite', async () => {
    const { user } = await makeUserOnDatabase()
    const { user: guest } = await makeUserOnDatabase({ status: UserStatus.ACTIVE })
    const { project } = await makeProjectOnDatabase({ author: user.id, status: ProjectStatus.SKETCH })

    const response = await invite(project.id.toString(), guest.email)

    expect(response.status).toBe(401)
    expect(response.body.message).toBe('Não autenticado.')

    const saved = await new DrizzleProjectMembersRepository(db).findByProjectAndUser(
      project.id.toString(),
      guest.id.toString(),
    )

    expect(saved).toBeNull()
  })

  it('convidar membro: com projeto de outro usuário, deve retornar 403 e não criar convite', async () => {
    const { accessToken } = await authenticateUser()
    const { user: owner } = await makeUserOnDatabase()
    const { user: guest } = await makeUserOnDatabase({ status: UserStatus.ACTIVE })
    const { project } = await makeProjectOnDatabase({ author: owner.id, status: ProjectStatus.SKETCH })

    const response = await invite(project.id.toString(), guest.email, accessToken)

    expect(response.status).toBe(403)
    expect(response.body.message).toBe('Você não é o autor deste projeto.')

    const saved = await new DrizzleProjectMembersRepository(db).findByProjectAndUser(
      project.id.toString(),
      guest.id.toString(),
    )

    expect(saved).toBeNull()
  })

  it('convidar membro: com projeto inexistente, deve retornar 404 com mensagem', async () => {
    const { accessToken } = await authenticateUser()
    const { user: guest } = await makeUserOnDatabase({ status: UserStatus.ACTIVE })

    const response = await invite(new UniqueEntityId().toString(), guest.email, accessToken)

    expect(response.status).toBe(404)
    expect(response.body.message).toBe('Projeto não encontrado')
  })

  it('convidar membro: com e-mail sem usuário, deve retornar 404 com mensagem', async () => {
    const { accessToken, user } = await authenticateUser()
    const { project } = await makeProjectOnDatabase({ author: user.id, status: ProjectStatus.SKETCH })

    const response = await invite(project.id.toString(), 'ninguem@exemplo.com', accessToken)

    expect(response.status).toBe(404)
    expect(response.body.message).toBe('Usuário não encontrado')
  })

  it('convidar membro: com pessoa já convidada, deve retornar 409 com mensagem', async () => {
    const { accessToken, user } = await authenticateUser()
    const { user: guest } = await makeUserOnDatabase({ status: UserStatus.ACTIVE })
    const { project } = await makeProjectOnDatabase({ author: user.id, status: ProjectStatus.SKETCH })
    await makeProjectMemberOnDatabase({ projectId: project.id, userId: guest.id })

    const response = await invite(project.id.toString(), guest.email, accessToken)

    expect(response.status).toBe(409)
    expect(response.body.message).toBe('Esta pessoa já foi convidada para o projeto')
  })

  it('convidar membro: com o próprio dono, deve retornar 400 com mensagem', async () => {
    const { accessToken, user } = await authenticateUser()
    const { project } = await makeProjectOnDatabase({ author: user.id, status: ProjectStatus.SKETCH })

    const response = await invite(project.id.toString(), user.email, accessToken)

    expect(response.status).toBe(400)
    expect(response.body.message).toBe('O dono do projeto não pode ser convidado como membro')
  })

  it('convidar membro: com projeto arquivado, deve retornar 400 com mensagem', async () => {
    const { accessToken, user } = await authenticateUser()
    const { user: guest } = await makeUserOnDatabase({ status: UserStatus.ACTIVE })
    const { project } = await makeProjectOnDatabase({ author: user.id, status: ProjectStatus.ARCHIVED })

    const response = await invite(project.id.toString(), guest.email, accessToken)

    expect(response.status).toBe(400)
    expect(response.body.message).toBe('Não é possível convidar membros para um projeto arquivado')
  })

  it('convidar membro: com e-mail inválido, deve retornar 400', async () => {
    const { accessToken, user } = await authenticateUser()
    const { project } = await makeProjectOnDatabase({ author: user.id, status: ProjectStatus.SKETCH })

    const response = await invite(project.id.toString(), 'isso-nao-e-um-email', accessToken)

    expect(response.status).toBe(400)
  })

  it('convidar membro: reenviando para quem recusou, deve retornar 201 e voltar a pendente', async () => {
    const { accessToken, user } = await authenticateUser()
    const { user: guest } = await makeUserOnDatabase({ status: UserStatus.ACTIVE })
    const { project } = await makeProjectOnDatabase({ author: user.id, status: ProjectStatus.SKETCH })
    await makeProjectMemberOnDatabase({
      projectId: project.id,
      userId: guest.id,
      status: ProjectMemberStatus.REJECTED,
    })

    const response = await invite(project.id.toString(), guest.email, accessToken)

    expect(response.status).toBe(201)
    expect(response.body.projectMember.status).toBe('PENDING')

    const saved = await new DrizzleProjectMembersRepository(db).findByProjectAndUser(
      project.id.toString(),
      guest.id.toString(),
    )

    expect(saved?.status).toBe(ProjectMemberStatus.PENDING)
  })
})
