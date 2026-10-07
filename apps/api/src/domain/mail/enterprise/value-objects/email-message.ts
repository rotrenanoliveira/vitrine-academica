import { ValueObject } from '@/core/entities/value-objects'

export interface EmailMessageProps {
  to: string
  subject: string
  text: string
}

export class EmailMessage extends ValueObject<EmailMessageProps> {
  get to() {
    return this.props.to
  }

  get subject() {
    return this.props.subject
  }

  get text() {
    return this.props.text
  }

  static create(props: EmailMessageProps) {
    return new EmailMessage({
      ...props,
      to: props.to.toLowerCase(),
    })
  }
}
