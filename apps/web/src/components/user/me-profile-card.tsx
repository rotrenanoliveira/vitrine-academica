import { User03Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import Link from 'next/link'
import { LogoutButton } from '@/components/auth/logout-button'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { User } from '@/utils/type'

const statusLabels: Record<User['status'], string> = {
  ACTIVE: 'Ativo',
  INACTIVE: 'Inativo',
  PENDING: 'Pendente',
  BLOCKED: 'Bloqueado',
  DELETED: 'Excluído',
}

type MeProfileCardProps = {
  user: User
}

export function MeProfileCard({ user }: MeProfileCardProps) {
  return (
    <div className="space-y-4">
      <Card className="w-full rounded-none bg-[#ebe6de] shadow-none">
        <CardHeader>
          <CardTitle className="flex items-center text-3xl normal-case tracking-normal">
            <HugeiconsIcon icon={User03Icon} className="size-6 shrink-0 text-muted-foreground" />
            <span className="ml-2">{user.name}</span>
          </CardTitle>
          <CardDescription>Sessão autenticada.</CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <dt className="text-muted-foreground">Nome</dt>
              <dd>{user.name}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">E-mail</dt>
              <dd>{user.email}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Status</dt>
              <dd>{statusLabels[user.status] ?? user.status}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2">
        <Button nativeButton={false} variant="outline" render={<Link href="/me/instituicoes/solicitar" />}>
          Solicitar entrada em instituição
        </Button>
        <LogoutButton />
      </div>
    </div>
  )
}
