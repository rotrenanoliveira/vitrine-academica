export class NotCallOwnerError extends Error {
  constructor(message?: string) {
    super(message ?? 'Você não é o autor deste chamado.')
    this.name = 'NotCallOwnerError'
  }
}
