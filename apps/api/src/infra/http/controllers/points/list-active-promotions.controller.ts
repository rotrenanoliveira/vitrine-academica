import type { FastifyReply } from 'fastify'
import type { ListActivePromotionsUseCase } from '@/domain/points/application/use-cases/promotion/list-active-promotions'
import { ProjectPresenter } from '../../presenters/project-presenter'
import { PromotionPresenter } from '../../presenters/promotion-presenter'

export class ListActivePromotionsController {
  constructor(private readonly listActivePromotions: ListActivePromotionsUseCase) {}

  async handle(reply: FastifyReply) {
    const result = await this.listActivePromotions.execute()

    return reply.status(200).send({
      items: result.value.items.map((item) => ({
        promotion: PromotionPresenter.toHTTP(item.promotion),
        project: ProjectPresenter.toHTTP(item.project),
        promoter: {
          id: item.promoter.id.toString(),
          name: item.promoter.name,
        },
      })),
    })
  }
}
