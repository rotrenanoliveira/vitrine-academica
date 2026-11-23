import type { Metadata } from 'next'
import { LegalDocumentPage } from '@/components/legal/legal-document-page'
import { politicaDePrivacidade } from '@/content/legal/politica-de-privacidade'

export const metadata: Metadata = politicaDePrivacidade.metadata

export default function PoliticaDePrivacidadePage() {
  return <LegalDocumentPage data={politicaDePrivacidade} />
}
