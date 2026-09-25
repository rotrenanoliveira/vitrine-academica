import type { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
  title: 'Documentos Legais | Vitrine Acadêmica',
  description: 'Acesse os Termos de Uso e a Política de Privacidade da plataforma Vitrine Acadêmica.',
}

export default function DocumentosLegaisPage() {
  return (
    <main className="flex min-h-[calc(100vh-8rem)] w-full items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6 text-center">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Documentos Legais</h1>
          <p className="text-sm text-muted-foreground">
            Consulte nossos Termos de Uso e Política de Privacidade (LGPD).
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button
            nativeButton={false}
            variant="outline"
            className="w-full sm:w-auto"
            render={<Link href="/termos-de-uso" />}
          >
            Termos de Uso
          </Button>

          <Button
            nativeButton={false}
            variant="outline"
            className="w-full sm:w-auto"
            render={<Link href="/politica-de-privacidade" />}
          >
            Política de Privacidade
          </Button>
        </div>
      </div>
    </main>
  )
}
