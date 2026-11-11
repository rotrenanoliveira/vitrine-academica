'use client'

import { QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { reactQuery } from '@/lib/react-query'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Toaster closeButton position="top-right" />
      <QueryClientProvider client={reactQuery}>{children}</QueryClientProvider>
    </>
  )
}
