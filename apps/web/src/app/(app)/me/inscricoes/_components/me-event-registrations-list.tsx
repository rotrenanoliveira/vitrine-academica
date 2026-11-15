'use client'

import { useQuery } from '@tanstack/react-query'
import { MyEventRegistrationsTable } from '@/components/event/my-event-registrations-table'
import { getMyEventRegistrations } from '@/server/http/routes/events/get-my-event-registrations'

export function MeEventRegistrationsList() {
  const { data, isPending, isError } = useQuery({
    queryKey: ['me', 'event-registrations'],
    queryFn: () => getMyEventRegistrations(),
  })

  if (isPending) {
    return <p className="text-sm text-muted-foreground">Carregando inscrições…</p>
  }

  if (isError) {
    return <p className="text-sm text-muted-foreground">Não foi possível carregar as suas inscrições.</p>
  }

  return <MyEventRegistrationsTable data={data.registrations} />
}
