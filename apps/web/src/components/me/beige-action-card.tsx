import type { ReactNode } from 'react'
import { Card, CardContent } from '@/components/ui/card'

type BeigeActionCardProps = {
  title: ReactNode
  meta?: ReactNode
  description?: ReactNode
  actions?: ReactNode
}

export function BeigeActionCard({ title, meta, description, actions }: BeigeActionCardProps) {
  return (
    <Card className="group h-full gap-0 overflow-hidden rounded-none bg-transparent p-0 shadow-none transition-transform duration-300 hover:-translate-y-1">
      <CardContent className="flex h-full min-h-56 flex-col bg-[#ebe6de] p-5">
        <h3 className="line-clamp-2 font-semibold text-xl leading-tight tracking-[-0.03em]">{title}</h3>

        {meta ? <div className="mt-2 space-y-1 text-xs uppercase tracking-wide text-[#252422]/65">{meta}</div> : null}

        {description ? <div className="mt-3 text-sm leading-5 text-[#252422]/65">{description}</div> : null}

        {actions ? <div className="mt-auto pt-5">{actions}</div> : <div className="mt-auto" />}
      </CardContent>
    </Card>
  )
}
