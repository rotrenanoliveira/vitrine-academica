export class InstitutionMemberNotFoundError extends Error {
  constructor(message?: string) {
    super(message ?? 'Membro da instituição não encontrado')
    this.name = 'InstitutionMemberNotFoundError'
  }
}
