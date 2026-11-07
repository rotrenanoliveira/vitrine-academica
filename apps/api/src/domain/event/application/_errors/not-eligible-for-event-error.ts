export class NotEligibleForEventError extends Error {
  constructor(message?: string) {
    super(message ?? 'Usuário não elegível para participar deste evento')
    this.name = 'NotEligibleForEventError'
  }
}
