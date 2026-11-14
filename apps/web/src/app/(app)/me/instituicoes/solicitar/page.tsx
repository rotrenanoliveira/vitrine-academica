import type { Metadata } from 'next'
import { MeBackLink } from '@/components/me/me-back-link'
import { requireUser } from '@/server/auth/require-user'
import { RequestMembershipPicker } from './_components/request-membership-picker'

export const metadata: Metadata = {
  title: 'Solicitar entrada em instituição',
  description: 'Peça para fazer parte de uma instituição acadêmica.',
}

export default async function MeRequestInstitutionPage() {
  const user = await requireUser()

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-4 py-8">
      <MeBackLink />
      <div className="space-y-1">
        <h1 className="font-heading text-2xl font-semibold">Solicitar entrada</h1>
        <p className="text-sm text-muted-foreground">
          Escolha uma instituição da qual você ainda não faz parte e envie sua solicitação.
        </p>
      </div>
      <RequestMembershipPicker userId={user.id} />
    </div>
  )
}
