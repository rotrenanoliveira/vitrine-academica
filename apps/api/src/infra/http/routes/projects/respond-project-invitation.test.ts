import { appForTest as app } from '@tests/app'
import { makeAccessCodeOnDatabase } from '@tests/factories/make-access-code'
import { makeAccountOnDatabase } from '@tests/factories/make-account'
import { makeProjectOnDatabase } from '@tests/factories/make-project'
import { makeProjectMemberOnDatabase } from '@tests/factories/make-project-member'
import { makeUserOnDatabase } from '@tests/factories/make-user'
import request from 'supertest'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
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

function respond(invitationId: string, status: string, accessToken?: string) {
  const req = request(app.server).post(`/api/v1/projects/invitations/${invitationId}/respond`)

  return (accessToken ? req.set('Authorization', `Bearer ${accessToken}`) : req).send({ status })
}

// Cria um projeto de outro dono e um convite pendente para a pessoa informada
async function createInvitation(
  guestId: UniqueEntityId,
  projectStatus: ProjectStatus = ProjectStatus.SKETCH,
  memberStatus: ProjectMemberStatus = ProjectMemberStatus.PENDING,
) {
  const { user: owner } = await makeUserOnDatabase()
  const { project } = await makeProjectOnDatabase({ author: owner.id, status: projectStatus })
  const { projectMember } = await makeProjectMemberOnDatabase({
    projectId: project.id,
    userId: guestId,
    status: memberStatus,
  })

  return { project, projectMember }
}

async function findInvitation(invitationId: string) {
  return new DrizzleProjectMembersRepository(db).findById(invitationId)
}

describe('(E2E) - POST /api/v1/projects/invitations/:invitationId/respond', () => {
  afterAll(async () => await app.close())

  it('responder convite: aceitando como a pessoa convidada, deve retornar 200 e gravar aceito', async () => {
    const { accessToken, user } = await authenticateUser()
    const { projectMember } = await createInvitation(user.id)

    const response = await respond(projectMember.id.toString(), 'ACCEPTED', accessToken)

    expect(response.status).toBe(200)
    expect(response.body.projectMember.id).toBe(projectMember.id.toString())
    expect(response.body.projectMember.status).toBe('ACCEPTED')

    const saved = await findInvitation(projectMember.id.toString())

    expect(saved?.status).toBe(ProjectMemberStatus.ACCEPTED)
  })

  it('responder convite: recusando como a pessoa convidada, deve retornar 200 e gravar recusado', async () => {
    const { accessToken, user } = await authenticateUser()
    const { projectMember } = await createInvitation(user.id)

    const response = await respond(projectMember.id.toString(), 'REJECTED', accessToken)

    expect(response.status).toBe(200)
    expect(response.body.projectMember.status).toBe('REJECTED')

    const saved = await findInvitation(projectMember.id.toString())

    expect(saved?.status).toBe(ProjectMemberStatus.REJECTED)
  })

  it('responder convite: sem token, deve retornar 401 e manter o convite pendente', async () => {
    const { user } = await makeUserOnDatabase()
    const { projectMember } = await createInvitation(user.id)

    const response = await respond(projectMember.id.toString(), 'ACCEPTED')

    expect(response.status).toBe(401)
    expect(response.body.message).toBe('Não autenticado.')

    const saved = await findInvitation(projectMember.id.toString())

    expect(saved?.status).toBe(ProjectMemberStatus.PENDING)
  })

  it('responder convite: por outra pessoa, deve retornar 403 e manter o convite pendente', async () => {
    const { accessToken } = await authenticateUser()
    const { user: guest } = await makeUserOnDatabase()
    const { projectMember } = await createInvitation(guest.id)

    const response = await respond(projectMember.id.toString(), 'ACCEPTED', accessToken)

    expect(response.status).toBe(403)
    expect(response.body.message).toBe('Este convite não é para você')

    const saved = await findInvitation(projectMember.id.toString())

    expect(saved?.status).toBe(ProjectMemberStatus.PENDING)
  })

  it('responder convite: com convite inexistente, deve retornar 404 com mensagem', async () => {
    const { accessToken } = await authenticateUser()

    const response = await respond(new UniqueEntityId().toString(), 'ACCEPTED', accessToken)

    expect(response.status).toBe(404)
    expect(response.body.message).toBe('Convite não encontrado')
  })

  it('responder convite: com convite já respondido, deve retornar 409 com mensagem', async () => {
    const { accessToken, user } = await authenticateUser()
    const { projectMember } = await createInvitation(user.id, ProjectStatus.SKETCH, ProjectMemberStatus.ACCEPTED)

    const response = await respond(projectMember.id.toString(), 'REJECTED', accessToken)

    expect(response.status).toBe(409)
    expect(response.body.message).toBe('Este convite já foi respondido')

    const saved = await findInvitation(projectMember.id.toString())

    expect(saved?.status).toBe(ProjectMemberStatus.ACCEPTED)
  })

  it('responder convite: com projeto arquivado, deve retornar 400 com mensagem', async () => {
    const { accessToken, user } = await authenticateUser()
    const { projectMember } = await createInvitation(user.id, ProjectStatus.ARCHIVED)

    const response = await respond(projectMember.id.toString(), 'ACCEPTED', accessToken)

    expect(response.status).toBe(400)
    expect(response.body.message).toBe('Não é possível responder ao convite de um projeto arquivado')
  })

  it('responder convite: com resposta inválida, deve retornar 400 e manter o convite pendente', async () => {
    const { accessToken, user } = await authenticateUser()
    const { projectMember } = await createInvitation(user.id)

    const response = await respond(projectMember.id.toString(), 'PENDING', accessToken)

    expect(response.status).toBe(400)

    const saved = await findInvitation(projectMember.id.toString())

    expect(saved?.status).toBe(ProjectMemberStatus.PENDING)
  })
})