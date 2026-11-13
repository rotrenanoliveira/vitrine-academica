import { type Either, left, right } from '@/core/either'
import type { ProjectTagsRepository } from '@/domain/project/application/repositories/project-tags-repository'
import type { ProjectsRepository } from '@/domain/project/application/repositories/projects-repositories'
import type { Project, ProjectStatus } from '@/domain/project/enterprise/entities/project'
import { InstitutionMemberStatus } from '../../../enterprise/entities/institution-member'
import { InstitutionNotFoundError } from '../../_errors/institution-not-found-error'
import type { InstitutionMembersRepository } from '../../repositories/institution-members-repository'
import type { InstitutionsRepository } from '../../repositories/institutions-repository'

interface FetchInstitutionProjectsBySlugUseCaseRequest {
  slug: string
  status?: ProjectStatus
  tagIds?: string[]
  title?: string
  page?: number
  limit?: number
}

type FetchInstitutionProjectsBySlugUseCaseResponse = Either<
  InstitutionNotFoundError,
  {
    projects: Project[]
    total: number
    page: number
    limit: number
  }
>

export class FetchInstitutionProjectsBySlugUseCase {
  constructor(
    private readonly institutionsRepository: InstitutionsRepository,
    private readonly institutionMembersRepository: InstitutionMembersRepository,
    private readonly projectsRepository: ProjectsRepository,
    private readonly projectTagsRepository: ProjectTagsRepository,
  ) {}

  async execute({
    slug,
    status,
    tagIds,
    title,
    page = 1,
    limit = 20,
  }: FetchInstitutionProjectsBySlugUseCaseRequest): Promise<FetchInstitutionProjectsBySlugUseCaseResponse> {
    const institution = await this.institutionsRepository.findBySlug(slug)

    if (!institution) {
      return left(new InstitutionNotFoundError())
    }

    const members = await this.institutionMembersRepository.findManyByInstitutionId(institution.id.toString())
    const authorIds = members
      .filter((member) => member.status === InstitutionMemberStatus.ACTIVE)
      .map((member) => member.userId)

    if (authorIds.length === 0) {
      return right({ projects: [], total: 0, page, limit })
    }

    let ids: string[] | undefined

    if (tagIds) {
      const projectTags = await this.projectTagsRepository.findByTagIds(tagIds)
      ids = [...new Set(projectTags.map((projectTag) => projectTag.projectId.toString()))]

      if (ids.length === 0) {
        return right({ projects: [], total: 0, page, limit })
      }
    }

    const normalizedTitle = title?.trim()
    const filters = {
      authorIds,
      status,
      title: normalizedTitle ? normalizedTitle : undefined,
      ids,
    }

    const [total, projects] = await Promise.all([
      this.projectsRepository.countMany(filters),
      this.projectsRepository.findMany({
        ...filters,
        page,
        limit,
      }),
    ])

    return right({ projects, total, page, limit })
  }
}
