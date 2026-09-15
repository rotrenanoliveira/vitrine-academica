import Image from 'next/image'
import Link from 'next/link'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { Project } from '@/utils/type'

const statusLabels: Record<Project['status'], string> = {
  SKETCH: 'Rascunho',
  SCHEDULED: 'Agendado',
  PUBLISHED: 'Publicado',
  ARCHIVED: 'Arquivado',
}

type ProjectWithCover = Project & { coverUrl: string | null }

type ProjectsTableProps = {
  data: ProjectWithCover[]
}

export function ProjectsTable({ data }: ProjectsTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-16">Capa</TableHead>
          <TableHead>Título</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Criado em</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.length > 0 ? (
          data.map((project) => (
            <TableRow key={project.id}>
              <TableCell>
                {project.coverUrl ? (
                  <Image
                    src={project.coverUrl}
                    alt={`Capa de ${project.title}`}
                    width={48}
                    height={48}
                    unoptimized
                    className="size-12 object-cover"
                  />
                ) : (
                  <div className="size-12 bg-muted" aria-hidden />
                )}
              </TableCell>
              <TableCell>
                <Link href={`/projetos/${project.id}`} className="font-medium underline-offset-4 hover:underline">
                  {project.title}
                </Link>
              </TableCell>
              <TableCell>{statusLabels[project.status]}</TableCell>
              <TableCell>{new Date(project.createdAt).toLocaleString('pt-BR')}</TableCell>
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
              Nenhum projeto encontrado.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  )
}
