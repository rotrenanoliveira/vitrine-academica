'use client'

import { ArrowLeft02Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { useRouter } from 'next/navigation'
import { Button } from './ui/button'

interface NavBackPageProps {
  label: string
}

export function NavBackPage({ label }: NavBackPageProps) {
  const router = useRouter()

  function handleBack() {
    router.back()
  }

  return (
    <Button className="size-14 shrink-0" variant="outline" aria-label={label} onClick={handleBack}>
      <HugeiconsIcon icon={ArrowLeft02Icon} className="size-6" />
    </Button>
  )
}
