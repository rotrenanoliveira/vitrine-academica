import type { Metadata } from 'next'
import Link from 'next/link'
import { FormUnsubscribeByToken } from '@/components/newsletter/form-unsubscribe-by-token'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
  title: 'Cancelar inscrição',
  description: 'Cancele o acompanhamento de autores por e-mail',
}

type PageProps = {
  searchParams: Promise<{ token?: string }>
}

const tokenPattern = /^[a-f0-9]{64}$/

export default async function NewsletterCancelPage({ searchParams }: PageProps) {
  const { token } = await searchParams
  const isValidToken = Boolean(token && tokenPattern.test(token))

  return (
    <div className="flex min-h-full w-full items-center justify-center px-4 py-8">
      <div className="w-full max-w-md space-y-6">
        {isValidToken && token ? (
          <FormUnsubscribeByToken token={token} />
        ) : (
          <div className="space-y-4">
            <h1 className="font-heading text-2xl font-semibold">Link inválido</h1>
            <p className="text-sm text-muted-foreground">
              O link de cancelamento está incompleto ou inválido. Use o link enviado no e-mail ou gerencie seus
              acompanhamentos na conta.
            </p>
            <Button nativeButton={false} variant="outline" render={<Link href="/me" />}>
              Ir para meu perfil
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
