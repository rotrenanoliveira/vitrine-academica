import type { AdvanceDueEventPhasesUseCase } from '@/domain/event/application/use-cases/event/advance-due-event-phases'
import { startAdvanceEventPhaseJob } from './advance-event-phase-job'

function makeUseCase(closedThemeSelection = 0, closedEvents = 0) {
  const execute = vi.fn().mockResolvedValue({
    isRight: () => true,
    value: {
      closedThemeSelection: new Array(closedThemeSelection).fill({}),
      closedEvents: new Array(closedEvents).fill({}),
    },
  })

  return { execute, useCase: { execute } as unknown as AdvanceDueEventPhasesUseCase }
}

describe('Agendador de avanço de fases de eventos', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should be able to run immediately and on each interval', async () => {
    const { execute, useCase } = makeUseCase()
    const stop = startAdvanceEventPhaseJob({ advanceDueEventPhases: useCase, intervalInMs: 1000 })

    expect(execute).toHaveBeenCalledTimes(1)

    await vi.advanceTimersByTimeAsync(3000)

    expect(execute).toHaveBeenCalledTimes(4)

    stop()
  })

  it('should not be able to overlap running executions', async () => {
    let release: () => void = () => {}
    const execute = vi.fn().mockImplementation(
      () =>
        new Promise((resolve) => {
          release = () =>
            resolve({
              isRight: () => true,
              value: { closedThemeSelection: [], closedEvents: [] },
            })
        }),
    )
    const useCase = { execute } as unknown as AdvanceDueEventPhasesUseCase
    const stop = startAdvanceEventPhaseJob({ advanceDueEventPhases: useCase, intervalInMs: 1000 })

    await vi.advanceTimersByTimeAsync(3000)
    expect(execute).toHaveBeenCalledTimes(1)

    release()
    await vi.advanceTimersByTimeAsync(1000)
    expect(execute).toHaveBeenCalledTimes(2)

    stop()
  })

  it('should be able to keep running after an error', async () => {
    const onError = vi.fn()
    const execute = vi
      .fn()
      .mockRejectedValueOnce(new Error('falha'))
      .mockResolvedValue({
        isRight: () => true,
        value: { closedThemeSelection: [], closedEvents: [] },
      })
    const useCase = { execute } as unknown as AdvanceDueEventPhasesUseCase
    const stop = startAdvanceEventPhaseJob({
      advanceDueEventPhases: useCase,
      intervalInMs: 1000,
      onError,
    })

    await vi.advanceTimersByTimeAsync(2000)

    expect(onError).toHaveBeenCalledTimes(1)
    expect(execute).toHaveBeenCalledTimes(3)

    stop()
  })

  it('should be able to report advanced phases', async () => {
    const { useCase } = makeUseCase(1, 2)
    const onAdvanced = vi.fn()
    const stop = startAdvanceEventPhaseJob({
      advanceDueEventPhases: useCase,
      intervalInMs: 1000,
      onAdvanced,
    })

    await vi.advanceTimersByTimeAsync(0)

    expect(onAdvanced).toHaveBeenCalledWith({ closedThemeSelection: 1, closedEvents: 2 })

    stop()
  })
})
