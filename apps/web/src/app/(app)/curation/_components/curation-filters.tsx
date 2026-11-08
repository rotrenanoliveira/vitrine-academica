import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { getCachedInstitutions } from '@/server/http/routes/institutions/fetch-institutions'

const periodOptions = [
  { value: 1, label: 'Último mês' },
  { value: 3, label: 'Últimos 3 meses' },
  { value: 6, label: 'Últimos 6 meses' },
  { value: 12, label: 'Último ano' },
]

const selectClassName = 'border-input bg-background h-9 min-w-48 border-b px-0 text-sm outline-none'

type CurationFiltersProps = {
  institutionId?: string | undefined
  months: number
}

export async function CurationFilters({ institutionId, months }: CurationFiltersProps) {
  const institutions = await getCachedInstitutions()
    .then((response) => response.institutions.filter((institution) => institution.status === 'ACTIVE'))
    .catch(() => [])

  return (
    <form method="get" className="flex flex-wrap items-end gap-4">
      <div className="space-y-2">
        <Label htmlFor="institutionId">Instituição</Label>
        <select id="institutionId" name="institutionId" defaultValue={institutionId ?? ''} className={selectClassName}>
          <option value="">Todas</option>
          {institutions.map((institution) => (
            <option key={institution.id} value={institution.id}>
              {institution.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="months">Período</Label>
        <select id="months" name="months" defaultValue={String(months)} className={selectClassName}>
          {periodOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <Button type="submit" variant="outline">
        Filtrar
      </Button>
    </form>
  )
}
