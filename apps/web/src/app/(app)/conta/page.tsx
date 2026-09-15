import type { Metadata } from 'next'
import Link from 'next/link'
import { LogoutButton } from '@/components/auth/logout-button'
import { FormRegisterPreferenceTags } from '@/components/preference-tag/form-register-preference-tags'
import { Button } from '@/components/ui/button'
import { requireUser } from '@/server/auth/require-user'
import { getCachedUserPreferenceTags } from '@/server/http/routes/preference-tags/fetch-user-preference-tags'
import { getCachedTags } from '@/server/http/routes/tags/fetch-tags'

export const metadata: Metadata = {
  title: 'Minha conta',
}

export default async function AccountPage() {
  const user = await requireUser()
  const [{ tags }, { preferenceTags }] = await Promise.all([getCachedTags(), getCachedUserPreferenceTags(user.id)])

  const selectedTagIds = preferenceTags
    .filter((preference) => preference.status === 'ACTIVE')
    .map((preference) => preference.tagId)

  return (
    <div className="flex min-h-full w-full items-center justify-center px-4 py-8">
      <div className="w-full max-w-md space-y-8">
        <div className="space-y-4">
          <h1 className="font-heading text-2xl font-semibold">Minha conta</h1>
          <p className="text-sm text-muted-foreground">Sessão autenticada.</p>
          <dl className="space-y-2 text-sm">
            <div>
              <dt className="text-muted-foreground">Nome</dt>
              <dd>{user.name}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">E-mail</dt>
              <dd>{user.email}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Status</dt>
              <dd>{user.status}</dd>
            </div>
          </dl>
          <div className="flex flex-wrap gap-2">
            <Button nativeButton={false} variant="outline" render={<Link href="/conta/instituicoes" />}>
              Solicitar entrada em instituição
            </Button>
            <LogoutButton />
          </div>
        </div>

        <section className="space-y-4 border-t border-border pt-6">
          <h2 className="font-heading text-xl font-semibold">Tags preferidas</h2>
          <FormRegisterPreferenceTags tags={tags} selectedTagIds={selectedTagIds} />
        </section>
      </div>
    </div>
  )
}
