import Link from 'next/link'

type ProjectAuthorLink = {
  id: string
  name: string
}

type ProjectAuthorsProps = {
  author: ProjectAuthorLink
  coauthors?: ProjectAuthorLink[]
}

export function ProjectAuthors({ author, coauthors = [] }: ProjectAuthorsProps) {
  return (
    <div className="space-y-2 text-sm">
      <p>
        <span className="text-muted-foreground">Autor · </span>
        <Link href={`/p/${author.id}`} className="font-medium underline-offset-4 hover:underline">
          {author.name}
        </Link>
      </p>
      {coauthors.length > 0 ? (
        <p>
          <span className="text-muted-foreground">{coauthors.length === 1 ? 'Coautor' : 'Coautores'} · </span>
          {coauthors.map((coauthor, index) => (
            <span key={coauthor.id}>
              {index > 0 ? <span className="text-muted-foreground"> · </span> : null}
              <Link href={`/p/${coauthor.id}`} className="font-medium underline-offset-4 hover:underline">
                {coauthor.name}
              </Link>
            </span>
          ))}
        </p>
      ) : null}
    </div>
  )
}
