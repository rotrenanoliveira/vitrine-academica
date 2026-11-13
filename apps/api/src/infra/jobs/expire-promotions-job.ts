import type { ExpireDuePromotionsUseCase } from '@/domain/points/application/use-cases/promotion/expire-due-promotions'

interface ExpirePromotionsJobParams {
  expireDuePromotions: ExpireDuePromotionsUseCase
  intervalInMs?: number
  onExpired?: (total: number) => void
  onError?: (error: unknown) => void
}

export function startExpirePromotionsJob({
  expireDuePromotions,
  intervalInMs = 30_000,
  onExpired,
  onError,
}: ExpirePromotionsJobParams) {
  let running = false

  async function run() {
    if (running) {
      return
    }

    running = true

    try {
      const result = await expireDuePromotions.execute()

      if (result.isRight()) {
        const total = result.value.expiredPromotions.length

        if (total > 0) {
          onExpired?.(total)
        }
      }
    } catch (error) {
      onError?.(error)
    } finally {
      running = false
    }
  }

  void run()

  const timer = setInterval(run, intervalInMs)

  timer.unref()

  return () => clearInterval(timer)
}
