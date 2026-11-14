import { getMyProjects } from '@/server/http/routes/projects/get-my-projects'
import { fetchTags } from '@/server/http/routes/tags/fetch-tags'
import { resolveProjectsWithCover } from '@/server/projects/resolve-project-cover-url'
import type { ProjectListItem, Tag } from '@/utils/type'

export async function fetchMyProjectsGallery(): Promise<{ projects: ProjectListItem[]; tags: Tag[] }> {
  const [{ projects }, { tags }] = await Promise.all([getMyProjects(), fetchTags()])
  const projectsWithCover = await resolveProjectsWithCover(projects)

  return {
    tags,
    projects: projectsWithCover.map((project) => ({
      id: project.id,
      title: project.title,
      slug: project.slug,
      description: project.description,
      coverUrl: project.coverUrl,
      createdAt: project.createdAt,
      tags: project.tags,
    })),
  }
}
