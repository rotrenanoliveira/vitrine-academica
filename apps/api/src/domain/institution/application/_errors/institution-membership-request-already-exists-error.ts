export class InstitutionMembershipRequestAlreadyExistsError extends Error {
  constructor(message?: string) {
    super(message ?? 'Solicitação de membership já existe')
    this.name = 'InstitutionMembershipRequestAlreadyExistsError'
  }
}
