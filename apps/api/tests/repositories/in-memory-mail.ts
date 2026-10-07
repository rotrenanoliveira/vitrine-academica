import type { Mail } from '@/domain/mail/application/mail/mail'
import type { EmailMessage } from '@/domain/mail/enterprise/value-objects/email-message'

export class InMemoryMail implements Mail {
  public items: EmailMessage[] = []

  async send(message: EmailMessage): Promise<void> {
    this.items.push(message)
  }
}
