export class NotAllowedToManageInstitutionError extends Error {
  constructor(message?: string) {
    super(message ?? 'Você não tem permissão para gerenciar esta instituição')
    this.name = 'NotAllowedToManageInstitutionError'
  }
}
