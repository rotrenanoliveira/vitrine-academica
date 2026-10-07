import type { Metadata } from 'next'
import Link from 'next/link'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { getCurrentUser } from '@/server/auth/require-user'
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

  let alreadyMember = false
  let canManage = false

  if (user) {
    const { members } = await getCachedMyInstitutionMemberships(user.id)
    alreadyMember = isActiveInstitutionMember(members, institution.id, user.id)
    canManage = canManageInstitution(members, institution.id, user.id)
  }

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex h-16 shrink-0 items-center gap-2 border-b border-border px-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink render={<Link href="/instituicoes" />}>Instituições</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Detalhe</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 p-4 py-8">
        <InstitutionDetail
          institution={institution}
          isAuthenticated={Boolean(user)}
          alreadyMember={alreadyMember}
          canManage={canManage}
        />
      </div>
    </div>
  )
}
