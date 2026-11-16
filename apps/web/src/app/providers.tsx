'use client'

import { QueryClientProvider } from '@tanstack/react-query'
import { NuqsAdapter } from 'nuqs/adapters/next/app'
import { Toaster } from 'sonner'
import { reactQuery } from '@/lib/react-query'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <NuqsAdapter>
      <Toaster closeButton position="top-right" />
      <QueryClientProvider client={reactQuery}>{children}</QueryClientProvider>
    </NuqsAdapter>
  )
}
