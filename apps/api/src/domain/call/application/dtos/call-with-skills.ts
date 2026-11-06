import type { Call } from '../../enterprise/entities/call'
import type { CallSkill } from '../../enterprise/entities/call-skill'

export interface CallWithSkills {
  call: Call
  skills: CallSkill[]
}
