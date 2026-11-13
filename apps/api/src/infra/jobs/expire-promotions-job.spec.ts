import { makePromotion } from '@tests/factories/make-promotion'
import { right } from '@/core/either'
import type { ExpireDuePromotionsUseCase } from '@/domain/points/application/use-cases/promotion/expire-due-promotions'
import { startExpirePromotionsJob } from './expire-promotions-job'

const INTERVAL_IN_MS = 30_000

function makeUseCase(execute: ReturnType<typeof vi.fn>) {
  return { execute } as unknown as ExpireDuePromotionsUseCase
}

describe('Expire Promotions Job', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should run right after starting and report how many promotions were expired', async () => {
    const execute = vi.fn().mockResolvedValue(right({ expiredPromotions: [makePromotion().promotion] }))
    const onExpired = vi.fn()

    const stop = startExpirePromotionsJob({ expireDuePromotions: makeUseCase(execute), onExpired })

    await vi.advanceTimersByTimeAsync(0)

    expect(execute).toHaveBeenCalledTimes(1)
    expect(onExpired).toHaveBeenCalledWith(1)

    stop()
  })

  it('should not report anything when no promotion was expired', async () => {
    const execute = vi.fn().mockResolvedValue(right({ expiredPromotions: [] }))
    const onExpired = vi.fn()

    const stop = startExpirePromotionsJob({ expireDuePromotions: makeUseCase(execute), onExpired })

    await vi.advanceTimersByTimeAsync(INTERVAL_IN_MS)

    expect(execute).toHaveBeenCalledTimes(2)
    expect(onExpired).not.toHaveBeenCalled()

    stop()
  })

  it('should report the error and keep running when a run fails', async () => {
    const error = new Error('falha')
    const execute = vi
      .fn()
      .mockRejectedValueOnce(error)
      .mockResolvedValue(right({ expiredPromotions: [] }))
    const onError = vi.fn()

    const stop = startExpirePromotionsJob({ expireDuePromotions: makeUseCase(execute), onError })

    await vi.advanceTimersByTimeAsync(0)

    expect(onError).toHaveBeenCalledWith(error)

    await vi.advanceTimersByTimeAsync(INTERVAL_IN_MS)

    expect(execute).toHaveBeenCalledTimes(2)

    stop()
  })

  it('should not start a new run while the previous one is still in progress', async () => {
    let release: () => void = () => {}

    const execute = vi.fn().mockImplementation(
      () =>
        new Promise((resolve) => {
          release = () => resolve(right({ expiredPromotions: [] }))
        }),
    )

    const stop = startExpirePromotionsJob({ expireDuePromotions: makeUseCase(execute) })

    await vi.advanceTimersByTimeAsync(INTERVAL_IN_MS * 3)

    expect(execute).toHaveBeenCalledTimes(1)

    release()

    await vi.advanceTimersByTimeAsync(INTERVAL_IN_MS)

    expect(execute).toHaveBeenCalledTimes(2)

    stop()
  })

  it('should stop running after the returned function is called', async () => {
    const execute = vi.fn().mockResolvedValue(right({ expiredPromotions: [] }))

    const stop = startExpirePromotionsJob({ expireDuePromotions: makeUseCase(execute) })

    await vi.advanceTimersByTimeAsync(0)
    stop()
    await vi.advanceTimersByTimeAsync(INTERVAL_IN_MS * 3)

    expect(execute).toHaveBeenCalledTimes(1)
  })
})
