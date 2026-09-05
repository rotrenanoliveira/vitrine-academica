export class UserAlreadyExistsError extends Error {
  constructor(email: string) {
    super(`Usuário com email "${email}" já existe.`)
  }
}
