import type { Metadata } from 'next'
import Link from 'next/link'
import { FormRegisterProject } from '@/components/project/form-register-project'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { requireUser } from '@/server/auth/require-user'

export const metadata: Metadata = {
  title: 'Novo projeto',
}

export default async function NewProjectPage() {
  await requireUser()

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex h-16 shrink-0 items-center gap-2 border-b border-border px-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink render={<Link href="/projetos" />}>Projetos</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Novo</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      <div className="flex flex-1 items-start justify-center px-4 py-8">
        <div className="w-full max-w-lg border border-border p-6">
          <FormRegisterProject variant="page" />
        </div>
      </div>
    </div>
  )
}
