import type { Metadata } from 'next'

import { TodayProjectsList } from './_components/today-projects-list'

export const metadata: Metadata = {
  title: 'Projetos de hoje',
  description: 'Projetos acadêmicos lançados no dia atual',
}

export default function TodayProjectsPage() {
  return <TodayProjectsList />
}
