export class InvalidProjectStatusError extends Error {
  constructor(message?: string) {
    super(message ?? 'Status do projeto inválido para esta operação')
    this.name = 'InvalidProjectStatusError'
  }
}
