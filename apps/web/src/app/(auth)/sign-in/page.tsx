import type { Metadata } from 'next'
import { FormSignIn } from '@/components/auth/form-sign-in'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export const metadata: Metadata = {
  title: 'Entrar',
  description: 'Acesse sua conta na Vitrine Acadêmica com um código enviado por e-mail.',
}

export default function SignInPage() {
  return (
    <div className="flex h-screen w-full items-center justify-center px-4 py-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Entrar</CardTitle>
          <CardDescription>Informe seu e-mail para receber um código de acesso.</CardDescription>
        </CardHeader>
        <CardContent>
          <FormSignIn />
        </CardContent>
      </Card>
    </div>
  )
}
