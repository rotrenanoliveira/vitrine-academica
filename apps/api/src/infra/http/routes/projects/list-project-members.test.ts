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

function listMembers(projectId: string, accessToken?: string) {
  const req = request(app.server).get(`/api/v1/projects/${projectId}/members`)

  return accessToken ? req.set('Authorization', `Bearer ${accessToken}`) : req
}

async function addMember(projectId: UniqueEntityId, status: ProjectMemberStatus, name: string) {
  const { user } = await makeUserOnDatabase({ name, status: UserStatus.ACTIVE })
  const { projectMember } = await makeProjectMemberOnDatabase({ projectId, userId: user.id, status })

  return { user, projectMember }
}

describe('(E2E) - GET /api/v1/projects/:projectId/members', () => {
  afterAll(async () => await app.close())

  it('listar membros: como outra pessoa em projeto publicado, deve retornar 200 só com quem aceitou', async () => {
    const { accessToken } = await authenticateUser()
    const { user: owner } = await makeUserOnDatabase()
    const { project } = await makeProjectOnDatabase({ author: owner.id, status: ProjectStatus.PUBLISHED })
    await addMember(project.id, ProjectMemberStatus.PENDING, 'Pessoa Pendente')
    const accepted = await addMember(project.id, ProjectMemberStatus.ACCEPTED, 'Pessoa Aceita')
    await addMember(project.id, ProjectMemberStatus.REJECTED, 'Pessoa Recusada')

    const response = await listMembers(project.id.toString(), accessToken)

    expect(response.status).toBe(200)
    expect(response.body.members).toEqual([
      {
        id: accepted.projectMember.id.toString(),
        userId: accepted.user.id.toString(),
        name: 'Pessoa Aceita',
        status: 'ACCEPTED',
        createdAt: expect.any(String),
      },
    ])
  })

  it('listar membros: como outra pessoa em projeto não publicado, deve retornar 404', async () => {
    const { accessToken } = await authenticateUser()
    const { user: owner } = await makeUserOnDatabase()
    const { project } = await makeProjectOnDatabase({ author: owner.id, status: ProjectStatus.SKETCH })
    await addMember(project.id, ProjectMemberStatus.ACCEPTED, 'Pessoa Aceita')

    const response = await listMembers(project.id.toString(), accessToken)

    expect(response.status).toBe(404)
    expect(response.body.message).toBe('Projeto não encontrado')
  })

  it('listar membros: com projeto inexistente, deve retornar 404 com mensagem', async () => {
    const { accessToken } = await authenticateUser()

    const response = await listMembers(new UniqueEntityId().toString(), accessToken)

    expect(response.status).toBe(404)
    expect(response.body.message).toBe('Projeto não encontrado')
  })

  it('listar membros: sem token, deve retornar 401', async () => {
    const { user: owner } = await makeUserOnDatabase()
    const { project } = await makeProjectOnDatabase({ author: owner.id, status: ProjectStatus.PUBLISHED })

    const response = await listMembers(project.id.toString())

    expect(response.status).toBe(401)
    expect(response.body.message).toBe('Não autenticado.')
  })

  it('listar membros: deve mostrar o nome de cada membro e nunca o e-mail', async () => {
    const { accessToken, user } = await authenticateUser()
    const { project } = await makeProjectOnDatabase({ author: user.id, status: ProjectStatus.PUBLISHED })
    await addMember(project.id, ProjectMemberStatus.ACCEPTED, 'Pessoa Aceita')

    const response = await listMembers(project.id.toString(), accessToken)

    expect(response.status).toBe(200)
    expect(response.body.members[0].name).toBe('Pessoa Aceita')
    expect(response.body.members[0]).not.toHaveProperty('email')
  })

  it('listar membros: com projeto sem membros, deve retornar 200 com lista vazia', async () => {
    const { accessToken, user } = await authenticateUser()
    const { project } = await makeProjectOnDatabase({ author: user.id, status: ProjectStatus.PUBLISHED })

    const response = await listMembers(project.id.toString(), accessToken)

    expect(response.status).toBe(200)
    expect(response.body).toEqual({ members: [] })
  })

  it('listar membros: como dono, deve retornar 200 com os coautores e os pendentes, sem os recusados', async () => {
    const { accessToken, user } = await authenticateUser()
    const { project } = await makeProjectOnDatabase({ author: user.id, status: ProjectStatus.SKETCH })
    await addMember(project.id, ProjectMemberStatus.PENDING, 'Pessoa Pendente')
    await addMember(project.id, ProjectMemberStatus.ACCEPTED, 'Pessoa Aceita')
    await addMember(project.id, ProjectMemberStatus.REJECTED, 'Pessoa Recusada')

    const response = await listMembers(project.id.toString(), accessToken)

    expect(response.status).toBe(200)
    expect(response.body.members).toHaveLength(2)
    expect(response.body.members.map((member: { status: string }) => member.status).sort()).toEqual([
      'ACCEPTED',
      'PENDING',
    ])
  })
})
