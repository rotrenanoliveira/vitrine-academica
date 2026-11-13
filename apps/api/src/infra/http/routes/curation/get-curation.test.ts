import { appForTest as app } from '@tests/app'
import { makeInstitutionOnDatabase } from '@tests/factories/make-institution'
import { makeInstitutionMemberOnDatabase } from '@tests/factories/make-institution-member'
import { makeProjectOnDatabase } from '@tests/factories/make-project'
import { makeProjectStarOnDatabase } from '@tests/factories/make-project-star'
import { makeProjectTeacherRatingOnDatabase } from '@tests/factories/make-project-teacher-rating'
import { makeUserOnDatabase } from '@tests/factories/make-user'
import request from 'supertest'
import type { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { InstitutionMemberStatus } from '@/domain/institution/enterprise/entities/institution-member'
import { ProjectStatus } from '@/domain/project/enterprise/entities/project'

type CreateProjectOptions = { status?: ProjectStatus; createdAt?: Date; title?: string }

function getCuration(query = '') {
  return request(app.server).get(`/api/v1/curation${query}`)
}

function idsOf(projects: Array<{ id: string }>) {
  return projects.map((project) => project.id)
}

function monthsAgo(months: number) {
  const date = new Date()
  date.setMonth(date.getMonth() - months)

  return date
}

async function createProject({ status = ProjectStatus.PUBLISHED, createdAt, title }: CreateProjectOptions = {}) {
  const { user: author } = await makeUserOnDatabase()
  const { project } = await makeProjectOnDatabase({
    author: author.id,
    status,
    ...(createdAt ? { createdAt } : {}),
    ...(title ? { title } : {}),
  })

  return { project, author }
}

async function rateByTeacher(projectId: UniqueEntityId, score: number) {
  const { user: teacher } = await makeUserOnDatabase()

  await makeProjectTeacherRatingOnDatabase({ projectId, teacherId: teacher.id, overallScore: score, items: [] })
}

async function starProject(projectId: UniqueEntityId, weight: number, active = true) {
  const { user } = await makeUserOnDatabase()

  await makeProjectStarOnDatabase({ projectId, userId: user.id, weight, active })
}

describe('(E2E) - GET /api/v1/curation', () => {
  afterAll(async () => await app.close())

  it('curadoria: a banca deve ordenar os projetos pelo createdAt desc', async () => {
    const { project: older } = await createProject({ createdAt: monthsAgo(1) })
    const { project: newer } = await createProject()
    await rateByTeacher(older.id, 9.5)
    await rateByTeacher(newer.id, 6)

    const response = await getCuration('?scope=board')

    expect(response.status).toBe(200)
    expect(idsOf(response.body.projects)).toEqual([newer.id.toString(), older.id.toString()])
    expect(response.body.projects[0]).toMatchObject({
      id: newer.id.toString(),
      title: newer.title,
      slug: newer.slug,
      coverUrl: null,
    })
    expect(response.body.total).toBe(2)
  })

  it('curadoria: a comunidade deve ordenar os projetos pelo createdAt desc', async () => {
    const { project: older } = await createProject({ createdAt: monthsAgo(1) })
    const { project: newer } = await createProject()
    await starProject(older.id, 5)
    await starProject(newer.id, 1)

    const response = await getCuration('?scope=community')

    expect(response.status).toBe(200)
    expect(idsOf(response.body.projects)).toEqual([newer.id.toString(), older.id.toString()])
  })

  it('curadoria: as estrelas inativas não devem contar na comunidade', async () => {
    const { project: onlyInactive } = await createProject()
    const { project: mixed } = await createProject()
    await starProject(onlyInactive.id, 5, false)
    await starProject(mixed.id, 1)
    await starProject(mixed.id, 5, false)

    const response = await getCuration('?scope=community')

    expect(idsOf(response.body.projects)).toEqual([mixed.id.toString()])
  })

  it('curadoria: só os projetos publicados devem aparecer', async () => {
    const { project: published } = await createProject()
    const { project: draft } = await createProject({ status: ProjectStatus.SKETCH })
    await rateByTeacher(published.id, 8)
    await rateByTeacher(draft.id, 10)
    await starProject(published.id, 1)
    await starProject(draft.id, 5)

    const boardResponse = await getCuration('?scope=board')
    const communityResponse = await getCuration('?scope=community')

    expect(idsOf(boardResponse.body.projects)).toEqual([published.id.toString()])
    expect(idsOf(communityResponse.body.projects)).toEqual([published.id.toString()])
  })

  it('curadoria: deve usar 3 meses como período padrão e aceitar outro período', async () => {
    const { project: recent } = await createProject()
    const { project: old } = await createProject({ createdAt: monthsAgo(4) })
    await rateByTeacher(recent.id, 7)
    await rateByTeacher(old.id, 9)

    const defaultResponse = await getCuration('?scope=board')
    const longerResponse = await getCuration('?scope=board&months=6')

    expect(idsOf(defaultResponse.body.projects)).toEqual([recent.id.toString()])
    expect(idsOf(longerResponse.body.projects)).toEqual([recent.id.toString(), old.id.toString()])
  })

  it('curadoria: o filtro de instituição deve trazer só autores com vínculo ativo', async () => {
    const { institution } = await makeInstitutionOnDatabase({ registerBy: (await makeUserOnDatabase()).user.id })
    const { project: active, author: activeAuthor } = await createProject()
    const { project: pending, author: pendingAuthor } = await createProject()
    const { project: outsider } = await createProject()

    await makeInstitutionMemberOnDatabase({
      institutionId: institution.id.toString(),
      userId: activeAuthor.id.toString(),
      status: InstitutionMemberStatus.ACTIVE,
    })
    await makeInstitutionMemberOnDatabase({
      institutionId: institution.id.toString(),
      userId: pendingAuthor.id.toString(),
      status: InstitutionMemberStatus.PENDING,
    })

    for (const project of [active, pending, outsider]) {
      await rateByTeacher(project.id, 8)
      await starProject(project.id, 1)
    }

    const response = await getCuration(`?institutionId=${institution.id.toString()}`)

    expect(response.status).toBe(200)
    expect(idsOf(response.body.projects)).toEqual([active.id.toString()])
  })

  it('curadoria: o limite deve restringir o tamanho da lista', async () => {
    const created = []

    for (let index = 0; index < 3; index++) {
      const { project } = await createProject({ createdAt: new Date(Date.now() - index * 60_000) })
      await rateByTeacher(project.id, 8)
      created.push(project)
    }

    const response = await getCuration('?scope=board&limit=2')

    expect(idsOf(response.body.projects)).toEqual([created[0].id.toString(), created[1].id.toString()])
    expect(response.body.total).toBe(2)
  })

  it('curadoria: sem avaliações, deve retornar lista vazia', async () => {
    await createProject()

    const response = await getCuration()

    expect(response.status).toBe(200)
    expect(response.body).toEqual({ total: 0, projects: [] })
  })

  it('curadoria: scope=all deve unir banca e comunidade sem duplicar', async () => {
    const { project: both } = await createProject()
    const { project: onlyBoard } = await createProject({ createdAt: monthsAgo(1) })
    const { project: onlyCommunity } = await createProject({ createdAt: monthsAgo(2) })

    await rateByTeacher(both.id, 8)
    await starProject(both.id, 1)
    await rateByTeacher(onlyBoard.id, 8)
    await starProject(onlyCommunity.id, 1)

    const response = await getCuration('?scope=all')

    expect(response.status).toBe(200)
    expect(idsOf(response.body.projects)).toEqual([
      both.id.toString(),
      onlyBoard.id.toString(),
      onlyCommunity.id.toString(),
    ])
  })

  it('curadoria: deve filtrar por título', async () => {
    const { project: match } = await createProject({ title: 'Robótica Avançada' })
    const { project: other } = await createProject({ title: 'História Medieval' })
    await rateByTeacher(match.id, 8)
    await rateByTeacher(other.id, 8)

    const response = await getCuration('?scope=board&title=robótica')

    expect(idsOf(response.body.projects)).toEqual([match.id.toString()])
  })

  it.each(['months=0', 'months=13', 'limit=0', 'limit=51', 'scope=invalid'])(
    'curadoria: com o parâmetro inválido %s, deve retornar 400',
    async (query) => {
      const response = await getCuration(`?${query}`)

      expect(response.status).toBe(400)
    },
  )
})
