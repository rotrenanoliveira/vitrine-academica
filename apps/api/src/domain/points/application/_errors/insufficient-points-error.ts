export class InsufficientPointsError extends Error {
  constructor(
    public readonly cost: number,
    public readonly balance: number,
  ) {
    super(`Saldo de pontos insuficiente. Promover um projeto custa ${cost} pontos e seu saldo é ${balance}`)
    this.name = 'InsufficientPointsError'
  }
}
