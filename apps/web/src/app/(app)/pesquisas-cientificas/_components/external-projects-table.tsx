import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { ExternalProject } from '@/utils/type'

type ExternalProjectsTableProps = {
  data: ExternalProject[]
}

export function ExternalProjectsTable({ data }: ExternalProjectsTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Título</TableHead>
          <TableHead>Autores</TableHead>
          <TableHead>Publicado em</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.length > 0 ? (
          data.map((project) => (
            <TableRow key={project.externalUrl}>
              <TableCell>
                <a
                  href={project.externalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium underline-offset-4 hover:underline"
                >
                  {project.title}
                </a>
              </TableCell>
              <TableCell>{project.authors.join(', ') || '—'}</TableCell>
              <TableCell>{project.publishedIn || '—'}</TableCell>
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
              Nenhuma pesquisa encontrada.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  )
}
