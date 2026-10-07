export class InstitutionNotFoundError extends Error {
  constructor(message?: string) {
    super(message ?? 'Instituição não encontrada')
    this.name = 'InstitutionNotFoundError'
  }
}
