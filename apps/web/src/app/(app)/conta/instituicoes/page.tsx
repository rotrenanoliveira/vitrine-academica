import type { Metadata } from 'next'
import Link from 'next/link'
import { FormRequestInstitutionMembership } from '@/components/institution/form-request-institution-membership'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { requireUser } from '@/server/auth/require-user'
import { getCachedInstitutions } from '@/server/http/routes/institutions/fetch-institutions'
import { getCachedMyInstitutionMemberships } from '@/server/http/routes/institutions/get-my-institution-memberships'
import { isActiveInstitutionMember } from '@/utils/can-manage-institution'

export const metadata: Metadata = {
  title: 'Solicitar entrada em instituição',
  description: 'Peça para fazer parte de uma instituição acadêmica.',
}

export default async function AccountInstitutionsPage() {
  const user = await requireUser()
  const [{ institutions }, { members }] = await Promise.all([
    getCachedInstitutions(),
    getCachedMyInstitutionMemberships(user.id),
  ])

  const eligibleInstitutions = institutions
    .filter(
      (institution) => institution.status === 'ACTIVE' && !isActiveInstitutionMember(members, institution.id, user.id),
    )
    .map((institution) => ({
      id: institution.id,
      slug: institution.slug,
      name: institution.name,
      shouldProof: institution.shouldProof,
    }))

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex h-16 shrink-0 items-center gap-2 border-b border-border px-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink render={<Link href="/conta" />}>Conta</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Instituições</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-4 py-8">
        <div className="space-y-1">
          <h1 className="font-heading text-2xl font-semibold">Solicitar entrada</h1>
          <p className="text-sm text-muted-foreground">
            Escolha uma instituição da qual você ainda não faz parte e envie sua solicitação.
          </p>
        </div>

        <FormRequestInstitutionMembership variant="picker" institutions={eligibleInstitutions} />
      </div>
    </div>
  )
}
