import type {
  CallProjectCreationRepository,
  CreateProjectFromCallParams,
} from '@/domain/call/application/repositories/call-project-creation-repository'
import type { InMemoryCallsRepository } from './in-memory-calls-repository'
import type { InMemoryProjectMembersRepository } from './in-memory-project-members-repository'
import type { InMemoryProjectTagsRepository } from './in-memory-project-tags-repository'
import type { InMemoryProjectsRepository } from './in-memory-projects-repository'

export class InMemoryCallProjectCreationRepository implements CallProjectCreationRepository {
  constructor(
    private readonly callsRepository: InMemoryCallsRepository,
    private readonly projectsRepository: InMemoryProjectsRepository,
    private readonly projectTagsRepository: InMemoryProjectTagsRepository,
    private readonly projectMembersRepository: InMemoryProjectMembersRepository,
  ) {}

  async createProjectFromCall({ project, projectTags, projectMembers, call }: CreateProjectFromCallParams) {
    this.projectsRepository.items.push(project)
    this.projectTagsRepository.items.push(...projectTags)
    this.projectMembersRepository.items.push(...projectMembers)

    await this.callsRepository.save(call)
  }
}
