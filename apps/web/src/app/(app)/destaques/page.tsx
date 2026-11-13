import type { Metadata } from 'next'
import { DestaquesHeader } from './_components/destaques-header'
import { DestaquesOverviewList } from './_components/destaques-overview-list'

export const metadata: Metadata = {
  title: 'Destaques',
  description: 'Os melhores projetos da comunidade acadêmica, avaliados por professores e pela própria comunidade',
}

export default function DestaquesPage() {
  return (
    <div className="space-y-6">
      <DestaquesHeader />
      <DestaquesOverviewList />
    </div>
  )
}
