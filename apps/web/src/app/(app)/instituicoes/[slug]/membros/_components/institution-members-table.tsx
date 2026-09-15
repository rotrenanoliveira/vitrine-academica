import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { InstitutionMember } from '@/utils/type'
import { UpdateMemberStatusButton } from './update-member-status-button'

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

type InstitutionMembersTableProps = {
  data: InstitutionMember[]
  institutionId: string
  institutionSlug: string
}

export function InstitutionMembersTable({ data, institutionId, institutionSlug }: InstitutionMembersTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Usuário</TableHead>
          <TableHead>Papel</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Criado em</TableHead>
          <TableHead className="text-right">Atualizar status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.length > 0 ? (
          data.map((member) => (
            <TableRow key={member.id}>
              <TableCell className="font-mono text-xs">{member.userId}</TableCell>
              <TableCell>{roleLabels[member.role]}</TableCell>
              <TableCell>{statusLabels[member.status]}</TableCell>
              <TableCell>{new Date(member.createdAt).toLocaleString('pt-BR')}</TableCell>
              <TableCell>
                <UpdateMemberStatusButton
                  institutionId={institutionId}
                  institutionSlug={institutionSlug}
                  memberId={member.id}
                  currentStatus={member.status}
                />
              </TableCell>
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
              Nenhum membro encontrado.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  )
}
