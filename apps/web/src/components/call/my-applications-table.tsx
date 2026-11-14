import Link from 'next/link'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { CallApplicationWithCall } from '@/utils/call-type'
import { applicationStatusLabels, formatCallDate, getCallStatusLabel } from '@/utils/call-utils'

type MyApplicationsTableProps = {
  data: CallApplicationWithCall[]
}

export function MyApplicationsTable({ data }: MyApplicationsTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Chamado</TableHead>
          <TableHead>Minha candidatura</TableHead>
          <TableHead>Status do chamado</TableHead>
          <TableHead>Prazo</TableHead>
          <TableHead>Enviada em</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.length > 0 ? (
          data.map((application) => (
            <TableRow key={application.id}>
              <TableCell>
                <Link
                  href={`/chamados/${application.call.id}`}
                  className="font-medium underline-offset-4 hover:underline"
                >
                  {application.call.title}
                </Link>
              </TableCell>
              <TableCell>{applicationStatusLabels[application.status]}</TableCell>
              <TableCell>{getCallStatusLabel(application.call)}</TableCell>
              <TableCell>{formatCallDate(application.call.applicationDeadline)}</TableCell>
              <TableCell>{formatCallDate(application.createdAt)}</TableCell>
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
              Você ainda não se candidatou a nenhum chamado.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  )
}
