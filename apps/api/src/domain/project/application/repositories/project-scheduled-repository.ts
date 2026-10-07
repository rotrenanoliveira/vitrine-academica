import type { ProjectScheduled } from '../../enterprise/entities/project-scheduled'

export interface ProjectScheduledRepository {
  findById(projectId: string): Promise<ProjectScheduled | null>
  findManyReadyToPublish(date: Date): Promise<ProjectScheduled[]>

  create(projectScheduled: ProjectScheduled): Promise<void>
  save(projectScheduled: ProjectScheduled): Promise<void>
  delete(projectScheduled: ProjectScheduled): Promise<void>
}
