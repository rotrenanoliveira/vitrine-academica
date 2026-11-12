import type { ExternalProject } from '@/utils/type'
import { ExternalProjectGalleryCard } from './external-project-gallery-card'

type ExternalProjectsGalleryProps = {
  projects: ExternalProject[]
}

export function ExternalProjectsGallery({ projects }: ExternalProjectsGalleryProps) {
  if (projects.length === 0) {
    return <p className="text-center text-sm text-muted-foreground">Nenhuma pesquisa encontrada.</p>
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {projects.map((project) => (
        <ExternalProjectGalleryCard key={project.externalUrl} project={project} />
      ))}
    </div>
  )
}
