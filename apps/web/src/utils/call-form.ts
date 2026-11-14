import z from 'zod'

export const callSkillsSchema = z
  .array(
    z.object({
      tagId: z.uuid('Habilidade inválida.'),
      description: z.string().max(200, 'O detalhe da habilidade deve ter no máximo 200 caracteres.').nullable(),
    }),
  )
  .min(1, 'Selecione ao menos uma habilidade.')

export function parseCallSkills(data: FormData) {
  return data
    .getAll('tag-id')
    .map(String)
    .filter(Boolean)
    .map((tagId) => {
      const description = String(data.get(`skill-description-${tagId}`) ?? '').trim()

      return { tagId, description: description === '' ? null : description }
    })
}
