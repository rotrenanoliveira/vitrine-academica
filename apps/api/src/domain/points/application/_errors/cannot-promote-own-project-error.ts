export class CannotPromoteOwnProjectError extends Error {
  constructor(message?: string) {
    super(message ?? 'Não é permitido promover o próprio projeto')
    this.name = 'CannotPromoteOwnProjectError'
  }
}
