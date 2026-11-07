export class DuplicateRegistrationError extends Error {
  constructor(message?: string) {
    super(message ?? 'Este projeto já está inscrito neste evento')
    this.name = 'DuplicateRegistrationError'
  }
}
