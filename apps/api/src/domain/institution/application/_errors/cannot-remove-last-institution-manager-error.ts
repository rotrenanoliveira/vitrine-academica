export class CannotRemoveLastInstitutionManagerError extends Error {
  constructor() {
    super('Não é possível remover o único gerente da instituição. Promova outro membro antes.')
    this.name = 'CannotRemoveLastInstitutionManagerError'
  }
}
