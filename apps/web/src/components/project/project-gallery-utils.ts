import type { Project, ProjectListItem, Tag } from '@/utils/type'

export function resolveProjectTagNames(project: Project | ProjectListItem, tags: Tag[] = []) {
  if (tags.length === 0) {
    return project.tags
  }

  const tagNameById = new Map(tags.map((tag) => [tag.id, tag.name]))
  return project.tags.map((tagId) => tagNameById.get(tagId)).filter((name): name is string => Boolean(name))
}
