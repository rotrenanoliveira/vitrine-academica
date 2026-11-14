import { type Either, right } from '@/core/either'
import type { UsersRepository } from '@/domain/identity/application/repositories/users-repository'
import type { User } from '@/domain/identity/enterprise/entities/user'
import type { ProjectsRepository } from '@/domain/project/application/repositories/projects-repositories'
import { type Project, ProjectStatus } from '@/domain/project/enterprise/entities/project'
import type { Promotion } from '../../../enterprise/entities/promotion'
import type { PromotionsRepository } from '../../repositories/promotions-repository'

interface ListActivePromotionsUseCaseRequest {
  now?: Date
  page?: number
  limit?: number
}

export interface ActivePromotionItem {
  promotion: Promotion
  project: Project
  promoter: User
}

type ListActivePromotionsUseCaseResponse = Either<
  never,
  {
    items: ActivePromotionItem[]
    total: number
    page: number
    limit: number
  }
>

export class ListActivePromotionsUseCase {
  constructor(
    private readonly promotionsRepository: PromotionsRepository,
    private readonly projectsRepository: ProjectsRepository,
    private readonly usersRepository: UsersRepository,
  ) {}

  async execute({
    now = new Date(),
    page = 1,
    limit = 20,
  }: ListActivePromotionsUseCaseRequest = {}): Promise<ListActivePromotionsUseCaseResponse> {
    const promotions = await this.promotionsRepository.findManyActive(now)

    if (promotions.length === 0) {
      return right({ items: [], total: 0, page, limit })
    }

    const projects = await this.projectsRepository.findManyByIds(
      promotions.map((promotion) => promotion.projectId.toString()),
    )
    const promoters = await this.usersRepository.findManyByIds(
      promotions.map((promotion) => promotion.promoterId.toString()),
    )

    const projectsById = new Map(projects.map((project) => [project.id.toString(), project]))
    const promotersById = new Map(promoters.map((promoter) => [promoter.id.toString(), promoter]))

    const uniqueByProject = new Map<string, ActivePromotionItem>()

    for (const promotion of promotions) {
      const projectId = promotion.projectId.toString()

      if (uniqueByProject.has(projectId)) {
        continue
      }

      const project = projectsById.get(projectId)
      const promoter = promotersById.get(promotion.promoterId.toString())

      if (!project || !promoter || project.status !== ProjectStatus.PUBLISHED) {
        continue
      }

      uniqueByProject.set(projectId, { promotion, project, promoter })
    }

    const allItems = Array.from(uniqueByProject.values())
    const total = allItems.length
    const start = (page - 1) * limit
    const items = allItems.slice(start, start + limit)

    return right({ items, total, page, limit })
  }
}
