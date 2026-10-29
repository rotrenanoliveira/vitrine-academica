import type { Metadata } from 'next'
import Link from 'next/link'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { requireUser } from '@/server/auth/require-user'
import { listMyStarredProjects } from '@/server/http/routes/projects/list-my-starred-projects'

export const metadata: Metadata = {
  title: 'Projetos que apoiei',
}

export default async function StarredProjectsPage() {
  await requireUser()
  const { items } = await listMyStarredProjects()

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex h-16 shrink-0 items-center gap-2 border-b border-border px-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink render={<Link href="/projetos" />}>Projetos</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Apoiados</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 p-4 py-8">
        <div className="space-y-2">
          <h1 className="font-heading text-3xl font-semibold">Projetos que apoiei</h1>
          <p className="text-muted-foreground">Lista dos projetos em que você deixou uma estrela.</p>
        </div>

        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">Você ainda não apoiou nenhum projeto.</p>
        ) : (
          <ul className="divide-y divide-border border border-border">
            {items.map(({ project, star }) => (
              <li key={star.id} className="flex flex-col gap-1 px-4 py-3">
                <Link href={`/projetos/${project.id}`} className="font-heading text-lg font-semibold hover:underline">
                  {project.title}
                </Link>
                <p className="text-xs text-muted-foreground">
                  Apoiado em {new Date(star.ratedAt).toLocaleString('pt-BR')}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
