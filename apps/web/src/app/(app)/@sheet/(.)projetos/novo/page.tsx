'use client'

import { useRouter } from 'next/navigation'
import { FormRegisterProject } from '@/components/project/form-register-project'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'

export default function NewProjectSheetPage() {
  const router = useRouter()

  return (
    <Sheet
      defaultOpen
      onOpenChange={(open) => {
        if (!open) router.back()
      }}
    >
      <SheetContent side="right" className="p-6">
        <SheetTitle className="sr-only">Novo projeto</SheetTitle>
        <FormRegisterProject variant="sheet" />
      </SheetContent>
    </Sheet>
  )
}
