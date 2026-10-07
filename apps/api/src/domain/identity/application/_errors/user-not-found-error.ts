export class UserNotFoundError extends Error {
  constructor(message?: string) {
    super(message ?? 'Usuário não encontrado')
    this.name = 'UserNotFoundError'
  }
}
