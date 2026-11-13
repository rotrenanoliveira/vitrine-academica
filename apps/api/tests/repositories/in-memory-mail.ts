import type { Mail, MailResult } from '@/domain/mail/application/mail/mail'
import type { EmailMessage } from '@/domain/mail/enterprise/value-objects/email-message'

export class InMemoryMail implements Mail {
  public items: EmailMessage[] = []
  public shouldFail = false

  async send(message: EmailMessage): Promise<MailResult> {
    if (this.shouldFail) {
      throw new Error('Falha simulada no envio de e-mail')
    }

    this.items.push(message)

    return { id: `mail-${this.items.length}` }
  }
}
