import { cn } from 'cn'
import type { Metadata } from 'next'
import Link from 'next/link'
import { FormRegisterUser } from '@/components/auth/form-register-user'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

export const metadata: Metadata = {
  title: 'Cadastro',
  description: 'Crie sua conta na Vitrine Acadêmica.',
}

export default function RegisterUserPage() {
  return (
    <div className="flex h-screen w-full items-center justify-center px-4 py-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Registre sua conta</CardTitle>
          <CardDescription>Crie sua conta na Vitrine Acadêmica e faça parte da nossa comunidade.</CardDescription>
        </CardHeader>
        <CardContent>
          <FormRegisterUser />
        </CardContent>
        <CardFooter className="flex items-center justify-between px-6 pb-6 pt-0">
          <Link
            href="/termos-e-privacidade"
            target="_blank"
            className={cn(
              buttonVariants({ variant: 'link' }),
              'px-0 text-xs text-muted-foreground hover:text-foreground',
            )}
          >
            Termos e Privacidade
          </Link>
          <Link href="/sign-in" className={cn(buttonVariants({ variant: 'link' }))}>
            Já tem conta? Entrar
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}
