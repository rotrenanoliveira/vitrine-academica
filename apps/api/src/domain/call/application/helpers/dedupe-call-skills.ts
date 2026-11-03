import type { CallSkillInput } from '../dtos/call-skill-input'

export function dedupeCallSkills(skills: CallSkillInput[]): CallSkillInput[] {
  const skillsByTag = new Map<string, CallSkillInput>()

  for (const skill of skills) {
    if (!skillsByTag.has(skill.tagId)) {
      skillsByTag.set(skill.tagId, skill)
    }
  }

  return [...skillsByTag.values()]
}
