import type { ProjectListItem, Tag } from '@/utils/type'
import { HomePromotedProjects } from './home-promoted-projects'
import { ProjectGalleryCards } from './project-gallery-cards'
import { ProjectGallerySlide } from './project-gallery-slide'

export { ProjectGalleryCard } from './project-gallery-card'
export { ProjectGalleryCards } from './project-gallery-cards'
export { ProjectGallerySlide } from './project-gallery-slide'

export type ProjectWithCover = ProjectListItem

type ProjectGalleryProps = {
  projects: ProjectWithCover[]
  tags?: Tag[]
  featuredCount?: number
  cardsTitle?: string
  cardsDescription?: string
  showPromoted?: boolean
}

export function ProjectGallery({
  projects,
  tags = [],
  featuredCount = 5,
  cardsTitle,
  cardsDescription,
  showPromoted = false,
}: ProjectGalleryProps) {
  if (projects.length === 0) {
    return <p className="text-sm text-[#252422]/65">Nenhum projeto publicado no momento.</p>
  }

  const featuredProjects = projects.slice(0, featuredCount)
  const otherProjects = projects.slice(featuredCount)

  return (
    <section className="bg-[#f4f1eb] px-5 py-8 text-[#252422] sm:px-8 lg:px-14" aria-labelledby="gallery-title">
      <h2 id="gallery-title" className="sr-only">
        Galeria de projetos
      </h2>
      <div className="mx-auto flex max-w-7xl flex-col gap-10">
        <ProjectGallerySlide projects={featuredProjects} tags={tags} />
        {showPromoted ? <HomePromotedProjects /> : null}
        <ProjectGalleryCards projects={otherProjects} tags={tags} title={cardsTitle} description={cardsDescription} />
      </div>
    </section>
  )
}
