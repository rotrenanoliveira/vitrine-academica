import { Card, CardContent } from '@/components/ui/card'
import type { CallWithSkills } from '@/utils/call-type'
import { formatCallDate } from '@/utils/call-utils'

type CallDetailsCardProps = {
  call: CallWithSkills
}

export function CallDetailsCard({ call }: CallDetailsCardProps) {
  return (
    <Card className="gap-0 overflow-hidden rounded-none bg-transparent p-0 shadow-none">
      <CardContent className="flex flex-col bg-[#ebe6de] p-5 sm:p-8">
        <h1 className="font-heading text-3xl font-semibold leading-tight tracking-[-0.03em]">{call.title}</h1>

        <div className="mt-3 space-y-1 text-xs uppercase tracking-wide text-[#252422]/65">
          <p>Publicado em {formatCallDate(call.createdAt)}</p>
          <p>Candidaturas até {formatCallDate(call.applicationDeadline)}</p>
        </div>

        <div className="mt-6 space-y-2">
          <h2 className="font-heading text-lg font-semibold tracking-[-0.03em]">Proposta</h2>
          <p className="whitespace-pre-wrap text-sm leading-6 text-[#252422]/65">{call.description}</p>
        </div>
      </CardContent>
    </Card>
  )
}
