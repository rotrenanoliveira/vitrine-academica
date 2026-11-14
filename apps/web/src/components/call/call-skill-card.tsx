'use client'

import { Card, CardContent } from '@/components/ui/card'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card'

const DESCRIPTION_PREVIEW_LIMIT = 140

type CallSkillCardProps = {
  name: string
  description: string | null
}

export function CallSkillCard({ name, description }: CallSkillCardProps) {
  const isLongDescription = Boolean(description && description.length > DESCRIPTION_PREVIEW_LIMIT)

  return (
    <Card className="group h-full gap-0 overflow-hidden rounded-none bg-transparent p-0 shadow-none transition-transform duration-300 hover:-translate-y-1">
      <CardContent className="flex h-full flex-col bg-[#ebe6de] p-5">
        <h3 className="line-clamp-2 font-semibold text-xl leading-tight tracking-[-0.03em]">{name}</h3>

        {description ? (
          <div className="mt-3 text-sm leading-5 text-[#252422]/65">
            <p className="line-clamp-3">{description}</p>
            {isLongDescription ? (
              <HoverCard>
                <HoverCardTrigger
                  delay={200}
                  className="mt-1 cursor-pointer text-[#252422] underline-offset-2 hover:underline"
                  render={<button type="button" />}
                >
                  veja mais +
                </HoverCardTrigger>
                <HoverCardContent align="start" className="max-h-64 overflow-y-auto whitespace-pre-wrap">
                  {description}
                </HoverCardContent>
              </HoverCard>
            ) : null}
          </div>
        ) : null}

        <div className="mt-auto" />
      </CardContent>
    </Card>
  )
}
