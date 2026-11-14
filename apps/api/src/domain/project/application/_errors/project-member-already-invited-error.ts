export class ProjectMemberAlreadyInvitedError extends Error {
  constructor(message?: string) {
    super(message ?? 'Esta pessoa já foi convidada para o projeto')
    this.name = 'ProjectMemberAlreadyInvitedError'
  }
}
