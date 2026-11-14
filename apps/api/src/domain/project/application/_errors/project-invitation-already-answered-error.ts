export class ProjectInvitationAlreadyAnsweredError extends Error {
  constructor(message?: string) {
    super(message ?? 'Este convite já foi respondido')
    this.name = 'ProjectInvitationAlreadyAnsweredError'
  }
}
