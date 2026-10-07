export class InstitutionMemberAlreadyExistsError extends Error {
  constructor(message?: string) {
    super(message ?? 'Membro da instituição já existe')
    this.name = 'InstitutionMemberAlreadyExistsError'
  }
}
