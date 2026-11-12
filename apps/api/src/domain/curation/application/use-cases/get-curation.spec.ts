import { makeProject } from '@tests/factories/make-project'
import { InMemoryCurationRepository } from '@tests/repositories/in-memory-curation-repository'
import { GetCurationUseCase } from './get-curation'

let curationRepository: InMemoryCurationRepository
let sut: GetCurationUseCase

const now = new Date('2026-11-10T12:00:00.000Z')

describe('(UC) - Get Curation', () => {
  beforeEach(() => {
    curationRepository = new InMemoryCurationRepository()
    sut = new GetCurationUseCase(curationRepository)
  })

  it('deve devolver a união da banca e da comunidade quando scope=all', async () => {
    const { project: boardProject } = makeProject({ createdAt: new Date('2026-11-01T12:00:00.000Z') })
    const { project: communityProject } = makeProject({ createdAt: new Date('2026-11-05T12:00:00.000Z') })
    curationRepository.teacherProjects.push(boardProject)
    curationRepository.communityProjects.push(communityProject)

    const result = await sut.execute({ now, scope: 'all' })

    expect(result.isRight()).toBeTruthy()

    if (result.isRight()) {
      expect(result.value.projects).toHaveLength(2)
      expect(result.value.projects[0].id.toString()).toBe(communityProject.id.toString())
      expect(result.value.projects[1].id.toString()).toBe(boardProject.id.toString())
    }
  })

  it('deve devolver só a banca quando scope=board', async () => {
    const { project: boardProject } = makeProject()
    const { project: communityProject } = makeProject()
    curationRepository.teacherProjects.push(boardProject)
    curationRepository.communityProjects.push(communityProject)

    const result = await sut.execute({ now, scope: 'board' })

    expect(result.isRight()).toBeTruthy()

    if (result.isRight()) {
      expect(result.value.projects).toHaveLength(1)
      expect(result.value.projects[0].id.toString()).toBe(boardProject.id.toString())
    }
  })

  it('deve devolver só a comunidade quando scope=community', async () => {
    const { project: boardProject } = makeProject()
    const { project: communityProject } = makeProject()
    curationRepository.teacherProjects.push(boardProject)
    curationRepository.communityProjects.push(communityProject)

    const result = await sut.execute({ now, scope: 'community' })

    expect(result.isRight()).toBeTruthy()

    if (result.isRight()) {
      expect(result.value.projects).toHaveLength(1)
      expect(result.value.projects[0].id.toString()).toBe(communityProject.id.toString())
    }
  })

  it('deve deduplicar projetos presentes na banca e na comunidade', async () => {
    const { project } = makeProject()
    curationRepository.teacherProjects.push(project)
    curationRepository.communityProjects.push(project)

    const result = await sut.execute({ now, scope: 'all' })

    if (result.isRight()) {
      expect(result.value.projects).toHaveLength(1)
      expect(result.value.projects[0].id.toString()).toBe(project.id.toString())
    }
  })



  it('deve usar 3 meses como período padrão', async () => {
    await sut.execute({ now })

    expect(curationRepository.lastTeacherFilters?.since.toISOString()).toBe('2026-08-10T12:00:00.000Z')
    expect(curationRepository.lastCommunityFilters?.since.toISOString()).toBe('2026-08-10T12:00:00.000Z')
  })

  it('deve usar o período informado em meses', async () => {
    await sut.execute({ now, months: 6 })

    expect(curationRepository.lastTeacherFilters?.since.toISOString()).toBe('2026-05-10T12:00:00.000Z')
    expect(curationRepository.lastCommunityFilters?.since.toISOString()).toBe('2026-05-10T12:00:00.000Z')
  })

  it('deve repassar o filtro de instituição', async () => {
    await sut.execute({ now, institutionId: 'instituicao-1' })

    expect(curationRepository.lastTeacherFilters?.institutionId).toBe('instituicao-1')
    expect(curationRepository.lastCommunityFilters?.institutionId).toBe('instituicao-1')
  })

  it('deve repassar title e tagIds', async () => {
    await sut.execute({ now, title: '  Robótica  ', tagIds: ['tag-1'] })

    expect(curationRepository.lastTeacherFilters?.title).toBe('Robótica')
    expect(curationRepository.lastTeacherFilters?.tagIds).toEqual(['tag-1'])
    expect(curationRepository.lastCommunityFilters?.title).toBe('Robótica')
    expect(curationRepository.lastCommunityFilters?.tagIds).toEqual(['tag-1'])
  })

  it('não deve aplicar limite por padrão', async () => {
    await sut.execute({ now })

    expect(curationRepository.lastTeacherFilters?.limit).toBeUndefined()
    expect(curationRepository.lastCommunityFilters?.limit).toBeUndefined()
  })

  it('deve respeitar o limite na lista final', async () => {
    for (let index = 0; index < 3; index++) {
      const { project } = makeProject({
        createdAt: new Date(`2026-11-0${index + 1}T12:00:00.000Z`),
      })
      curationRepository.teacherProjects.push(project)
      curationRepository.communityProjects.push(project)
    }

    const result = await sut.execute({ now, limit: 2 })

    if (result.isRight()) {
      expect(result.value.projects).toHaveLength(2)
    }
  })
})
