export class CannotApplyToOwnCallError extends Error {
  constructor(message?: string) {
    super(message ?? 'Você não pode se candidatar ao seu próprio chamado')
    this.name = 'CannotApplyToOwnCallError'
  }
}
