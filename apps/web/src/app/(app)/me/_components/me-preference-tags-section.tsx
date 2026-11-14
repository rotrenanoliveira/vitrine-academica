'use client'

import { useQuery } from '@tanstack/react-query'
import { FormRegisterPreferenceTags } from '@/components/preference-tag/form-register-preference-tags'
import { Skeleton } from '@/components/ui/skeleton'
import { fetchUserPreferenceTags } from '@/server/http/routes/preference-tags/fetch-user-preference-tags'
import { fetchTags } from '@/server/http/routes/tags/fetch-tags'

type MePreferenceTagsSectionProps = {
  userId: string
}

export function MePreferenceTagsSection({ userId }: MePreferenceTagsSectionProps) {
  const tagsQuery = useQuery({
    queryKey: ['tags'],
    queryFn: () => fetchTags(),
  })

  const preferencesQuery = useQuery({
    queryKey: ['me', 'preference-tags', userId],
    queryFn: () => fetchUserPreferenceTags(userId),
  })

  const isPending = tagsQuery.isPending || preferencesQuery.isPending
  const isError = tagsQuery.isError || preferencesQuery.isError

  return (
    <section className="space-y-4 border-t border-border pt-10">
      <h2 className="font-heading text-xl font-semibold">Tags preferidas</h2>
      {isPending ? (
        <div className="space-y-3" aria-busy="true">
          <Skeleton className="h-4 w-64 rounded-none bg-[#252422]/15" />
          <Skeleton className="h-10 w-full rounded-none bg-[#252422]/15" />
        </div>
      ) : isError || !tagsQuery.data || !preferencesQuery.data ? (
        <p className="text-sm text-muted-foreground">Não foi possível carregar as tags preferidas.</p>
      ) : (
        <FormRegisterPreferenceTags
          tags={tagsQuery.data.tags}
          selectedTagIds={preferencesQuery.data.preferenceTags
            .filter((preference) => preference.status === 'ACTIVE')
            .map((preference) => preference.tagId)}
        />
      )}
    </section>
  )
}
