import Link from 'next/link'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { Institution } from '@/utils/type'

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

type InstitutionsTableProps = {
  data: Institution[]
}

export function InstitutionsTable({ data }: InstitutionsTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nome</TableHead>
          <TableHead>Tipo</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Criada em</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.length > 0 ? (
          data.map((institution) => (
            <TableRow key={institution.id}>
              <TableCell>
                <Link
                  href={`/instituicoes/${institution.slug}`}
                  className="font-medium underline-offset-4 hover:underline"
                >
                  {institution.name}
                </Link>
              </TableCell>
              <TableCell>{typeLabels[institution.type]}</TableCell>
              <TableCell>{statusLabels[institution.status]}</TableCell>
              <TableCell>{new Date(institution.createdAt).toLocaleString('pt-BR')}</TableCell>
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
              Nenhuma instituição encontrada.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  )
}
