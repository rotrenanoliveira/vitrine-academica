import type { EmailMessage } from '../../enterprise/value-objects/email-message'

export interface Mail {
  send(message: EmailMessage): Promise<void>
}
