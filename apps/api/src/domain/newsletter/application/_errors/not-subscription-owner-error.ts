export class NotSubscriptionOwnerError extends Error {
  constructor(message?: string) {
    super(message ?? 'Esta assinatura não é sua')
    this.name = 'NotSubscriptionOwnerError'
  }
}
