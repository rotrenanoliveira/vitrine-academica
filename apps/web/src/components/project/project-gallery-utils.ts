import type { Project, Tag } from '@/utils/type'

export function resolveProjectTagNames(project: Project, tags: Tag[]) {
  const tagNameById = new Map(tags.map((tag) => [tag.id, tag.name]))
  return project.tags.map((tagId) => tagNameById.get(tagId)).filter((name): name is string => Boolean(name))
}

export function formatGalleryCategory(project: Project, tagNames: string[]) {
  const year = String(new Date(project.createdAt).getFullYear())
  const tagsLabel = tagNames.slice(0, 3).join(' · ')

  if (tagsLabel) return `${tagsLabel} · ${year}`
  return year
}
