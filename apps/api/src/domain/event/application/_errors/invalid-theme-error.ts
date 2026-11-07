export class InvalidThemeError extends Error {
  constructor(message?: string) {
    super(message ?? 'Tema inválido ou não moderado para esta operação')
    this.name = 'InvalidThemeError'
  }
}
