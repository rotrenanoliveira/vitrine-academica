export class UserNotActiveError extends Error {
  constructor(message?: string) {
    super(message ?? 'Usuário não está ativo')
    this.name = 'UserNotActiveError'
  }
}
