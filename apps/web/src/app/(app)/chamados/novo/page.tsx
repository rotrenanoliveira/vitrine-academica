import type { Metadata } from 'next'
import Link from 'next/link'
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
import { getCachedTags } from '@/server/http/routes/tags/fetch-tags'

export const metadata: Metadata = {
  title: 'Novo chamado',
}

export default async function NewCallPage() {
  await requireUser()
  const { tags } = await getCachedTags()

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
              <BreadcrumbPage>Novo</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      <div className="flex flex-1 items-start justify-center px-4 py-8">
        <div className="w-full max-w-2xl border border-border p-6">
          <FormCall tags={tags} />
        </div>
      </div>
    </div>
  )
}