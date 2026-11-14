'use client'

import { useQuery } from '@tanstack/react-query'
import { AuthorFollowButton } from '@/components/newsletter/author-follow-button'
import { ProjectGalleryCards } from '@/components/project/project-gallery-cards'
import { Skeleton } from '@/components/ui/skeleton'
import { fetchAuthorProjects } from '@/server/http/routes/authors/fetch-author-projects'
import { listMySubscriptions } from '@/server/http/routes/newsletter/list-my-subscriptions'

type AuthorPageViewProps = {
  authorId: string
  currentUserId: string | null
  authenticated: boolean
}

function AuthorPageSkeleton() {
  return (
    <div className="flex flex-1 flex-col gap-12 p-4" aria-busy="true">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0 space-y-2">
          <Skeleton className="h-3 w-16 rounded-none bg-[#252422]/15" />
          <Skeleton className="h-9 w-64 rounded-none bg-[#252422]/15" />
        </div>
        <Skeleton className="h-10 w-40 rounded-none bg-[#252422]/15" />
      </div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, index) => (
          <div key={index} className="overflow-hidden bg-transparent p-0">
            <div className="p-2">
              <div className="border border-[#252422]/30 bg-[#e6e0d7] p-2 shadow-[5px_5px_0_rgba(37,36,34,0.08)]">
                <Skeleton className="relative aspect-4/3 rounded-none bg-[#c6c0b8]" />
              </div>
            </div>
            <div className="flex min-h-56 flex-col bg-[#ebe6de] p-5">
              <Skeleton className="mb-3 h-3 w-20 rounded-none bg-[#252422]/15" />
              <Skeleton className="h-7 w-4/5 rounded-none bg-[#252422]/15" />
              <Skeleton className="mt-3 h-4 w-full rounded-none bg-[#252422]/10" />
              <Skeleton className="mt-2 h-4 w-5/6 rounded-none bg-[#252422]/10" />
              <Skeleton className="mt-auto h-5 w-36 rounded-none bg-[#252422]/15" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function AuthorPageView({ authorId, currentUserId, authenticated }: AuthorPageViewProps) {
  const authorQuery = useQuery({
    queryKey: ['author-projects', authorId],
    queryFn: () => fetchAuthorProjects(authorId),
  })

  const subscriptionsQuery = useQuery({
    queryKey: ['me', 'subscriptions', { status: 'ACTIVE' }],
    queryFn: () => listMySubscriptions({ status: 'ACTIVE' }),
    enabled: authenticated,
  })

  if (authorQuery.isPending) {
    return <AuthorPageSkeleton />
  }

  if (authorQuery.isError || !authorQuery.data) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4">
        <p className="text-sm text-muted-foreground">Não foi possível carregar o perfil deste autor.</p>
      </div>
    )
  }

  const { author, projects } = authorQuery.data
  const isOwnProfile = currentUserId === author.id
  const canFollow = !isOwnProfile && projects.length > 0
  const match = subscriptionsQuery.data?.subscriptions.find((subscription) => subscription.author?.id === author.id)

  return (
    <div className="flex flex-1 flex-col gap-12 p-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0 space-y-2">
          <p className="text-xs tracking-wider text-muted-foreground uppercase">Autor</p>
          <h1 className="font-heading text-3xl font-semibold">{author.name}</h1>
        </div>

        {canFollow ? (
          <AuthorFollowButton
            authorId={author.id}
            subscriptionId={match?.id ?? null}
            following={Boolean(match)}
            authenticated={authenticated}
          />
        ) : null}
      </div>

      {projects.length === 0 ? (
        <p className="text-sm text-muted-foreground">Este autor ainda não possui projetos publicados.</p>
      ) : (
        <ProjectGalleryCards
          projects={projects}
          title="Projetos publicados"
          eyebrow={`galeria · ${String(projects.length).padStart(2, '0')} projetos`}
          description={`Acervo publicado por ${author.name}, do mais recente ao mais antigo.`}
        />
      )}
    </div>
  )
}
