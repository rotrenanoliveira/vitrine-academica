import type { Call } from '../../enterprise/entities/call'
import type { CallApplication } from '../../enterprise/entities/call-application'

export interface CallApplicationWithCall {
  application: CallApplication
  call: Call
}
