export type LegalLink = {
  href: string
  text: string
}

export type LegalInline = string | Array<string | LegalLink>

export type LegalParagraph = {
  type: 'paragraph'
  number?: string
  content: LegalInline
}

export type LegalListItem = {
  label?: string
  content: LegalInline
}

export type LegalList = {
  type: 'list'
  items: LegalListItem[]
}

export type LegalTable = {
  type: 'table'
  columns: string[]
  rows: string[][]
}

export type LegalBlock = LegalParagraph | LegalList | LegalTable

export type LegalSection = {
  title: string
  blocks: LegalBlock[]
}

export type LegalDocument = {
  metadata: {
    title: string
    description: string
  }
  title: string
  lastUpdated: string
  version: string
  intro: LegalInline
  sections: LegalSection[]
}
