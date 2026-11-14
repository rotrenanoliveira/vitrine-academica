'use client'

import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card'
import type { CallListItem } from '@/utils/call-type'
import { formatCallDate, getCallStatusLabel } from '@/utils/call-utils'

type CallGalleryCardProps = {
  call: CallListItem
}

export function CallGalleryCard({ call }: CallGalleryCardProps) {
  const href = `/chamados/${call.id}`
  const description = call.description.trim() || null
  const visibleSkills = call.skills.slice(0, 2)
  const remainingSkills = call.skills.slice(2)
  const remainingCount = remainingSkills.length

  return (
    <Card className="group relative h-full gap-0 overflow-hidden rounded-none bg-transparent p-0 shadow-none transition-transform duration-300 hover:-translate-y-1">
      <Link href={href} className="absolute inset-0 z-0" aria-label={`Abrir chamado ${call.title}`} />
      <CardContent className="pointer-events-none relative z-0 flex h-full min-h-56 flex-col bg-[#ebe6de] p-5">
        <p className="mb-3 line-clamp-1 text-[10px] uppercase tracking-[0.2em] text-[#252422]/55">
          {getCallStatusLabel(call)}
        </p>
        <h3 className="line-clamp-2 font-semibold text-xl leading-tight tracking-[-0.03em] group-hover:underline">
          {call.title}
        </h3>
        {description ? <p className="mt-3 line-clamp-4 text-sm leading-6 text-[#252422]/65">{description}</p> : null}

        {call.skills.length > 0 ? (
          <ul className="pointer-events-auto relative z-10 mt-4 flex flex-wrap gap-1">
            {visibleSkills.map((skill) => (
              <li key={skill} className="border border-[#252422]/15 px-2 py-0.5 text-xs tracking-wider uppercase">
                {skill}
              </li>
            ))}
            {remainingCount > 0 ? (
              <li>
                <HoverCard>
                  <HoverCardTrigger
                    delay={200}
                    className="cursor-pointer border border-border px-2 py-0.5 text-xs tracking-wider uppercase underline-offset-2 hover:underline"
                    render={<button type="button" />}
                  >
                    + {remainingCount} skills
                  </HoverCardTrigger>
                  <HoverCardContent align="start" className="w-auto max-w-64 p-3">
                    <ul className="flex flex-wrap gap-1">
                      {remainingSkills.map((skill) => (
                        <li key={skill} className="border border-border px-2 py-0.5 text-xs tracking-wider uppercase">
                          {skill}
                        </li>
                      ))}
                    </ul>
                  </HoverCardContent>
                </HoverCard>
              </li>
            ) : null}
          </ul>
        ) : null}

        <div className="mt-auto space-y-2 pt-5">
          <p className="text-sm text-[#252422]/55">Prazo: {formatCallDate(call.applicationDeadline)}</p>
          {call.projectSlug ? (
            <Link
              href={`/projetos/${call.projectSlug}`}
              className="pointer-events-auto relative z-10 text-sm text-[#252422] underline-offset-2 hover:underline"
            >
              Ver projeto
            </Link>
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}
