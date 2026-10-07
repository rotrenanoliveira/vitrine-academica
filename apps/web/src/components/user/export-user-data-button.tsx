'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { exportUserDataAction } from '@/server/actions/export-user-data'

export function ExportUserDataButton() {
  const [isExporting, setIsExporting] = useState(false)

  async function handleExportData() {
    try {
      setIsExporting(true)

      const data = await exportUserDataAction()

      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(data, null, 2))}`

      const downloadAnchor = document.createElement('a')
      downloadAnchor.setAttribute('href', jsonString)
      downloadAnchor.setAttribute(
        'download',
        `meus-dados-vitrine-academica-${new Date().toISOString().slice(0, 10)}.json`,
      )

      document.body.appendChild(downloadAnchor)
      downloadAnchor.click()
      downloadAnchor.remove()
    } catch (error) {
      console.error('Erro ao exportar dados do usuário:', error)
      alert('Não foi possível exportar seus dados no momento.')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <Button onClick={handleExportData} disabled={isExporting} variant="outline">
      {isExporting ? 'Gerando arquivo...' : 'Baixar todos os meus dados (JSON)'}
    </Button>
  )
}
