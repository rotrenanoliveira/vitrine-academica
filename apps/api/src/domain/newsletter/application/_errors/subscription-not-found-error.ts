export class SubscriptionNotFoundError extends Error {
  constructor(message?: string) {
    super(message ?? 'Assinatura não encontrada')
    this.name = 'SubscriptionNotFoundError'
  }
}
