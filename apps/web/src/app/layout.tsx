import type { Metadata, Viewport } from 'next'
import { DM_Sans, Geist, Geist_Mono, Outfit } from 'next/font/google'
import './globals.css'
import { cn } from '@/lib/utils'
import { Providers } from './providers'

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
  metadataBase: new URL('https://vitrineacademica.com'),
  title: {
    default: 'Vitrine Acadêmica',
    template: '%s | Vitrine Acadêmica',
  },
  description: 'Galeria virtual de projetos.',
  applicationName: 'Vitrine Acadêmica',
  icons: {
    icon: [
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/icon.png', sizes: '180x180', type: 'image/png' }],
  },
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    siteName: 'Vitrine Acadêmica',
    title: 'Vitrine Acadêmica',
    description: 'Galeria virtual de projetos.',
    images: [{ url: '/og-image.png', width: 2047, height: 1151, alt: 'Vitrine Acadêmica' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Vitrine Acadêmica',
    description: 'Galeria virtual de projetos.',
    images: ['/og-image.png'],
  },
}

export const viewport: Viewport = {
  themeColor: '#1a1a1a',
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
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
