export class NotProjectOwnerError extends Error {
  constructor(message?: string) {
    super(message ?? 'Você não é o autor deste projeto.')
    this.name = 'NotProjectOwnerError'
  }
}
