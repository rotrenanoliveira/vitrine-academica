export class InstitutionMembershipRequestNotFoundError extends Error {
  constructor(message?: string) {
    super(message ?? 'Solicitação de membership não encontrada')
    this.name = 'InstitutionMembershipRequestNotFoundError'
  }
}
