import Link from 'next/link'
import { FormRequestInstitutionMembership } from '@/components/institution/form-request-institution-membership'
import { Button } from '@/components/ui/button'
import type { Institution } from '@/utils/type'
import { InstitutionStatusActions } from './institution-status-actions'

const statusLabels: Record<Institution['status'], string> = {
  ACTIVE: 'Ativa',
  INACTIVE: 'Inativa',
  SUSPENDED: 'Suspensa',
  ARCHIVED: 'Arquivada',
}

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
  isAuthenticated: boolean
  alreadyMember: boolean
  canManage: boolean
}

export function InstitutionDetail({ institution, isAuthenticated, alreadyMember, canManage }: InstitutionDetailProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-xs tracking-wider text-muted-foreground uppercase">{statusLabels[institution.status]}</p>
        <h1 className="font-heading text-3xl font-semibold">{institution.name}</h1>
        <p className="text-sm text-muted-foreground">/{institution.slug}</p>
        <p className="whitespace-pre-wrap text-muted-foreground">{institution.description}</p>
      </div>

      <dl className="grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-muted-foreground">Tipo</dt>
          <dd>{typeLabels[institution.type]}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Origem</dt>
          <dd>{originLabels[institution.origin]}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Domínio</dt>
          <dd>{institution.domain ?? '—'}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Comprovante</dt>
          <dd>{institution.shouldProof ? 'Exigido' : 'Não exigido'}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Verificação</dt>
          <dd>{institution.shouldVerify ? 'Exigida' : 'Não exigida'}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Criada em</dt>
          <dd>{new Date(institution.createdAt).toLocaleString('pt-BR')}</dd>
        </div>
      </dl>

      {isAuthenticated && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-2">
            {canManage && (
              <>
                <Button nativeButton={false} render={<Link href={`/instituicoes/${institution.slug}/editar`} />}>
                  Editar
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
              </>
            )}
          </div>

          {canManage && <InstitutionStatusActions institution={institution} />}

          {!alreadyMember && (
            <FormRequestInstitutionMembership
              institutionId={institution.id}
              institutionSlug={institution.slug}
              shouldProof={institution.shouldProof}
              alreadyMember={alreadyMember}
            />
          )}
        </div>
      )}
    </div>
  )
}
