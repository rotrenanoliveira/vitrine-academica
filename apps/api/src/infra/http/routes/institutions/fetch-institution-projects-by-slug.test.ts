import { appForTest as app } from '@tests/app'
import { makeInstitutionOnDatabase } from '@tests/factories/make-institution'
import { makeInstitutionMemberOnDatabase } from '@tests/factories/make-institution-member'
import { makeProjectOnDatabase } from '@tests/factories/make-project'
import { makeUserOnDatabase } from '@tests/factories/make-user'
import request from 'supertest'
import { UserStatus } from '@/domain/identity/enterprise/entities/user'
import {
  InstitutionMemberRole,
  InstitutionMemberStatus,
} from '@/domain/institution/enterprise/entities/institution-member'

describe('(E2E) - GET /api/v1/institutions/slug/:slug/projects', () => {
  afterAll(async () => await app.close())

  it('should return 404 when institution slug does not exist', async () => {
    const response = await request(app.server).get('/api/v1/institutions/slug/slug-inexistente/projects')

    expect(response.status).toBe(404)
    expect(response.body.message).toBe('Instituição não encontrada')
  })

  it('should list projects authored by ACTIVE institution members', async () => {
    const { user: registerBy } = await makeUserOnDatabase()
    const { institution } = await makeInstitutionOnDatabase({ registerBy: registerBy.id })
    const { user: activeMember } = await makeUserOnDatabase({ status: UserStatus.ACTIVE })
    const { project } = await makeProjectOnDatabase({
      author: activeMember.id,
      title: 'Projeto do membro ativo',
    })

    await makeInstitutionMemberOnDatabase({
      institutionId: institution.id.toString(),
      userId: activeMember.id.toString(),
      role: InstitutionMemberRole.STUDENT,
      status: InstitutionMemberStatus.ACTIVE,
    })

    const response = await request(app.server).get(`/api/v1/institutions/slug/${institution.slug.value}/projects`)

    expect(response.status).toBe(200)
    expect(response.body.total).toBe(1)
    expect(response.body.page).toBe(1)
    expect(response.body.limit).toBe(20)
    expect(response.body.projects[0].id).toBe(project.id.toString())
    expect(response.body.projects[0]).toEqual(
      expect.objectContaining({
        id: project.id.toString(),
        title: project.title,
        slug: project.slug,
        description: project.description,
        coverUrl: null,
        tags: expect.any(Array),
        createdAt: expect.any(String),
      }),
    )
  })

  it('should paginate institution projects with page and limit', async () => {
    const { user: registerBy } = await makeUserOnDatabase()
    const { institution } = await makeInstitutionOnDatabase({ registerBy: registerBy.id })
    const { user: activeMember } = await makeUserOnDatabase({ status: UserStatus.ACTIVE })

    await makeInstitutionMemberOnDatabase({
      institutionId: institution.id.toString(),
      userId: activeMember.id.toString(),
      role: InstitutionMemberRole.STUDENT,
      status: InstitutionMemberStatus.ACTIVE,
    })

    const { project: firstProject } = await makeProjectOnDatabase({
      author: activeMember.id,
      title: 'Projeto mais recente',
      createdAt: new Date('2026-03-02T00:00:00.000Z'),
    })
    await makeProjectOnDatabase({
      author: activeMember.id,
      title: 'Projeto mais antigo',
      createdAt: new Date('2026-03-01T00:00:00.000Z'),
    })

    const response = await request(app.server)
      .get(`/api/v1/institutions/slug/${institution.slug.value}/projects`)
      .query({ page: 1, limit: 1 })

    expect(response.status).toBe(200)
    expect(response.body.total).toBe(2)
    expect(response.body.page).toBe(1)
    expect(response.body.limit).toBe(1)
    expect(response.body.projects).toHaveLength(1)
    expect(response.body.projects[0].id).toBe(firstProject.id.toString())
  })

  it('should not list projects authored by former institution members', async () => {
    const { user: registerBy } = await makeUserOnDatabase()
    const { institution } = await makeInstitutionOnDatabase({ registerBy: registerBy.id })
    const { user: formerMember } = await makeUserOnDatabase({ status: UserStatus.ACTIVE })
    await makeProjectOnDatabase({
      author: formerMember.id,
      title: 'Projeto de membro antigo',
    })

    await makeInstitutionMemberOnDatabase({
      institutionId: institution.id.toString(),
      userId: formerMember.id.toString(),
      role: InstitutionMemberRole.STUDENT,
      status: InstitutionMemberStatus.FINISHED,
    })

    const response = await request(app.server).get(`/api/v1/institutions/slug/${institution.slug.value}/projects`)

    expect(response.status).toBe(200)
    expect(response.body.total).toBe(0)
    expect(response.body.page).toBe(1)
    expect(response.body.limit).toBe(20)
    expect(response.body.projects).toEqual([])
  })

  it('should list projects when author user is inactive but membership is ACTIVE', async () => {
    const { user: registerBy } = await makeUserOnDatabase()
    const { institution } = await makeInstitutionOnDatabase({ registerBy: registerBy.id })
    const { user: inactiveUser } = await makeUserOnDatabase({ status: UserStatus.INACTIVE })
    const { project } = await makeProjectOnDatabase({
      author: inactiveUser.id,
      title: 'Projeto de usuário inativo',
    })

    await makeInstitutionMemberOnDatabase({
      institutionId: institution.id.toString(),
      userId: inactiveUser.id.toString(),
      role: InstitutionMemberRole.STUDENT,
      status: InstitutionMemberStatus.ACTIVE,
    })

    const response = await request(app.server).get(`/api/v1/institutions/slug/${institution.slug.value}/projects`)

    expect(response.status).toBe(200)
    expect(response.body.total).toBe(1)
    expect(response.body.projects[0].id).toBe(project.id.toString())
  })
})
