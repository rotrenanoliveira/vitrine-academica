import Link from 'next/link'
import { cn } from '@/lib/utils'
import type { Tag } from '@/utils/type'

type CallsTagFilterProps = {
  tags: Tag[]
  activeTagId?: string
}

const chipClassName = 'border border-border px-3 py-1 text-xs tracking-wider uppercase'
const activeClassName = 'bg-primary text-primary-foreground'

export function CallsTagFilter({ tags, activeTagId }: CallsTagFilterProps) {
  return (
    <nav aria-label="Filtrar por habilidade" className="flex flex-wrap gap-2">
      <Link href="/chamados" className={cn(chipClassName, !activeTagId && activeClassName)}>
        Todas
      </Link>
      {tags.map((tag) => (
        <Link
          key={tag.id}
          href={`/chamados?tag=${tag.id}`}
          className={cn(chipClassName, activeTagId === tag.id && activeClassName)}
        >
          {tag.name}
        </Link>
      ))}
    </nav>
  )
}
