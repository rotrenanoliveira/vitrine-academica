import Link from 'next/link'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { CallWithSkills } from '@/utils/call-type'
import { formatCallDate, getCallStatusLabel } from '@/utils/call-utils'
import type { Tag } from '@/utils/type'

type CallsTableProps = {
  data: CallWithSkills[]
  tags: Tag[]
  showStatus?: boolean
}

export function CallsTable({ data, tags, showStatus = false }: CallsTableProps) {
  const tagNames = new Map(tags.map((tag) => [tag.id, tag.name]))

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Título</TableHead>
          <TableHead>Habilidades</TableHead>
          <TableHead>Prazo</TableHead>
          {showStatus && <TableHead>Status</TableHead>}
          <TableHead>Criado em</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.length > 0 ? (
          data.map((call) => (
            <TableRow key={call.id}>
              <TableCell>
                <Link href={`/chamados/${call.id}`} className="font-medium underline-offset-4 hover:underline">
                  {call.title}
                </Link>
              </TableCell>
              <TableCell>
                <ul className="flex flex-wrap gap-1">
                  {call.skills.map((skill) => (
                    <li key={skill.id} className="border border-border px-2 py-0.5 text-xs tracking-wider uppercase">
                      {tagNames.get(skill.tagId) ?? 'Habilidade'}
                    </li>
                  ))}
                </ul>
              </TableCell>
              <TableCell>{formatCallDate(call.applicationDeadline)}</TableCell>
              {showStatus && <TableCell>{getCallStatusLabel(call)}</TableCell>}
              <TableCell>{formatCallDate(call.createdAt)}</TableCell>
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell colSpan={showStatus ? 5 : 4} className="h-24 text-center text-muted-foreground">
              Nenhum chamado encontrado.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  )
}