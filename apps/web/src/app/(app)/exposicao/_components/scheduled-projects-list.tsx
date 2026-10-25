import Image from 'next/image'
import { getCachedScheduledProjects } from '@/server/http/routes/projects/fetch-scheduled-projects'
import { resolveProjectCoverUrl } from '@/server/projects/resolve-project-cover-url'

const launchDateFormatter = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'short',
  timeStyle: 'short',
  timeZone: 'America/Sao_Paulo',
})

export async function ScheduledProjectsList() {
  const { scheduledProjects } = await getCachedScheduledProjects()

  if (scheduledProjects.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhum lançamento agendado para os próximos 7 dias.</p>
  }

  const launches = await Promise.all(
    scheduledProjects.map(async ({ project, publishedIn }) => ({
      project,
      publishedIn,
      coverUrl: await resolveProjectCoverUrl(project),
    })),
  )

  return (
    <ul className="divide-y divide-border border border-border">
      {launches.map(({ project, publishedIn, coverUrl }) => (
        <li key={project.id} className="space-y-4 px-4 py-4 lg:flex lg:gap-4">
          {coverUrl ? (
            <div className="relative w-96 aspect-video overflow-hidden">
              <Image src={coverUrl} alt={`Capa de ${project.title}`} fill unoptimized className="object-cover" />
            </div>
          ) : (
            <div className="h-90 aspect-video bg-muted" aria-hidden />
          )}
          <div className="min-w-0 space-y-1">
            <h2 className="font-heading text-lg font-medium">{project.title}</h2>
            <p className="line-clamp-2 text-sm text-muted-foreground">{project.description}</p>
            <p className="text-xs text-muted-foreground">
              Lançamento em {launchDateFormatter.format(new Date(publishedIn))}
            </p>
          </div>
        </li>
      ))}
    </ul>
  )
}
