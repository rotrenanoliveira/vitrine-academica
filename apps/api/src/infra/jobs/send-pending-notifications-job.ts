import type { SendPendingNotificationsUseCase } from '@/domain/newsletter/application/use-cases/send-pending-notifications'

interface SendPendingNotificationsJobParams {
  sendPendingNotifications: SendPendingNotificationsUseCase
  webUrl: string
  intervalInMs?: number
  onSent?: (result: { sent: number; failed: number }) => void
  onError?: (error: unknown) => void
}

export function startSendPendingNotificationsJob({
  sendPendingNotifications,
  webUrl,
  intervalInMs = 30_000, // 30 segundos
  onSent,
  onError,
}: SendPendingNotificationsJobParams) {
  let running = false

  async function run() {
    if (running) {
      return
    }

    running = true

    try {
      const result = await sendPendingNotifications.execute({ webUrl })

      if (result.isRight() && (result.value.sent > 0 || result.value.failed > 0)) {
        onSent?.(result.value)
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
