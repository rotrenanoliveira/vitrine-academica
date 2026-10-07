import { type Either, right } from '@/core/either'
import type { Tag } from '../../../enterprise/entities/tag'
import type { TagsRepository } from '../../repositories/tags-repository'

type FetchTagsUseCaseResponse = Either<unknown, { tags: Tag[] }>

export class FetchTagsUseCase {
  constructor(private readonly tagsRepository: TagsRepository) {}

  async execute(): Promise<FetchTagsUseCaseResponse> {
    const tags = await this.tagsRepository.findAll()

    return right({ tags })
  }
}
