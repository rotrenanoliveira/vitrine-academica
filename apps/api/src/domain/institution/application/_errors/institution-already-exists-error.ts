export class InstitutionAlreadyExistsError extends Error {
  constructor(message?: string) {
    super(message ?? 'Instituição já existe')
    this.name = 'InstitutionAlreadyExistsError'
  }
}
