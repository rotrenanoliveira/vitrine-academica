import { type Either, right } from '@/core/either'
import type { Project } from '@/domain/project/enterprise/entities/project'
import type { CurationRepository } from '../repositories/curation-repository'

const DEFAULT_PERIOD_IN_MONTHS = 3

export type CurationScope = 'board' | 'community' | 'all'

interface GetCurationUseCaseRequest {
  institutionId?: string | undefined
  months?: number | undefined
  limit?: number | undefined
  scope?: CurationScope | undefined
  title?: string | undefined
  tagIds?: string[] | undefined
  now?: Date | undefined
}

type GetCurationUseCaseResponse = Either<never, { projects: Project[] }>

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
    institutionId,
    months = DEFAULT_PERIOD_IN_MONTHS,
    limit,
    scope = 'all',
    title,
    tagIds,
    now = new Date(),
  }: GetCurationUseCaseRequest): Promise<GetCurationUseCaseResponse> {
    const since = new Date(now)
    since.setUTCMonth(since.getUTCMonth() - months)

    const normalizedTitle = title?.trim()
    const filters = {
      since,
      institutionId,
      title: normalizedTitle ? normalizedTitle : undefined,
      tagIds: tagIds && tagIds.length > 0 ? tagIds : undefined,
      limit: undefined as number | undefined,
    }

    let projects: Project[] = []

    if (scope === 'board') {
      projects = await this.curationRepository.findTopByTeachers(filters)
    } else if (scope === 'community') {
      projects = await this.curationRepository.findTopByCommunity(filters)
    } else {
      const [board, community] = await Promise.all([
        this.curationRepository.findTopByTeachers(filters),
        this.curationRepository.findTopByCommunity(filters),
      ])

      projects = mergeUniqueByCreatedAtDesc([...board, ...community])
    }

    if (limit !== undefined) {
      projects = projects.slice(0, limit)
    }

    return right({ projects })
  }
}
