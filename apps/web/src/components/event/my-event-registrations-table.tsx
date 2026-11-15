import Link from 'next/link'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { EventRegistrationWithContext } from '@/utils/type'
import { eventRegistrationStatusLabels } from './event-utils'

type MyEventRegistrationsTableProps = {
  data: EventRegistrationWithContext[]
}

export function MyEventRegistrationsTable({ data }: MyEventRegistrationsTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Evento</TableHead>
          <TableHead>Projeto</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Motivo</TableHead>
          <TableHead>Inscrito em</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.length > 0 ? (
          data.map((registration) => (
            <TableRow key={registration.id}>
              <TableCell>
                <Link
                  href={`/eventos/${registration.event.slug}`}
                  className="font-medium underline-offset-4 hover:underline"
                >
                  {registration.event.name ?? 'Evento sem nome'}
                </Link>
              </TableCell>
              <TableCell>
                <Link href={`/projetos/${registration.project.slug}`} className="underline-offset-4 hover:underline">
                  {registration.project.title}
                </Link>
              </TableCell>
              <TableCell>{eventRegistrationStatusLabels[registration.status]}</TableCell>
              <TableCell>{registration.reviewReason ?? '—'}</TableCell>
              <TableCell>{new Date(registration.registeredAt).toLocaleDateString('pt-BR')}</TableCell>
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
              Você ainda não inscreveu nenhum projeto em um evento.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  )
}
