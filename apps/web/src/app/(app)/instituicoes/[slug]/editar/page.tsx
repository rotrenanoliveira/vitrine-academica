import type { Metadata } from 'next'
import Link from 'next/link'
import { FormUpdateInstitution } from '@/components/institution/form-update-institution'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { requireUser } from '@/server/auth/require-user'
import { getCachedInstitutionBySlug } from '@/server/http/routes/institutions/get-institution'

export const metadata: Metadata = {
  title: 'Editar instituição',
}

type PageProps = {
  params: Promise<{ slug: string }>
}

export default async function EditInstitutionPage({ params }: PageProps) {
  const { slug } = await params
  await requireUser()
  const { institution } = await getCachedInstitutionBySlug(slug)

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
              <BreadcrumbLink render={<Link href={`/instituicoes/${institution.slug}`} />}>Detalhe</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Editar</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      <div className="flex flex-1 items-start justify-center px-4 py-8">
        <div className="w-full max-w-lg border border-border p-6">
          <FormUpdateInstitution institution={institution} />
        </div>
      </div>
    </div>
  )
}
