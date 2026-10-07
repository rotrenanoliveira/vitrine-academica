export class Slug {
  public value: string

  constructor(value: string) {
    this.value = value
  }

  /**
   * Receives a text and convert it to a slug.
   *
   * Example: John Doe => john-doe
   *
   * @param text {string} The text to convert to slug
   */
  static createFromText(text: string) {
    const slug = text
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')

    return new Slug(slug)
  }

  static create(slug: string) {
    return new Slug(slug)
  }
}
