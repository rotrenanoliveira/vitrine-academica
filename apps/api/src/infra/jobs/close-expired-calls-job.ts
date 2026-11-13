import type { CloseExpiredCallsUseCase } from '@/domain/call/application/use-cases/call/close-expired-calls'

interface CloseExpiredCallsJobParams {
  closeExpiredCalls: CloseExpiredCallsUseCase
  intervalInMs?: number
  onClosed?: (total: number) => void
  onError?: (error: unknown, callId?: string) => void
}

export function startCloseExpiredCallsJob({
  closeExpiredCalls,
  intervalInMs = 30_000,
  onClosed,
  onError,
}: CloseExpiredCallsJobParams) {
  let running = false

  async function run() {
    if (running) {
      return
    }

    running = true

    try {
      const result = await closeExpiredCalls.execute()

      if (result.isRight()) {
        if (result.value.calls.length > 0) {
          onClosed?.(result.value.calls.length)
        }

        for (const failure of result.value.failures) {
          onError?.(failure.error, failure.callId)
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
