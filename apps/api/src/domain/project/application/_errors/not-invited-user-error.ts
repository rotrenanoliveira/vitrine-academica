export class NotInvitedUserError extends Error {
  constructor(message?: string) {
    super(message ?? 'Este convite não é para você')
    this.name = 'NotInvitedUserError'
  }
}
