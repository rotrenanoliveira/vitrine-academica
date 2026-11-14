import type { Metadata } from 'next'
import { FormRegisterInstitution } from '@/components/institution/form-register-institution'

import { requireUser } from '@/server/auth/require-user'

export const metadata: Metadata = {
  title: 'Nova instituição',
}

export default async function NewInstitutionPage() {
  await requireUser()

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="w-full max-w-2xl border border-border p-6">
        <FormRegisterInstitution variant="page" />
      </div>
    </div>
  )
}
