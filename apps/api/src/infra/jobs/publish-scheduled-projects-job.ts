import type { PublishScheduledProjectsUseCase } from '@/domain/project/application/use-cases/scheduled-project/publish-scheduled-projects'

interface PublishScheduledProjectsJobParams {
  publishScheduledProjects: PublishScheduledProjectsUseCase
  intervalInMs?: number
  onPublished?: (total: number) => void
  onError?: (error: unknown) => void
}

export function startPublishScheduledProjectsJob({
  publishScheduledProjects,
  intervalInMs = 30_000,
  onPublished,
  onError,
}: PublishScheduledProjectsJobParams) {
  let running = false

  async function run() {
    if (running) {
      return
    }

    running = true

    try {
      const result = await publishScheduledProjects.execute()

      if (result.isRight() && result.value.projects.length > 0) {
        onPublished?.(result.value.projects.length)
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
