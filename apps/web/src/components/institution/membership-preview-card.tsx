import Link from 'next/link'
import { BeigeActionCard } from '@/components/me/beige-action-card'
import type { Institution, InstitutionMember } from '@/utils/type'

const roleLabels: Record<InstitutionMember['role'], string> = {
  STUDENT: 'Estudante',
  PROFESSOR: 'Professor',
  TEACHER: 'Docente',
  MANAGER: 'Gestor',
  ADMINISTRATIVE_OFFICE: 'Secretaria',
}

const statusLabels: Record<InstitutionMember['status'], string> = {
  ACTIVE: 'Ativo',
  INACTIVE: 'Inativo',
  SUSPENDED: 'Suspenso',
  FINISHED: 'Finalizado',
  PENDING: 'Pendente',
  REJECTED: 'Rejeitado',
}

type MembershipPreviewCardProps = {
  member: InstitutionMember
  institution: Pick<Institution, 'id' | 'slug' | 'name'> | null
}

export function MembershipPreviewCard({ member, institution }: MembershipPreviewCardProps) {
  return (
    <BeigeActionCard
      title={
        institution ? (
          <Link href={`/instituicoes/${institution.slug}`} className="underline-offset-4 hover:underline">
            {institution.name}
          </Link>
        ) : (
          <span className="text-muted-foreground">Instituição indisponível</span>
        )
      }
      meta={
        <>
          <p>{roleLabels[member.role]}</p>
          <p>{statusLabels[member.status]}</p>
          <p>Desde {new Date(member.createdAt).toLocaleDateString('pt-BR')}</p>
        </>
      }
    />
  )
}
