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

  it('deve devolver a lista da banca e a lista da comunidade', async () => {
    const { project: boardProject } = makeProject()
    const { project: communityProject } = makeProject()
    curationRepository.teacherEntries.push({ project: boardProject, teacherAverage: 9.5, teacherRatingsCount: 2 })
    curationRepository.communityEntries.push({ project: communityProject, weightedScore: 12, starsCount: 4 })

    const result = await sut.execute({ now })

    expect(result.isRight()).toBeTruthy()

    if (result.isRight()) {
      expect(result.value.board).toHaveLength(1)
      expect(result.value.board[0].project.id.toString()).toBe(boardProject.id.toString())
      expect(result.value.community).toHaveLength(1)
      expect(result.value.community[0].project.id.toString()).toBe(communityProject.id.toString())
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

  it('deve repassar o filtro de instituição aos dois rankings', async () => {
    await sut.execute({ now, institutionId: 'instituicao-1' })

    expect(curationRepository.lastTeacherFilters?.institutionId).toBe('instituicao-1')
    expect(curationRepository.lastCommunityFilters?.institutionId).toBe('instituicao-1')
  })

  it('deve usar 10 como limite padrão', async () => {
    await sut.execute({ now })

    expect(curationRepository.lastTeacherFilters?.limit).toBe(10)
    expect(curationRepository.lastCommunityFilters?.limit).toBe(10)
  })

  it('deve repassar o limite informado', async () => {
    await sut.execute({ now, limit: 5 })

    expect(curationRepository.lastTeacherFilters?.limit).toBe(5)
    expect(curationRepository.lastCommunityFilters?.limit).toBe(5)
  })

  it('deve respeitar o limite nas listas devolvidas', async () => {
    for (let index = 0; index < 3; index++) {
      const { project } = makeProject()
      curationRepository.teacherEntries.push({ project, teacherAverage: 8, teacherRatingsCount: 1 })
      curationRepository.communityEntries.push({ project, weightedScore: 5, starsCount: 1 })
    }

    const result = await sut.execute({ now, limit: 2 })

    if (result.isRight()) {
      expect(result.value.board).toHaveLength(2)
      expect(result.value.community).toHaveLength(2)
    }
  })
})
