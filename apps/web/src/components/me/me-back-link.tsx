import { ArrowLeft02Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

type MeBackLinkProps = {
  label?: string
}

export function MeBackLink({ label = 'Voltar para meu perfil' }: MeBackLinkProps) {
  return (
    <Button
      className="size-14 shrink-0"
      variant="outline"
      nativeButton={false}
      render={<Link href="/me" />}
      aria-label={label}
    >
      <HugeiconsIcon icon={ArrowLeft02Icon} className="size-6" />
    </Button>
  )
}
