import type { Metadata } from 'next'
import { FormRequestInstitutionMembership } from '@/components/institution/form-request-institution-membership'
import { getCurrentUser } from '@/server/auth/require-user'
import { getCachedInstitutionBySlug } from '@/server/http/routes/institutions/get-institution'
import { getCachedMyInstitutionMemberships } from '@/server/http/routes/institutions/get-my-institution-memberships'
import { canManageInstitution, isActiveInstitutionMember } from '@/utils/can-manage-institution'
import { InstitutionDetail } from '../_components/institution-detail'
import { InstitutionEventsPreview } from './_components/institution-events-preview'
import { InstitutionProjectsPreview } from './_components/institution-projects-preview'

export const metadata: Metadata = {
  title: 'Detalhe da instituição',
}

type PageProps = {
  params: Promise<{ slug: string }>
}

export default async function InstitutionDetailPage({ params }: PageProps) {
  const { slug } = await params
  const [{ institution }, user] = await Promise.all([getCachedInstitutionBySlug(slug), getCurrentUser()])

  let alreadyMember = false
  let canManage = false

  if (user) {
    const { members } = await getCachedMyInstitutionMemberships(user.id)
    alreadyMember = isActiveInstitutionMember(members, institution.id, user.id)
    canManage = canManageInstitution(members, institution.id, user.id)
  }

  const isAuthenticated = Boolean(user)

  return (
    <div className="flex flex-1 flex-col">
      <div className="mx-auto flex w-full flex-1 flex-col gap-12 p-4 py-8">
        <InstitutionDetail institution={institution} canManage={canManage} />

        <InstitutionProjectsPreview slug={institution.slug} />

        <InstitutionEventsPreview institutionId={institution.id} institutionSlug={institution.slug} />

        {isAuthenticated && !alreadyMember && (
          <FormRequestInstitutionMembership
            institutionId={institution.id}
            institutionSlug={institution.slug}
            shouldProof={institution.shouldProof}
            alreadyMember={alreadyMember}
          />
        )}
      </div>
    </div>
  )
}
