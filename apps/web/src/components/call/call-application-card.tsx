'use client'

import Link from 'next/link'
import type { ReactNode } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card'
import type { CallApplicationStatus } from '@/utils/call-type'
import { applicationStatusLabels, formatCallDate } from '@/utils/call-utils'

const DESCRIPTION_PREVIEW_LIMIT = 140

type CallApplicationCardProps = {
  applicantName: string
  applicantId?: string
  status: CallApplicationStatus
  message: string | null
  createdAt: string
  decidedAt?: string | null
  actions?: ReactNode
}

export function CallApplicationCard({
  applicantName,
  applicantId,
  status,
  message,
  createdAt,
  decidedAt = null,
  actions,
}: CallApplicationCardProps) {
  const isLongMessage = Boolean(message && message.length > DESCRIPTION_PREVIEW_LIMIT)

  return (
    <Card className="group h-full gap-0 overflow-hidden rounded-none bg-transparent p-0 shadow-none transition-transform duration-300 hover:-translate-y-1">
      <CardContent className="flex h-full min-h-56 flex-col bg-[#ebe6de] p-5">
        <h3 className="line-clamp-2 font-semibold text-xl leading-tight tracking-[-0.03em]">
          {applicantId ? (
            <Link href={`/p/${applicantId}`} className="underline underline-offset-2 hover:opacity-80">
              {applicantName}
            </Link>
          ) : (
            applicantName
          )}
        </h3>

        <div className="mt-2 space-y-1 text-xs uppercase tracking-wide text-[#252422]/65">
          <p>{applicationStatusLabels[status]}</p>
          <p>Candidatou-se em {formatCallDate(createdAt)}</p>
          {decidedAt ? <p>Decidida em {formatCallDate(decidedAt)}</p> : null}
        </div>

        {message ? (
          <div className="mt-3 text-sm leading-5 text-[#252422]/65">
            <p className="line-clamp-3">{message}</p>
            {isLongMessage ? (
              <HoverCard>
                <HoverCardTrigger
                  delay={200}
                  className="mt-1 cursor-pointer text-[#252422] underline-offset-2 hover:underline"
                  render={<button type="button" />}
                >
                  veja mais +
                </HoverCardTrigger>
                <HoverCardContent align="start" className="max-h-64 overflow-y-auto whitespace-pre-wrap">
                  {message}
                </HoverCardContent>
              </HoverCard>
            ) : null}
          </div>
        ) : null}

        {actions ? <div className="mt-auto pt-5">{actions}</div> : <div className="mt-auto" />}
      </CardContent>
    </Card>
  )
}
