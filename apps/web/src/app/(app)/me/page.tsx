import type { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { DeleteUserAccountButton } from '@/components/user/delete-user-account-button'
import { ExportUserDataButton } from '@/components/user/export-user-data-button'
import { MeProfileCard } from '@/components/user/me-profile-card'
import { requireUser } from '@/server/auth/require-user'
import { MeApplicationsSection } from './_components/me-applications-section'
import { MeAuthorsSection } from './_components/me-authors-section'
import { MeCallsSection } from './_components/me-calls-section'
import { MeInstitutionsSection } from './_components/me-institutions-section'
import { MeInvitationsSection } from './_components/me-invitations-section'
import { MePointsSection } from './_components/me-points-section'
import { MePreferenceTagsSection } from './_components/me-preference-tags-section'
import { MeProjectsSection } from './_components/me-projects-section'
import { MeRatingsSection } from './_components/me-ratings-section'

export const metadata: Metadata = {
  title: 'Meu perfil',
}

export default async function MePage() {
  const user = await requireUser()

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-16 px-4 py-8">
      <div className="space-y-4">
        <p className="text-xs font-medium uppercase tracking-[0.28em] text-[#252422]/55">perfil</p>
        <h1 className="font-serif text-4xl leading-none tracking-[-0.04em] sm:text-5xl">Meu perfil</h1>
        <MeProfileCard user={user} />
      </div>

      <MeAuthorsSection />
      <MePointsSection />
      <MeProjectsSection />
      <MeCallsSection />
      <MeApplicationsSection />
      <MeInstitutionsSection />
      <MeInvitationsSection />
      <MeRatingsSection />
      <MePreferenceTagsSection userId={user.id} />

      <section className="space-y-4 border-t border-border pt-10">
        <h2 className="font-heading text-xl font-semibold">Privacidade e Dados (LGPD)</h2>
        <p className="text-sm text-muted-foreground">
          Você pode baixar uma cópia completa dos seus dados cadastrais, preferências e projetos em formato JSON.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <ExportUserDataButton />
          <Button nativeButton={false} variant="outline" render={<Link href="/termos-e-privacidade" target="_blank" />}>
            Termos e Privacidade
          </Button>
          <DeleteUserAccountButton />
        </div>
      </section>
    </div>
  )
}
