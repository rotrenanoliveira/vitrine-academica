import type { ProjectListItem, Tag } from '@/utils/type'
import { ProjectGalleryCard } from './project-gallery-card'

type ProjectGalleryCardsProps = {
  projects: ProjectListItem[]
  tags?: Tag[]
  title?: string
  eyebrow?: string
  description?: string
}

export function ProjectGalleryCards({
  projects,
  tags = [],
  title = 'Sala de Exposição',
  eyebrow,
  description = 'Continue a visita por outras pesquisas e narrativas do acervo.',
}: ProjectGalleryCardsProps) {
  if (projects.length === 0) {
    return null
  }

  const resolvedEyebrow = eyebrow ?? `galeria · ${String(projects.length).padStart(2, '0')} projetos`

  return (
    <section aria-labelledby="other-projects-title">
      <div className="mb-7 flex items-end justify-between gap-6">
        <div>
          <p className="mb-3 text-xs font-medium uppercase tracking-[0.28em] text-[#252422]/55">{resolvedEyebrow}</p>
          <h2 id="other-projects-title" className="font-serif text-4xl leading-none tracking-[-0.04em] sm:text-5xl">
            {title}
          </h2>
        </div>
        {description ? (
          <p className="hidden max-w-xl text-right text-sm leading-relaxed text-[#252422]/65 md:block">{description}</p>
        ) : null}
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => (
          <ProjectGalleryCard key={project.id} project={project} tags={tags} />
        ))}
      </div>
    </section>
  )
}
