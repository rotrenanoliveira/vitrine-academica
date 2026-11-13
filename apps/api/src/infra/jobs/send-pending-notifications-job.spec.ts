import type { SendPendingNotificationsUseCase } from '@/domain/newsletter/application/use-cases/send-pending-notifications'
import { startSendPendingNotificationsJob } from './send-pending-notifications-job'

const webUrl = 'https://vitrine.exemplo.com'

function makeUseCase(sent = 0, failed = 0) {
  const execute = vi.fn().mockResolvedValue({
    isRight: () => true,
    value: { sent, failed },
  })

  return { execute, useCase: { execute } as unknown as SendPendingNotificationsUseCase }
}

describe('(Job) - Send Pending Notifications', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('deve enviar os pendentes assim que liga e depois a cada intervalo', async () => {
    const { execute, useCase } = makeUseCase()
    const stop = startSendPendingNotificationsJob({ sendPendingNotifications: useCase, webUrl, intervalInMs: 1000 })

    expect(execute).toHaveBeenCalledTimes(1)

    await vi.advanceTimersByTimeAsync(3000)

    expect(execute).toHaveBeenCalledTimes(4)

    stop()
  })

  it('deve passar o endereço do site para o envio', async () => {
    const { execute, useCase } = makeUseCase()
    const stop = startSendPendingNotificationsJob({ sendPendingNotifications: useCase, webUrl, intervalInMs: 1000 })

    expect(execute).toHaveBeenCalledWith({ webUrl })

    stop()
  })

  it('não deve começar uma nova rodada enquanto a anterior não terminou', async () => {
    let release: () => void = () => {}
    const execute = vi.fn().mockImplementation(
      () =>
        new Promise((resolve) => {
          release = () => resolve({ isRight: () => true, value: { sent: 0, failed: 0 } })
        }),
    )
    const useCase = { execute } as unknown as SendPendingNotificationsUseCase
    const stop = startSendPendingNotificationsJob({ sendPendingNotifications: useCase, webUrl, intervalInMs: 1000 })

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
      .mockResolvedValue({ isRight: () => true, value: { sent: 0, failed: 0 } })
    const useCase = { execute } as unknown as SendPendingNotificationsUseCase
    const stop = startSendPendingNotificationsJob({
      sendPendingNotifications: useCase,
      webUrl,
      intervalInMs: 1000,
      onError,
    })

    await vi.advanceTimersByTimeAsync(2000)

    expect(onError).toHaveBeenCalledTimes(1)
    expect(execute).toHaveBeenCalledTimes(3)

    stop()
  })

  it('deve avisar quantos e-mails foram enviados e quantos falharam', async () => {
    const { useCase } = makeUseCase(2, 1)
    const onSent = vi.fn()
    const stop = startSendPendingNotificationsJob({
      sendPendingNotifications: useCase,
      webUrl,
      intervalInMs: 1000,
      onSent,
    })

    await vi.advanceTimersByTimeAsync(0)

    expect(onSent).toHaveBeenCalledWith({ sent: 2, failed: 1 })

    stop()
  })

  it('não deve avisar quando não havia nada para enviar', async () => {
    const { useCase } = makeUseCase(0, 0)
    const onSent = vi.fn()
    const stop = startSendPendingNotificationsJob({
      sendPendingNotifications: useCase,
      webUrl,
      intervalInMs: 1000,
      onSent,
    })

    await vi.advanceTimersByTimeAsync(3000)

    expect(onSent).not.toHaveBeenCalled()

    stop()
  })

  it('deve parar de rodar quando mandarem parar', async () => {
    const { execute, useCase } = makeUseCase()
    const stop = startSendPendingNotificationsJob({ sendPendingNotifications: useCase, webUrl, intervalInMs: 1000 })

    stop()
    await vi.advanceTimersByTimeAsync(5000)

    expect(execute).toHaveBeenCalledTimes(1)
  })
})
