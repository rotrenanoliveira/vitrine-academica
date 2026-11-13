import type { Metadata } from 'next'
import Link from 'next/link'
import { LogoutButton } from '@/components/auth/logout-button'
import { MySubscriptionsList } from '@/components/newsletter/my-subscriptions-list'
import { MyPointsTransactions } from '@/components/points/my-points-transactions'
import { FormRegisterPreferenceTags } from '@/components/preference-tag/form-register-preference-tags'
import { Button } from '@/components/ui/button'
import { DeleteUserAccountButton } from '@/components/user/delete-user-account-button'
import { ExportUserDataButton } from '@/components/user/export-user-data-button'
import { requireUser } from '@/server/auth/require-user'
import { getCachedMyPointsBalance } from '@/server/http/routes/points/get-my-points-balance'
import { getCachedUserPreferenceTags } from '@/server/http/routes/preference-tags/fetch-user-preference-tags'
import { getCachedTags } from '@/server/http/routes/tags/fetch-tags'
import { PROMOTION_COST, PROMOTION_DURATION_DAYS } from '@/utils/point-type'

export const metadata: Metadata = {
  title: 'Minha conta',
}

export default async function AccountPage() {
  const user = await requireUser()
  const [{ tags }, { preferenceTags }, { balance }] = await Promise.all([
    getCachedTags(),
    getCachedUserPreferenceTags(user.id),
    getCachedMyPointsBalance(),
  ])

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
          <h2 className="font-heading text-xl font-semibold">Pontos</h2>
          <p className="text-3xl font-semibold tabular-nums tracking-tight">{balance}</p>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              Você ganha pontos quando o seu projeto (ou um projeto em que é coautor com convite aceito) recebe a
              primeira estrela de alguém. Remover e dar a estrela de novo não gera pontos novos.
            </p>
            <p>
              O peso da estrela é <span className="font-medium text-foreground">1</span> para usuário comum e aluno, e{' '}
              <span className="font-medium text-foreground">5</span> para professor ou docente com vínculo institucional
              ativo.
            </p>
            <p>
              Promover um projeto custa{' '}
              <span className="font-medium text-foreground tabular-nums">{PROMOTION_COST}</span> pontos e permanece em
              destaque por {PROMOTION_DURATION_DAYS} dias.
            </p>
          </div>
          <div className="space-y-3">
            <h3 className="text-sm font-medium">Movimentações recentes</h3>
            <MyPointsTransactions />
          </div>
        </section>

        <section className="space-y-4 border-t border-border pt-6">
          <h2 className="font-heading text-xl font-semibold">Autores que acompanho</h2>
          <p className="text-sm text-muted-foreground">
            Receba um e-mail quando estes autores publicarem novos projetos.
          </p>
          <MySubscriptionsList />
        </section>

        <section className="space-y-4 border-t border-border pt-6">
          <h2 className="font-heading text-xl font-semibold">Tags preferidas</h2>
          <FormRegisterPreferenceTags tags={tags} selectedTagIds={selectedTagIds} />
        </section>

        <section className="space-y-4 border-t border-border pt-6">
          <h2 className="font-heading text-xl font-semibold">Privacidade e Dados (LGPD)</h2>
          <p className="text-sm text-muted-foreground">
            Você pode baixar uma cópia completa dos seus dados cadastrais, preferências e projetos em formato JSON.
          </p>
          <ExportUserDataButton />
          <div>
            <Button
              nativeButton={false}
              variant="outline"
              render={<Link href="/termos-e-privacidade" target="_blank" />}
            >
              Termos e Privacidade
            </Button>
          </div>
          <DeleteUserAccountButton />
        </section>
      </div>
    </div>
  )
}
