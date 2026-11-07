import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

type BigNumberProps = {
  label: string
  value: number
}

export function BigNumber({ label, value }: BigNumberProps) {
  return (
    <Card>
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardTitle className="font-heading text-3xl font-semibold tabular-nums">
          {value.toLocaleString('pt-BR')}
        </CardTitle>
      </CardHeader>
    </Card>
  )
}
