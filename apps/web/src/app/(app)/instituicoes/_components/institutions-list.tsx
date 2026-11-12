import { getCachedInstitutions } from '@/server/http/routes/institutions/fetch-institutions'
import type { InstitutionsFilters } from '../search-params'
import { InstitutionsGallery } from './institutions-gallery'

export async function InstitutionsList({ filters }: { filters: InstitutionsFilters }) {
  const { institutions } = await getCachedInstitutions()

  const query = filters.query?.trim().toLowerCase()

  const filtered = institutions.filter((institution) => {
    if (!query) return true
    return institution.name.toLowerCase().includes(query) || institution.slug.toLowerCase().includes(query)
  })

  return <InstitutionsGallery institutions={filtered} />
}
