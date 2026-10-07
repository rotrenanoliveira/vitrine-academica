export class AccountNotFoundError extends Error {
  constructor(message?: string) {
    super(message ?? 'Conta não encontrada')
    this.name = 'AccountNotFoundError'
  }
}
