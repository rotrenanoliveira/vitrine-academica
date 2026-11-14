import type { Metadata } from 'next'
import { getCurrentUser } from '@/server/auth/require-user'
import { fetchAuthorProjectsSafe } from '@/server/http/routes/authors/fetch-author-projects'
import { AuthorPageView } from './_components/author-page-view'

type PageProps = {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const [data] = await fetchAuthorProjectsSafe(id)

  if (!data) {
    return { title: 'Autor' }
  }

  return {
    title: data.author.name,
    description: `Projetos publicados por ${data.author.name}`,
  }
}

export default async function AuthorPage({ params }: PageProps) {
  const { id } = await params
  const user = await getCurrentUser()

  return <AuthorPageView authorId={id} currentUserId={user?.id ?? null} authenticated={Boolean(user)} />
}
