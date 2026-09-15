import type { Metadata } from 'next'
import { DM_Sans, Geist, Geist_Mono, Outfit } from 'next/font/google'
import { Toaster } from 'sonner'
import './globals.css'
import { cn } from '@/lib/utils'

const outfitHeading = Outfit({ subsets: ['latin'], variable: '--font-heading' })

const dmSans = DM_Sans({ subsets: ['latin'], variable: '--font-sans' })

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Vitrine Acadêmica',
  description: 'Vitrine Acadêmica',
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang="pt-BR"
      className={cn(
        'h-full',
        'antialiased',
        geistSans.variable,
        geistMono.variable,
        'font-sans',
        dmSans.variable,
        outfitHeading.variable,
      )}
    >
      <body className="min-h-full">
        {children}
        <Toaster closeButton position="top-right" />
      </body>
    </html>
  )
}
