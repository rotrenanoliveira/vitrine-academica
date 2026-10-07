import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
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
import { getCachedMyInstitutionMemberships } from '@/server/http/routes/institutions/get-my-institution-memberships'
import { canManageInstitution } from '@/utils/can-manage-institution'
import { InstitutionMembersList } from './_components/institution-members-list'

export const metadata: Metadata = {
  title: 'Membros da instituição',
  description: 'Gerencie membros da instituição.',
}

type PageProps = {
  params: Promise<{ slug: string }>
}

export default async function InstitutionMembersPage({ params }: PageProps) {
  const { slug } = await params
  const user = await requireUser()
  const { institution } = await getCachedInstitutionBySlug(slug)

  const { members } = await getCachedMyInstitutionMemberships(user.id)
  const canManage = canManageInstitution(members, institution.id, user.id)

  if (!canManage) notFound()

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
              <BreadcrumbPage>Membros</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 p-4 py-8">
        <div className="space-y-1">
          <h1 className="font-heading text-2xl font-semibold">Membros</h1>
          <p className="text-sm text-muted-foreground">{institution.name}</p>
        </div>

        <Suspense fallback={<p className="text-sm text-muted-foreground">Carregando membros…</p>}>
          <InstitutionMembersList institutionId={institution.id} institutionSlug={institution.slug} />
        </Suspense>
      </div>
    </div>
  )
}
