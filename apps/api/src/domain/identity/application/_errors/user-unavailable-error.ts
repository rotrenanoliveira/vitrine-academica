export class UserUnavailableError extends Error {
  constructor(message?: string) {
    super(message ?? 'Usuário indisponível para autenticação')
    this.name = 'UserUnavailableError'
  }
}
