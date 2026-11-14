import type { Institution } from '@/utils/type'
import { InstitutionGalleryCard } from './institution-gallery-card'

type InstitutionsGalleryProps = {
  institutions: Institution[]
}

export function InstitutionsGallery({ institutions }: InstitutionsGalleryProps) {
  if (institutions.length === 0) {
    return <p className="text-center text-sm text-muted-foreground">Nenhuma instituição encontrada.</p>
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {institutions.map((institution) => (
        <InstitutionGalleryCard key={institution.id} institution={institution} />
      ))}
    </div>
  )
}
