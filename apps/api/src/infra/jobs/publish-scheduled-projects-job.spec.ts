import type { PublishScheduledProjectsUseCase } from '@/domain/project/application/use-cases/scheduled-project/publish-scheduled-projects'
import { startPublishScheduledProjectsJob } from './publish-scheduled-projects-job'

function makeUseCase(total = 0) {
  const execute = vi.fn().mockResolvedValue({
    isRight: () => true,
    value: { projects: new Array(total).fill({}) },
  })

  return { execute, useCase: { execute } as unknown as PublishScheduledProjectsUseCase }
}

describe('Agendador de publicação de projetos', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('deve publicar os vencidos assim que liga e depois a cada intervalo', async () => {
    const { execute, useCase } = makeUseCase()
    const stop = startPublishScheduledProjectsJob({ publishScheduledProjects: useCase, intervalInMs: 1000 })

    expect(execute).toHaveBeenCalledTimes(1)

    await vi.advanceTimersByTimeAsync(3000)

    expect(execute).toHaveBeenCalledTimes(4)

    stop()
  })

  it('não deve começar uma nova rodada enquanto a anterior não terminou', async () => {
    let release: () => void = () => {}
    const execute = vi.fn().mockImplementation(
      () =>
        new Promise((resolve) => {
          release = () => resolve({ isRight: () => true, value: { projects: [] } })
        }),
    )
    const useCase = { execute } as unknown as PublishScheduledProjectsUseCase
    const stop = startPublishScheduledProjectsJob({ publishScheduledProjects: useCase, intervalInMs: 1000 })

    await vi.advanceTimersByTimeAsync(3000)

    expect(execute).toHaveBeenCalledTimes(1)

    release()
    await vi.advanceTimersByTimeAsync(1000)

    expect(execute).toHaveBeenCalledTimes(2)

    stop()
  })

  it('deve continuar rodando depois de um erro e avisar', async () => {
    const onError = vi.fn()
    const execute = vi
      .fn()
      .mockRejectedValueOnce(new Error('falha de teste'))
      .mockResolvedValue({ isRight: () => true, value: { projects: [] } })
    const useCase = { execute } as unknown as PublishScheduledProjectsUseCase
    const stop = startPublishScheduledProjectsJob({
      publishScheduledProjects: useCase,
      intervalInMs: 1000,
      onError,
    })

    await vi.advanceTimersByTimeAsync(2000)

    expect(onError).toHaveBeenCalledTimes(1)
    expect(execute).toHaveBeenCalledTimes(3)

    stop()
  })

  it('deve avisar quantos projetos foram publicados', async () => {
    const { useCase } = makeUseCase(2)
    const onPublished = vi.fn()
    const stop = startPublishScheduledProjectsJob({
      publishScheduledProjects: useCase,
      intervalInMs: 1000,
      onPublished,
    })

    await vi.advanceTimersByTimeAsync(0)

    expect(onPublished).toHaveBeenCalledWith(2)

    stop()
  })

  it('deve parar de rodar quando mandarem parar', async () => {
    const { execute, useCase } = makeUseCase()
    const stop = startPublishScheduledProjectsJob({ publishScheduledProjects: useCase, intervalInMs: 1000 })

    stop()
    await vi.advanceTimersByTimeAsync(5000)

    expect(execute).toHaveBeenCalledTimes(1)
  })
})
