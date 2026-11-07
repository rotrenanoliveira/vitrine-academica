import type { AdvanceDueEventPhasesUseCase } from '@/domain/event/application/use-cases/event/advance-due-event-phases'

interface AdvanceEventPhaseJobParams {
  advanceDueEventPhases: AdvanceDueEventPhasesUseCase
  intervalInMs?: number
  onAdvanced?: (totals: { closedThemeSelection: number; closedEvents: number }) => void
  onError?: (error: unknown) => void
}

export function startAdvanceEventPhaseJob({
  advanceDueEventPhases,
  intervalInMs = 30_000,
  onAdvanced,
  onError,
}: AdvanceEventPhaseJobParams) {
  let running = false

  async function run() {
    if (running) {
      return
    }

    running = true

    try {
      const result = await advanceDueEventPhases.execute()

      if (result.isRight()) {
        const closedThemeSelection = result.value.closedThemeSelection.length
        const closedEvents = result.value.closedEvents.length

        if (closedThemeSelection > 0 || closedEvents > 0) {
          onAdvanced?.({ closedThemeSelection, closedEvents })
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
