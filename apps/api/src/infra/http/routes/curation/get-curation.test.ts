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

type CurationEntry = { project: { id: string } }

type CreateProjectOptions = { status?: ProjectStatus; createdAt?: Date }

function getCuration(query = '') {
  return request(app.server).get(`/api/v1/curation${query}`)
}

function idsOf(entries: CurationEntry[]) {
  return entries.map((entry) => entry.project.id)
}

function monthsAgo(months: number) {
  const date = new Date()
  date.setMonth(date.getMonth() - months)

  return date
}

async function createProject({ status = ProjectStatus.PUBLISHED, createdAt }: CreateProjectOptions = {}) {
  const { user: author } = await makeUserOnDatabase()
  const { project } = await makeProjectOnDatabase({
    author: author.id,
    status,
    ...(createdAt ? { createdAt } : {}),
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

  it('curadoria: a banca deve ordenar os projetos pela nota média dos professores', async () => {
    const { project: average } = await createProject()
    const { project: best } = await createProject()
    const { project: worst } = await createProject()
    await rateByTeacher(average.id, 9)
    await rateByTeacher(average.id, 7)
    await rateByTeacher(best.id, 9.5)
    await rateByTeacher(worst.id, 6)

    const response = await getCuration()

    expect(response.status).toBe(200)
    expect(idsOf(response.body.board)).toEqual([best.id.toString(), average.id.toString(), worst.id.toString()])
    expect(response.body.board[0].project.status).toBe('PUBLISHED')
    expect(response.body.board[1].teacherAverage).toBe(8)
    expect(response.body.board[1].teacherRatingsCount).toBe(2)
  })

  it('curadoria: a banca deve desempatar pelo maior número de avaliações', async () => {
    const { project: withOne } = await createProject()
    const { project: withTwo } = await createProject()
    await rateByTeacher(withOne.id, 8)
    await rateByTeacher(withTwo.id, 8)
    await rateByTeacher(withTwo.id, 8)

    const response = await getCuration()

    expect(idsOf(response.body.board)).toEqual([withTwo.id.toString(), withOne.id.toString()])
  })

  it('curadoria: a comunidade deve ordenar os projetos pela soma dos pesos das estrelas', async () => {
    const { project: single } = await createProject()
    const { project: many } = await createProject()
    const { project: mixed } = await createProject()
    await starProject(single.id, 5)
    await starProject(many.id, 1)
    await starProject(many.id, 1)
    await starProject(many.id, 1)
    await starProject(mixed.id, 5)
    await starProject(mixed.id, 1)

    const response = await getCuration()

    expect(idsOf(response.body.community)).toEqual([mixed.id.toString(), single.id.toString(), many.id.toString()])
    expect(response.body.community[0].weightedScore).toBe(6)
    expect(response.body.community[0].starsCount).toBe(2)
    expect(response.body.community[2].weightedScore).toBe(3)
    expect(response.body.community[2].starsCount).toBe(3)
  })

  it('curadoria: as estrelas inativas não devem contar na comunidade', async () => {
    const { project: onlyInactive } = await createProject()
    const { project: mixed } = await createProject()
    await starProject(onlyInactive.id, 5, false)
    await starProject(mixed.id, 1)
    await starProject(mixed.id, 5, false)

    const response = await getCuration()

    expect(idsOf(response.body.community)).toEqual([mixed.id.toString()])
    expect(response.body.community[0].weightedScore).toBe(1)
    expect(response.body.community[0].starsCount).toBe(1)
  })

  it('curadoria: só os projetos publicados devem aparecer nas duas listas', async () => {
    const { project: published } = await createProject()
    const { project: draft } = await createProject({ status: ProjectStatus.SKETCH })
    await rateByTeacher(published.id, 8)
    await rateByTeacher(draft.id, 10)
    await starProject(published.id, 1)
    await starProject(draft.id, 5)

    const response = await getCuration()

    expect(idsOf(response.body.board)).toEqual([published.id.toString()])
    expect(idsOf(response.body.community)).toEqual([published.id.toString()])
  })

  it('curadoria: deve usar 3 meses como período padrão e aceitar outro período', async () => {
    const { project: recent } = await createProject()
    const { project: old } = await createProject({ createdAt: monthsAgo(4) })
    await rateByTeacher(recent.id, 7)
    await rateByTeacher(old.id, 9)

    const defaultResponse = await getCuration()
    const longerResponse = await getCuration('?months=6')

    expect(idsOf(defaultResponse.body.board)).toEqual([recent.id.toString()])
    expect(idsOf(longerResponse.body.board)).toEqual([old.id.toString(), recent.id.toString()])
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
    expect(idsOf(response.body.board)).toEqual([active.id.toString()])
    expect(idsOf(response.body.community)).toEqual([active.id.toString()])
  })

  it('curadoria: o limite deve restringir o tamanho das duas listas', async () => {
    const projects = []

    for (let index = 0; index < 3; index++) {
      const { project } = await createProject()
      await rateByTeacher(project.id, 9 - index)
      await starProject(project.id, 3 - index)
      projects.push(project)
    }

    const response = await getCuration('?limit=2')
    const expected = [projects[0].id.toString(), projects[1].id.toString()]

    expect(idsOf(response.body.board)).toEqual(expected)
    expect(idsOf(response.body.community)).toEqual(expected)
  })

  it('curadoria: sem avaliações, deve retornar as duas listas vazias', async () => {
    await createProject()

    const response = await getCuration()

    expect(response.status).toBe(200)
    expect(response.body).toEqual({ board: [], community: [] })
  })

  it.each(['months=0', 'months=13', 'limit=0', 'limit=51'])(
    'curadoria: com o parâmetro inválido %s, deve retornar 400',
    async (query) => {
      const response = await getCuration(`?${query}`)

      expect(response.status).toBe(400)
    },
  )
})
