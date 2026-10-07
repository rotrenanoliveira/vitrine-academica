import { type Either, left, right } from '@/core/either'
import { Slug } from '@/core/entities/value-objects/slug'
import { Tag } from '@/domain/tag/enterprise/entities/tag'
import { TagAlreadyExistsError } from '../../_errors/tag-already-exists-error'
import type { TagsRepository } from '../../repositories/tags-repository'

interface RegisterTagUseCaseRequest {
  name: string
}

type RegisterTagUseCaseResponse = Either<TagAlreadyExistsError, { tag: Tag }>

export class RegisterTagUseCase {
  constructor(private readonly tagsRepository: TagsRepository) {}

  async execute({ name }: RegisterTagUseCaseRequest): Promise<RegisterTagUseCaseResponse> {
    const slug = Slug.createFromText(name)
    const tagWithSameSlug = await this.tagsRepository.findBySlug(slug.value)

    if (tagWithSameSlug) {
      return left(new TagAlreadyExistsError())
    }

    const tag = Tag.create({
      name,
      slug,
    })

    await this.tagsRepository.create(tag)

    return right({ tag })
  }
}
