import type { Metadata } from 'next'
import { getCurrentUser } from '@/server/auth/require-user'
import { getCachedPublicEvent } from '@/server/http/routes/events/get-public-event'
import { EventDetail } from './_components/event-detail'

type PageProps = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  try {
    const { event } = await getCachedPublicEvent(slug)
    return { title: event.name ?? event.slug }
  } catch {
    return { title: 'Evento' }
  }
}

export default async function EventDetailPage({ params }: PageProps) {
  const { slug } = await params
  const user = await getCurrentUser()

  return (
    <div className="flex flex-1 flex-col">
      <div className="mx-auto flex w-full flex-1 flex-col gap-12 p-4 py-8">
        <EventDetail slug={slug} userId={user?.id} />
      </div>
    </div>
  )
}
