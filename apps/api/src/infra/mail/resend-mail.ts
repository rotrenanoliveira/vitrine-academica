import { Resend } from 'resend'
import type { Mail } from '@/domain/mail/application/mail/mail'
import type { EmailMessage } from '@/domain/mail/enterprise/value-objects/email-message'

interface ResendMailConfig {
  apiKey: string
  from: string
}

export class ResendMail implements Mail {
  private readonly client: Resend
  private readonly from: string

  constructor(config: ResendMailConfig) {
    this.client = new Resend(config.apiKey)
    this.from = config.from
  }

  async send(message: EmailMessage): Promise<void> {
    const mail = await this.client.emails.send({
      from: this.from,
      to: message.to,
      subject: message.subject,
      text: message.text,
    })

    if (mail.error) {
      throw new Error(`Falha ao enviar e-mail: ${mail.error.message}`)
    }
  }
}
