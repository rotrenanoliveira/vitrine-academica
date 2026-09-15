export class MembershipProofRequiredError extends Error {
  constructor(message?: string) {
    super(message ?? 'Documento comprobatório é obrigatório para esta instituição')
    this.name = 'MembershipProofRequiredError'
  }
}
