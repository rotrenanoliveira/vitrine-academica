import type { Metadata } from 'next'
import { getCurrentUser } from '@/server/auth/require-user'
import { getCachedInstitutionEvents } from '@/server/http/routes/events/fetch-institution-events'
import { fetchInstitutionProjects } from '@/server/http/routes/institutions/fetch-institution-projects'
import { getCachedInstitutionBySlug } from '@/server/http/routes/institutions/get-institution'
import { getCachedMyInstitutionMemberships } from '@/server/http/routes/institutions/get-my-institution-memberships'
import { canManageInstitution, isActiveInstitutionMember } from '@/utils/can-manage-institution'
import { InstitutionDetail } from '../_components/institution-detail'

export const metadata: Metadata = {
  title: 'Detalhe da instituição',
}

type PageProps = {
  params: Promise<{ slug: string }>
}

export default async function InstitutionDetailPage({ params }: PageProps) {
  const { slug } = await params
  const [{ institution }, user] = await Promise.all([getCachedInstitutionBySlug(slug), getCurrentUser()])
  const [{ events }, { projects }] = await Promise.all([
    getCachedInstitutionEvents(institution.id),
    fetchInstitutionProjects({ slug, status: 'PUBLISHED', page: 1, limit: 3 }),
  ])

  let alreadyMember = false
  let canManage = false

  if (user) {
    const { members } = await getCachedMyInstitutionMemberships(user.id)
    alreadyMember = isActiveInstitutionMember(members, institution.id, user.id)
    canManage = canManageInstitution(members, institution.id, user.id)
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="mx-auto flex w-full flex-1 flex-col gap-6 p-4 py-8">
        <InstitutionDetail
          institution={institution}
          projects={projects}
          events={events}
          isAuthenticated={Boolean(user)}
          alreadyMember={alreadyMember}
          canManage={canManage}
        />
      </div>
    </div>
  )
}
