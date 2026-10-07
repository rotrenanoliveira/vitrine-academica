import type { ProjectScheduledRepository } from '@/domain/project/application/repositories/project-scheduled-repository'
import type { ProjectScheduled } from '@/domain/project/enterprise/entities/project-scheduled'

function isSameUTCDay(a: Date, b: Date) {
  return (
    a.getUTCFullYear() === b.getUTCFullYear() &&
    a.getUTCMonth() === b.getUTCMonth() &&
    a.getUTCDate() === b.getUTCDate()
  )
}

export class InMemoryProjectScheduledRepository implements ProjectScheduledRepository {
  public items: ProjectScheduled[] = []

  async findById(projectId: string): Promise<ProjectScheduled | null> {
    return this.items.find((item) => item.projectId.toString() === projectId) ?? null
  }

  async findManyReadyToPublish(date: Date): Promise<ProjectScheduled[]> {
    return this.items.filter((item) => isSameUTCDay(item.publishedIn, date))
  }

  async create(projectScheduled: ProjectScheduled): Promise<void> {
    this.items.push(projectScheduled)
  }

  async save(projectScheduled: ProjectScheduled): Promise<void> {
    const index = this.items.findIndex((item) => item.id.toString() === projectScheduled.id.toString())

    if (index === -1) {
      return
    }

    this.items[index] = projectScheduled
  }

  async delete(projectScheduled: ProjectScheduled): Promise<void> {
    this.items = this.items.filter((item) => item.id.toString() !== projectScheduled.id.toString())
  }
}
