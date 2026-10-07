import Link from 'next/link'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
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

type MembershipRow = InstitutionMember & {
  institution: Pick<Institution, 'id' | 'slug' | 'name'> | null
}

type MyMembershipsTableProps = {
  data: MembershipRow[]
}

export function MyMembershipsTable({ data }: MyMembershipsTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Instituição</TableHead>
          <TableHead>Papel</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Desde</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.length > 0 ? (
          data.map((membership) => (
            <TableRow key={membership.id}>
              <TableCell>
                {membership.institution ? (
                  <Link
                    href={`/instituicoes/${membership.institution.slug}`}
                    className="font-medium underline-offset-4 hover:underline"
                  >
                    {membership.institution.name}
                  </Link>
                ) : (
                  <span className="font-mono text-xs">{membership.institutionId}</span>
                )}
              </TableCell>
              <TableCell>{roleLabels[membership.role]}</TableCell>
              <TableCell>{statusLabels[membership.status]}</TableCell>
              <TableCell>{new Date(membership.createdAt).toLocaleString('pt-BR')}</TableCell>
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
              Você ainda não participa de nenhuma instituição.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  )
}
