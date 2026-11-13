'use client'

import { useQuery } from '@tanstack/react-query'
import { CallsTable } from '@/components/call/calls-table'
import { getMyCalls } from '@/server/http/routes/calls/get-my-calls'
import { fetchTags } from '@/server/http/routes/tags/fetch-tags'

export function MeCallsList() {
  const callsQuery = useQuery({
    queryKey: ['me', 'calls'],
    queryFn: () => getMyCalls(),
  })

  const tagsQuery = useQuery({
    queryKey: ['tags'],
    queryFn: () => fetchTags(),
  })

  if (callsQuery.isPending || tagsQuery.isPending) {
    return <p className="text-sm text-muted-foreground">Carregando chamados…</p>
  }

  if (callsQuery.isError || tagsQuery.isError || !callsQuery.data || !tagsQuery.data) {
    return <p className="text-sm text-muted-foreground">Não foi possível carregar os seus chamados.</p>
  }

  return <CallsTable data={callsQuery.data.calls} tags={tagsQuery.data.tags} showStatus />
}
