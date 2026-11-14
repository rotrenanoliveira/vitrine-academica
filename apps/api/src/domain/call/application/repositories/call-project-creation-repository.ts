import type { Project } from '@/domain/project/enterprise/entities/project'
import type { ProjectMember } from '@/domain/project/enterprise/entities/project-member'
import type { ProjectTag } from '@/domain/project/enterprise/entities/project-tag'
import type { Call } from '../../enterprise/entities/call'

export interface CreateProjectFromCallParams {
  project: Project
  projectTags: ProjectTag[]
  projectMembers: ProjectMember[]
  call: Call
}

export interface CallProjectCreationRepository {
  createProjectFromCall(params: CreateProjectFromCallParams): Promise<void>
}
