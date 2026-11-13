export class ProjectAlreadyPromotedByUserError extends Error {
  constructor(message?: string) {
    super(message ?? 'Você já tem uma promoção ativa neste projeto')
    this.name = 'ProjectAlreadyPromotedByUserError'
  }
}
