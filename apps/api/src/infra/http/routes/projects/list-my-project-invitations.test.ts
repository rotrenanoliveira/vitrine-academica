import { appForTest as app } from '@tests/app'
import { makeAccessCodeOnDatabase } from '@tests/factories/make-access-code'
import { makeAccountOnDatabase } from '@tests/factories/make-account'
import { makeProjectOnDatabase } from '@tests/factories/make-project'
import { makeProjectMemberOnDatabase } from '@tests/factories/make-project-member'
import { makeUserOnDatabase } from '@tests/factories/make-user'
import request from 'supertest'
import type { UniqueEntityId } from '@/core/entities/unique-entity-id'
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

async function createInvitation(
  guestId: UniqueEntityId,
  memberStatus: ProjectMemberStatus = ProjectMemberStatus.PENDING,
) {
  const { user: owner } = await makeUserOnDatabase({ name: 'Dono do Projeto' })
  const { project } = await makeProjectOnDatabase({ author: owner.id, title: 'Projeto de teste' })
  const { projectMember } = await makeProjectMemberOnDatabase({
    projectId: project.id,
    userId: guestId,
    status: memberStatus,
  })

  return { owner, project, projectMember }
}

describe('(E2E) - GET /api/v1/projects/invitations/me', () => {
  afterAll(async () => await app.close())

  it('meus convites: com um convite de outro dono, deve retornar 200 com o projeto e o dono', async () => {
    const { accessToken, user } = await authenticateUser()
    const { owner, project, projectMember } = await createInvitation(user.id)

    const response = await request(app.server)
      .get('/api/v1/projects/invitations/me')
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.status).toBe(200)
    expect(response.body).toEqual({
      invitations: [
        {
          id: projectMember.id.toString(),
          status: 'PENDING',
          createdAt: expect.any(String),
          project: {
            id: project.id.toString(),
            title: 'Projeto de teste',
            slug: project.slug,
          },
          owner: {
            id: owner.id.toString(),
            name: 'Dono do Projeto',
          },
        },
      ],
    })
  })

  it('meus convites: filtrando por pendentes, deve retornar 200 só com os pendentes', async () => {
    const { accessToken, user } = await authenticateUser()
    const pending = await createInvitation(user.id, ProjectMemberStatus.PENDING)
    await createInvitation(user.id, ProjectMemberStatus.ACCEPTED)

    const response = await request(app.server)
      .get('/api/v1/projects/invitations/me?status=PENDING')
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.status).toBe(200)
    expect(response.body.invitations).toHaveLength(1)
    expect(response.body.invitations[0].id).toBe(pending.projectMember.id.toString())
  })

  it('meus convites: com convites de outras pessoas, deve retornar 200 sem mostrá-los', async () => {
    const { accessToken, user } = await authenticateUser()
    const { user: stranger } = await makeUserOnDatabase()
    const mine = await createInvitation(user.id)
    await createInvitation(stranger.id)

    const response = await request(app.server)
      .get('/api/v1/projects/invitations/me')
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.status).toBe(200)
    expect(response.body.invitations).toHaveLength(1)
    expect(response.body.invitations[0].id).toBe(mine.projectMember.id.toString())
  })

  it('meus convites: sem token, deve retornar 401', async () => {
    const response = await request(app.server).get('/api/v1/projects/invitations/me')

    expect(response.status).toBe(401)
    expect(response.body.message).toBe('Não autenticado.')
  })

  it('meus convites: sem nenhum convite, deve retornar 200 com lista vazia', async () => {
    const { accessToken } = await authenticateUser()

    const response = await request(app.server)
      .get('/api/v1/projects/invitations/me')
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.status).toBe(200)
    expect(response.body).toEqual({ invitations: [] })
  })
})
