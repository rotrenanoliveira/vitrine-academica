import type { EmailMessage } from '../../enterprise/value-objects/email-message'

export interface MailResult {
  id: string | null
}

export interface Mail {
  send(message: EmailMessage): Promise<MailResult>
}
