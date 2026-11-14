import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Vitrine Acadêmica',
    short_name: 'Vitrine Acadêmica',
    description: 'Galeria virtual de projetos.',
    start_url: '/',
    display: 'standalone',
    lang: 'pt-BR',
    background_color: '#f4f1eb',
    theme_color: '#1a1a1a',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
  }
}
