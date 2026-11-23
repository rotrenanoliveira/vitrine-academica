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

type PromotionRelations = {
  projectsById: Map<string, Project>
  promotersById: Map<string, User>
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

    const relations = await this.findRelations(promotions)

    const allItems = this.buildUniqueItemsByProject(promotions, relations)

    const items = this.paginate(allItems, page, limit)

    return right({ items, total: allItems.length, page, limit })
  }

  private async findRelations(promotions: Promotion[]): Promise<PromotionRelations> {
    const projects = await this.projectsRepository.findManyByIds(
      promotions.map((promotion) => promotion.projectId.toString()),
    )
    const promoters = await this.usersRepository.findManyByIds(
      promotions.map((promotion) => promotion.promoterId.toString()),
    )

    return {
      projectsById: new Map(projects.map((project) => [project.id.toString(), project])),
      promotersById: new Map(promoters.map((promoter) => [promoter.id.toString(), promoter])),
    }
  }

  private buildUniqueItemsByProject(
    promotions: Promotion[],
    { projectsById, promotersById }: PromotionRelations,
  ): ActivePromotionItem[] {
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

    return Array.from(uniqueByProject.values())
  }

  private paginate(items: ActivePromotionItem[], page: number, limit: number): ActivePromotionItem[] {
    const start = (page - 1) * limit

    return items.slice(start, start + limit)
  }
}
