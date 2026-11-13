import { type Either, right } from '@/core/either'
import type { UsersRepository } from '@/domain/identity/application/repositories/users-repository'
import type { User } from '@/domain/identity/enterprise/entities/user'
import type { ProjectsRepository } from '@/domain/project/application/repositories/projects-repositories'
import { type Project, ProjectStatus } from '@/domain/project/enterprise/entities/project'
import type { Promotion } from '../../../enterprise/entities/promotion'
import type { PromotionsRepository } from '../../repositories/promotions-repository'

interface ListActivePromotionsUseCaseRequest {
  now?: Date
}

export interface ActivePromotionItem {
  promotion: Promotion
  project: Project
  promoter: User
}

type ListActivePromotionsUseCaseResponse = Either<never, { items: ActivePromotionItem[] }>

export class ListActivePromotionsUseCase {
  constructor(
    private readonly promotionsRepository: PromotionsRepository,
    private readonly projectsRepository: ProjectsRepository,
    private readonly usersRepository: UsersRepository,
  ) {}

  async execute({
    now = new Date(),
  }: ListActivePromotionsUseCaseRequest = {}): Promise<ListActivePromotionsUseCaseResponse> {
    const promotions = await this.promotionsRepository.findManyActive(now)

    if (promotions.length === 0) {
      return right({ items: [] })
    }

    const projects = await this.projectsRepository.findManyByIds(
      promotions.map((promotion) => promotion.projectId.toString()),
    )
    const promoters = await this.usersRepository.findManyByIds(
      promotions.map((promotion) => promotion.promoterId.toString()),
    )

    const projectsById = new Map(projects.map((project) => [project.id.toString(), project]))
    const promotersById = new Map(promoters.map((promoter) => [promoter.id.toString(), promoter]))

    const items = promotions
      .map((promotion) => {
        const project = projectsById.get(promotion.projectId.toString())
        const promoter = promotersById.get(promotion.promoterId.toString())

        if (!project || !promoter || project.status !== ProjectStatus.PUBLISHED) {
          return null
        }

        return { promotion, project, promoter }
      })
      .filter((item): item is ActivePromotionItem => item !== null)

    return right({ items })
  }
}
