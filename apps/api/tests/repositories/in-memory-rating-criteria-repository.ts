import type { RatingCriteriaRepository } from '@/domain/project/application/repositories/rating-criteria-repository'
import type { RatingCriterion } from '@/domain/project/enterprise/entities/rating-criterion'

export class InMemoryRatingCriteriaRepository implements RatingCriteriaRepository {
  public items: RatingCriterion[] = []

  async findById(id: string): Promise<RatingCriterion | null> {
    return this.items.find((item) => item.id.toString() === id) ?? null
  }

  async findActiveValid(at: Date = new Date()): Promise<RatingCriterion[]> {
    return this.items.filter((item) => item.isValidAt(at))
  }

  async create(criterion: RatingCriterion): Promise<void> {
    this.items.push(criterion)
  }

  async save(criterion: RatingCriterion): Promise<void> {
    const index = this.items.findIndex((item) => item.id.toString() === criterion.id.toString())

    if (index === -1) {
      return
    }

    this.items[index] = criterion
  }
}
