import Link from 'next/link'
import { Fragment } from 'react'
import type { LegalBlock, LegalDocument, LegalInline } from '@/content/legal/types'
import { cn } from '@/lib/utils'

type LegalDocumentPageProps = {
  data: LegalDocument
}

function InlineContent({ content }: { content: LegalInline }) {
  if (typeof content === 'string') {
    return content
  }

  return content.map((part, index) =>
    typeof part === 'string' ? (
      <Fragment key={index}>{part}</Fragment>
    ) : (
      <Link key={index} href={part.href} className="font-medium text-foreground underline underline-offset-4">
        {part.text}
      </Link>
    ),
  )
}

function Lead({ text }: { text?: string }) {
  if (!text) {
    return null
  }

  return (
    <>
      <strong className="text-foreground">{text}</strong>{' '}
    </>
  )
}

function Block({ block }: { block: LegalBlock }) {
  if (block.type === 'paragraph') {
    return (
      <p>
        <Lead text={block.number} />
        <InlineContent content={block.content} />
      </p>
    )
  }

  if (block.type === 'list') {
    return (
      <ul className="list-disc space-y-2 pl-6">
        {block.items.map((item, index) => (
          <li key={index}>
            <Lead text={item.label} />
            <InlineContent content={item.content} />
          </li>
        ))}
      </ul>
    )
  }

  const lastColumn = block.columns.length - 1

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[680px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-border text-foreground">
            {block.columns.map((column, columnIndex) => (
              <th key={column} className={cn('py-3', columnIndex < lastColumn && 'pr-4')}>
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {block.rows.map((row) => (
            <tr key={row[0]}>
              {row.map((cell, cellIndex) => (
                <td key={cell} className={cn('py-3', cellIndex < lastColumn && 'pr-4')}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function LegalDocumentPage({ data }: LegalDocumentPageProps) {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
      <header className="mb-10 border-b border-border pb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">{data.title}</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Última atualização: {data.lastUpdated} · Versão {data.version}
        </p>
        <p className="mt-6 leading-relaxed text-foreground">
          <InlineContent content={data.intro} />
        </p>
      </header>

      <div className="space-y-10">
        {data.sections.map((section, sectionIndex) => {
          const id = `secao-${sectionIndex + 1}`

          return (
            <section key={id} aria-labelledby={id} className="space-y-4">
              <h2 id={id} className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                {section.title}
              </h2>
              <div className="space-y-3 leading-relaxed text-muted-foreground">
                {section.blocks.map((block, blockIndex) => (
                  <Block key={blockIndex} block={block} />
                ))}
              </div>
            </section>
          )
        })}
      </div>
    </main>
  )
}
