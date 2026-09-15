export class InvalidAccessCodeError extends Error {
  constructor(message?: string) {
    super(message ?? 'Código de acesso inválido')
    this.name = 'InvalidAccessCodeError'
  }
}
