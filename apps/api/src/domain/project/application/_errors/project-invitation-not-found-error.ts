export class ProjectInvitationNotFoundError extends Error {
  constructor(message?: string) {
    super(message ?? 'Convite não encontrado')
    this.name = 'ProjectInvitationNotFoundError'
  }
}
