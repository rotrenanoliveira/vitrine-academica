'use client'

import { useQuery } from '@tanstack/react-query'
import { MyApplicationsTable } from '@/components/call/my-applications-table'
import { getMyCallApplications } from '@/server/http/routes/calls/get-my-call-applications'

export function MeApplicationsList() {
  const { data, isPending, isError } = useQuery({
    queryKey: ['me', 'applications'],
    queryFn: () => getMyCallApplications(),
  })

  if (isPending) {
    return <p className="text-sm text-muted-foreground">Carregando candidaturas…</p>
  }

  if (isError) {
    return <p className="text-sm text-muted-foreground">Não foi possível carregar as suas candidaturas.</p>
  }

  return <MyApplicationsTable data={data.applications} />
}
