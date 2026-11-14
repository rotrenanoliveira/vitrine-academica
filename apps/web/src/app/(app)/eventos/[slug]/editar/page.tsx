import type { Metadata } from 'next'
import { requireUser } from '@/server/auth/require-user'
import { EventEdit } from './_components/event-edit'

type PageProps = {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ eventId?: string }>
}

export const metadata: Metadata = {
  title: 'Editar evento',
}

export default async function EventEditPage({ params, searchParams }: PageProps) {
  const { slug } = await params
  const { eventId: eventIdParam } = await searchParams
  const user = await requireUser()
  const eventKey = eventIdParam ?? slug

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-1 flex-col gap-6 p-4">
        <EventEdit slug={slug} eventKey={eventKey} userId={user.id} />
      </div>
    </div>
  )
}
