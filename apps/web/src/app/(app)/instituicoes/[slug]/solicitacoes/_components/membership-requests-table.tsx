import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { InstitutionMembershipRequest } from '@/utils/type'
import { ApproveMembershipRequestButton } from './approve-membership-request-button'
import { RejectMembershipRequestButton } from './reject-membership-request-button'

const roleLabels: Record<InstitutionMembershipRequest['role'], string> = {
  STUDENT: 'Estudante',
  PROFESSOR: 'Professor',
  TEACHER: 'Docente',
  MANAGER: 'Gestor',
  ADMINISTRATIVE_OFFICE: 'Secretaria',
}

const statusLabels: Record<InstitutionMembershipRequest['status'], string> = {
  PENDING: 'Pendente',
  APPROVED: 'Aprovada',
  REJECTED: 'Rejeitada',
}

type MembershipRequestRow = InstitutionMembershipRequest & {
  proofUrl: string | null
}

type MembershipRequestsTableProps = {
  data: MembershipRequestRow[]
  institutionId: string
  institutionSlug: string
}

export function MembershipRequestsTable({ data, institutionId, institutionSlug }: MembershipRequestsTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Usuário</TableHead>
          <TableHead>Papel</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Comprovante</TableHead>
          <TableHead>Criada em</TableHead>
          <TableHead className="text-right">Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.length > 0 ? (
          data.map((request) => (
            <TableRow key={request.id}>
              <TableCell className="font-mono text-xs">{request.userId}</TableCell>
              <TableCell>{roleLabels[request.role]}</TableCell>
              <TableCell>{statusLabels[request.status]}</TableCell>
              <TableCell>
                {request.proofUrl ? (
                  <a
                    href={request.proofUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm underline underline-offset-4"
                  >
                    Ver comprovante
                  </a>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell>{new Date(request.createdAt).toLocaleString('pt-BR')}</TableCell>
              <TableCell>
                {request.status === 'PENDING' ? (
                  <div className="flex justify-end gap-2">
                    <ApproveMembershipRequestButton
                      institutionId={institutionId}
                      institutionSlug={institutionSlug}
                      requestId={request.id}
                    />
                    <RejectMembershipRequestButton
                      institutionId={institutionId}
                      institutionSlug={institutionSlug}
                      requestId={request.id}
                    />
                  </div>
                ) : null}
              </TableCell>
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
              Nenhuma solicitação.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  )
}
