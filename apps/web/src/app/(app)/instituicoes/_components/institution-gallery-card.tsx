import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import type { Institution } from '@/utils/type'

const typeLabels: Record<Institution['type'], string> = {
  UNIVERSITY: 'Universidade',
  COLLEGE: 'Faculdade',
  CENTER: 'Centro',
  TECHNICAL_COLLEGE: 'Escola técnica',
  OTHER: 'Outro',
}

type InstitutionGalleryCardProps = {
  institution: Institution
}

export function InstitutionGalleryCard({ institution }: InstitutionGalleryCardProps) {
  const href = `/instituicoes/${institution.slug}`
  const description = institution.description.trim() || null

  return (
    <Card className="group h-full gap-0 overflow-hidden rounded-none bg-transparent p-0 shadow-none transition-transform duration-300 hover:-translate-y-1">
      <Link href={href} className="block h-full" aria-label={`Abrir instituição ${institution.name}`}>
        <CardContent className="flex h-full min-h-56 flex-col bg-[#ebe6de] p-5">
          <p className="mb-3 line-clamp-1 text-[10px] uppercase tracking-[0.2em] text-[#252422]/55">
            {typeLabels[institution.type]}
          </p>
          <h3 className="line-clamp-2 font-semibold text-xl leading-tight tracking-[-0.03em] group-hover:underline">
            {institution.name}
          </h3>
          {description ? (
            <p className="mt-3 line-clamp-4 text-sm leading-6 text-[#252422]/65">{description}</p>
          ) : null}
          {institution.domain ? (
            <p className="mt-auto pt-5 text-sm text-[#252422]/55">{institution.domain}</p>
          ) : (
            <span className="mt-auto pt-5" aria-hidden />
          )}
        </CardContent>
      </Link>
    </Card>
  )
}
