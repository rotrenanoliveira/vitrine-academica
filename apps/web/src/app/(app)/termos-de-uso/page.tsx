import type { Metadata } from 'next'
import { LegalDocumentPage } from '@/components/legal/legal-document-page'
import { termosDeUso } from '@/content/legal/termos-de-uso'

export const metadata: Metadata = termosDeUso.metadata

export default function TermosDeUsoPage() {
  return <LegalDocumentPage data={termosDeUso} />
}
