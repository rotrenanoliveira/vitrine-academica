import { UniversityIcon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

import type { Institution } from '@/utils/type'

const typeLabels: Record<Institution['type'], string> = {
  UNIVERSITY: 'Universidade',
  COLLEGE: 'Faculdade',
  CENTER: 'Centro',
  TECHNICAL_COLLEGE: 'Escola técnica',
  OTHER: 'Outro',
}

const originLabels: Record<Institution['origin'], string> = {
  SEED: 'Seed',
  USER_REGISTRATION: 'Cadastro de usuário',
  ADMIN: 'Admin',
}

type InstitutionDetailProps = {
  institution: Institution
  canManage: boolean
}

export function InstitutionDetail({ institution, canManage }: InstitutionDetailProps) {
  return (
    <div className="space-y-6">
      <Card className="w-full rounded-none bg-[#ebe6de] shadow-none">
        <CardHeader>
          <CardTitle className="text-3xl normal-case tracking-normal flex items-center">
            <HugeiconsIcon icon={UniversityIcon} className="size-6 shrink-0 text-muted-foreground" />
            <span className="ml-2">{institution.name}</span>
          </CardTitle>
          <CardDescription className="whitespace-pre-wrap">{institution.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <div>
              <dt className="text-muted-foreground">Tipo</dt>
              <dd>{typeLabels[institution.type]}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Domínio</dt>
              <dd>{institution.domain ?? '—'}</dd>
            </div>

            {canManage && (
              <>
                <div>
                  <dt className="text-muted-foreground">Registrada em</dt>
                  <dd>{new Date(institution.createdAt).toLocaleString('pt-BR')}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Origem de cadastro</dt>
                  <dd>{originLabels[institution.origin]}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Verificação</dt>
                  <dd>{institution.shouldVerify ? 'Exigida' : 'Não exigida'}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Comprovante</dt>
                  <dd>{institution.shouldProof ? 'Exigido' : 'Não exigido'}</dd>
                </div>
              </>
            )}
          </dl>
        </CardContent>
      </Card>

      {canManage && (
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" nativeButton={false} render={<Link href="/eventos/novo" />}>
            Novo evento
          </Button>

          <Button
            variant="outline"
            nativeButton={false}
            render={<Link href={`/instituicoes/${institution.slug}/membros`} />}
          >
            Membros
          </Button>
          <Button
            variant="outline"
            nativeButton={false}
            render={<Link href={`/instituicoes/${institution.slug}/solicitacoes`} />}
          >
            Solicitações
          </Button>
          <Button
            variant="outline"
            nativeButton={false}
            render={<Link href={`/instituicoes/${institution.slug}/editar`} />}
          >
            Editar
          </Button>
        </div>
      )}
    </div>
  )
}
