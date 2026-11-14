import type { Metadata } from 'next'

import { ScheduledProjectsList } from '../_components/scheduled-projects-list'

export const metadata: Metadata = {
  title: 'Projetos em breve',
  description: 'Projetos acadêmicos agendados para os próximos 7 dias',
}

export default function ScheduledProjectsPage() {
  return <ScheduledProjectsList />
}
