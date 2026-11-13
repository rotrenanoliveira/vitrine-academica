import { ArrowLeft02Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { getCachedInstitutionBySlug } from '@/server/http/routes/institutions/get-institution'
import { InstitutionEventsList } from './_components/institution-events-list'

export const metadata: Metadata = {
  title: 'Eventos da instituição',
  description: 'Ciclos temáticos criados por esta instituição',
}

type PageProps = {
  params: Promise<{ slug: string }>
}

export default async function InstitutionEventsPage({ params }: PageProps) {
  const { slug } = await params
  const { institution } = await getCachedInstitutionBySlug(slug)

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-1 flex-col gap-12 p-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <Button
            className="size-14"
            variant="outline"
            nativeButton={false}
            render={<Link href={`/instituicoes/${institution.slug}`} />}
            aria-label={`Voltar para ${institution.name}`}
          >
            <HugeiconsIcon icon={ArrowLeft02Icon} className="size-6" />
          </Button>
        </div>

        <InstitutionEventsList institutionId={institution.id} institutionName={institution.name} />
      </div>
    </div>
  )
}
