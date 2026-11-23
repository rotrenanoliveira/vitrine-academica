import { type Either, left, right } from '@/core/either'
import type { ProjectTagsRepository } from '@/domain/project/application/repositories/project-tags-repository'
import type { ProjectsRepository } from '@/domain/project/application/repositories/projects-repositories'
import type { Project, ProjectStatus } from '@/domain/project/enterprise/entities/project'
import { InstitutionMemberStatus } from '../../../enterprise/entities/institution-member'
import type { Institution } from '../../../enterprise/entities/institutions'
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

type FetchInstitutionProjectsPageFilters = {
  authorIds: string[]
  status?: ProjectStatus
  title?: string
  ids?: string[]
  page: number
  limit: number
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
    const institutionResult = await this.findInstitutionBySlugOrFail(slug)

    if (institutionResult.isLeft()) {
      return left(institutionResult.value)
    }

    const institution = institutionResult.value
    const authorIds = await this.fetchActiveMembersIds(institution.id.toString())

    if (authorIds.length === 0) {
      return right({ projects: [], total: 0, page, limit })
    }

    const ids = await this.fetchProjectIdsByTags(tagIds)

    if (ids !== undefined && ids.length === 0) {
      return right({ projects: [], total: 0, page, limit })
    }

    const normalizedTitle = title?.trim()

    const { projects, total } = await this.fetchProjects({
      title: normalizedTitle,
      authorIds,
      status,
      ids,
      page,
      limit,
    })

    return right({ projects, total, page, limit })
  }

  private async findInstitutionBySlugOrFail(slug: string): Promise<Either<InstitutionNotFoundError, Institution>> {
    const institution = await this.institutionsRepository.findBySlug(slug)

    if (!institution) {
      return left(new InstitutionNotFoundError())
    }

    return right(institution)
  }

  private async fetchActiveMembersIds(institutionId: string) {
    const members = await this.institutionMembersRepository.findManyByInstitutionId(institutionId)

    return members.filter((member) => member.status === InstitutionMemberStatus.ACTIVE).map((member) => member.userId)
  }

  private async fetchProjectIdsByTags(tagIds?: string[]) {
    if (!tagIds) {
      return undefined
    }

    const projectTags = await this.projectTagsRepository.findByTagIds(tagIds)

    return [...new Set(projectTags.map((projectTag) => projectTag.projectId.toString()))]
  }

  private async fetchProjects({ page, limit, ...filters }: FetchInstitutionProjectsPageFilters) {
    const [total, projects] = await Promise.all([
      this.projectsRepository.countMany(filters),
      this.projectsRepository.findMany({
        ...filters,
        page,
        limit,
      }),
    ])

    return { projects, total }
  }
}
