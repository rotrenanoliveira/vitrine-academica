/**
 * Receives a text and convert it to a slug.
 *
 * Example: John Doe => john-doe
 */
export function createSlugFromText(text: string) {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
}
