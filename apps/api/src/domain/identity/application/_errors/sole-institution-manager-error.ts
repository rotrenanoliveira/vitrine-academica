export class SoleInstitutionManagerError extends Error {
  readonly institutions: { id: string; name: string }[]

  constructor(institutions: { id: string; name: string }[]) {
    const names = institutions.map((institution) => institution.name).join(', ')

    super(`Você é o único gerente de: ${names}. Passe a gerência para outro membro antes de excluir sua conta.`)

    this.institutions = institutions
  }
}
