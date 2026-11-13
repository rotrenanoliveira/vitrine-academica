import type { Metadata } from 'next'
import { requireUser } from '@/server/auth/require-user'
import { ThemeSelection } from './_components/theme-selection'

type PageProps = {
  params: Promise<{ slug: string }>
}

export const metadata: Metadata = {
  title: 'Escolha de tema',
}

export default async function EventThemeSelectionPage({ params }: PageProps) {
  const { slug } = await params
  const user = await requireUser()

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-1 flex-col gap-6 p-4">
        <ThemeSelection slug={slug} userId={user.id} />
      </div>
    </div>
  )
}
