export class NotAllowedToManageEventError extends Error {
  constructor(message?: string) {
    super(message ?? 'Sem permissão para gerenciar este evento')
    this.name = 'NotAllowedToManageEventError'
  }
}
