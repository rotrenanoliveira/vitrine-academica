import type { CloseExpiredCallsUseCase } from '@/domain/call/application/use-cases/call/close-expired-calls'
import { startCloseExpiredCallsJob } from './close-expired-calls-job'

function makeUseCase(total = 0, failures: { callId: string; error: unknown }[] = []) {
  const execute = vi.fn().mockResolvedValue({
    isRight: () => true,
    value: { calls: new Array(total).fill({}), failures },
  })

  return { execute, useCase: { execute } as unknown as CloseExpiredCallsUseCase }
}

describe('(Job) - Close Expired Calls', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('deve encerrar os vencidos assim que liga e depois a cada intervalo', async () => {
    const { execute, useCase } = makeUseCase()
    const stop = startCloseExpiredCallsJob({ closeExpiredCalls: useCase, intervalInMs: 1000 })

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
          release = () => resolve({ isRight: () => true, value: { calls: [], failures: [] } })
        }),
    )
    const useCase = { execute } as unknown as CloseExpiredCallsUseCase
    const stop = startCloseExpiredCallsJob({ closeExpiredCalls: useCase, intervalInMs: 1000 })

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
      .mockResolvedValue({ isRight: () => true, value: { calls: [], failures: [] } })
    const useCase = { execute } as unknown as CloseExpiredCallsUseCase
    const stop = startCloseExpiredCallsJob({ closeExpiredCalls: useCase, intervalInMs: 1000, onError })

    await vi.advanceTimersByTimeAsync(2000)

    expect(onError).toHaveBeenCalledTimes(1)
    expect(execute).toHaveBeenCalledTimes(3)

    stop()
  })

  it('deve avisar quantos chamados foram encerrados', async () => {
    const { useCase } = makeUseCase(2)
    const onClosed = vi.fn()
    const stop = startCloseExpiredCallsJob({ closeExpiredCalls: useCase, intervalInMs: 1000, onClosed })

    await vi.advanceTimersByTimeAsync(0)

    expect(onClosed).toHaveBeenCalledWith(2)

    stop()
  })

  it('não deve avisar quando nenhum chamado foi encerrado', async () => {
    const { useCase } = makeUseCase(0)
    const onClosed = vi.fn()
    const stop = startCloseExpiredCallsJob({ closeExpiredCalls: useCase, intervalInMs: 1000, onClosed })

    await vi.advanceTimersByTimeAsync(0)

    expect(onClosed).not.toHaveBeenCalled()

    stop()
  })

  it('deve avisar cada chamado que falhou ao encerrar', async () => {
    const error = new Error('falha de teste')
    const { useCase } = makeUseCase(1, [{ callId: 'call-1', error }])
    const onError = vi.fn()
    const stop = startCloseExpiredCallsJob({ closeExpiredCalls: useCase, intervalInMs: 1000, onError })

    await vi.advanceTimersByTimeAsync(0)

    expect(onError).toHaveBeenCalledWith(error, 'call-1')

    stop()
  })

  it('deve parar de rodar quando mandarem parar', async () => {
    const { execute, useCase } = makeUseCase()
    const stop = startCloseExpiredCallsJob({ closeExpiredCalls: useCase, intervalInMs: 1000 })

    stop()
    await vi.advanceTimersByTimeAsync(5000)

    expect(execute).toHaveBeenCalledTimes(1)
  })
})
