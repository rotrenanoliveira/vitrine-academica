import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import z from 'zod'
import { FormCall } from '@/components/call/form-call'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { requireUser } from '@/server/auth/require-user'
import { getCall } from '@/server/http/routes/calls/get-call'
import { getCachedTags } from '@/server/http/routes/tags/fetch-tags'

export const metadata: Metadata = {
  title: 'Editar chamado',
}

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function EditCallPage({ params }: PageProps) {
  const { id } = await params

  if (!z.uuid().safeParse(id).success) notFound()

  const user = await requireUser()
  const [{ call }, { tags }] = await Promise.all([getCall(id), getCachedTags()])

  if (user.id !== call.authorId) notFound()
  if (call.status !== 'OPEN') redirect(`/chamados/${call.id}`)

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex h-16 shrink-0 items-center gap-2 border-b border-border px-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink render={<Link href="/chamados" />}>Chamados</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink render={<Link href={`/chamados/${call.id}`} />}>Chamado</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Editar</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      <div className="flex flex-1 items-start justify-center px-4 py-8">
        <div className="w-full max-w-2xl border border-border p-6">
          <FormCall tags={tags} call={call} />
        </div>
      </div>
    </div>
  )
}