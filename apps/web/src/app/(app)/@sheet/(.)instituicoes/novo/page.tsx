'use client'

import { useRouter } from 'next/navigation'
import { FormRegisterInstitution } from '@/components/institution/form-register-institution'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'

export default function NewInstitutionSheetPage() {
  const router = useRouter()

  return (
    <Sheet
      defaultOpen
      onOpenChange={(open) => {
        if (!open) router.back()
      }}
    >
      <SheetContent side="right" className="p-6">
        <SheetTitle className="sr-only">Nova instituição</SheetTitle>
        <FormRegisterInstitution variant="sheet" />
      </SheetContent>
    </Sheet>
  )
}
