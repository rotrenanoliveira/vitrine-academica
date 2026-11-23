import { type Either, right } from '@/core/either'
import type { Project } from '@/domain/project/enterprise/entities/project'
import type { CurationFilters, CurationRepository } from '../repositories/curation-repository'

const DEFAULT_PERIOD_IN_MONTHS = 3

export type CurationScope = 'board' | 'community' | 'all'

interface GetCurationUseCaseRequest {
  institutionIds?: string[] | undefined
  months?: number | undefined
  limit?: number | undefined
  scope?: CurationScope | undefined
  title?: string | undefined
  tagIds?: string[] | undefined
  now?: Date | undefined
}

type GetCurationUseCaseResponse = Either<never, { projects: Project[] }>

type CurationFiltersInput = Pick<GetCurationUseCaseRequest, 'institutionIds' | 'title' | 'tagIds'> & {
  since: Date
}

function mergeUniqueByCreatedAtDesc(projects: Project[]) {
  const uniqueById = new Map<string, Project>()

  for (const project of projects) {
    uniqueById.set(project.id.toString(), project)
  }

  return [...uniqueById.values()].sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())
}

export class GetCurationUseCase {
  constructor(private readonly curationRepository: CurationRepository) {}

  async execute({
    institutionIds,
    months = DEFAULT_PERIOD_IN_MONTHS,
    limit,
    scope = 'all',
    title,
    tagIds,
    now = new Date(),
  }: GetCurationUseCaseRequest): Promise<GetCurationUseCaseResponse> {
    const since = this.resolveSince(now, months)
    const filters = this.buildFilters({ since, institutionIds, title, tagIds })

    const projects = await this.findProjectsByScope(scope, filters)

    return right({ projects: this.applyLimit(projects, limit) })
  }

  private resolveSince(now: Date, months: number): Date {
    const since = new Date(now)
    since.setUTCMonth(since.getUTCMonth() - months)

    return since
  }

  private buildFilters({ since, institutionIds, title, tagIds }: CurationFiltersInput): CurationFilters {
    const normalizedTitle = title?.trim()

    return {
      since,
      institutionIds: institutionIds && institutionIds.length > 0 ? institutionIds : undefined,
      title: normalizedTitle ? normalizedTitle : undefined,
      tagIds: tagIds && tagIds.length > 0 ? tagIds : undefined,
      limit: undefined,
    }
  }

  private async findProjectsByScope(scope: CurationScope, filters: CurationFilters): Promise<Project[]> {
    if (scope === 'board') {
      return this.curationRepository.findTopByTeachers(filters)
    }

    if (scope === 'community') {
      return this.curationRepository.findTopByCommunity(filters)
    }

    const [board, community] = await Promise.all([
      this.curationRepository.findTopByTeachers(filters),
      this.curationRepository.findTopByCommunity(filters),
    ])

    return mergeUniqueByCreatedAtDesc([...board, ...community])
  }

  private applyLimit(projects: Project[], limit: number | undefined): Project[] {
    return limit !== undefined ? projects.slice(0, limit) : projects
  }
}
