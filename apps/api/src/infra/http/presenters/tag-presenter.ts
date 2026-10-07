import type { Tag } from '@/domain/tag/enterprise/entities/tag'

export class TagPresenter {
  static toHTTP(tag: Tag) {
    return {
      id: tag.id.toString(),
      name: tag.name,
      slug: tag.slug.value,
    }
  }
}
