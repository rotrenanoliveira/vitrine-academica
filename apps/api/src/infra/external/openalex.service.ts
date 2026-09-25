import ky from 'ky'
import type { AcademicProjectDto } from '@/domain/project/application/dtos/academic-project-dto'

interface OpenAlexWork {
  id: string
  doi: string | null
  title: string | null
  authorships: { author: { display_name: string } }[]
  primary_location: {
    landing_page_url: string | null
    source: { display_name: string } | null
  } | null
  abstract_inverted_index: Record<string, number[]> | null
}

interface OpenAlexResponse {
  results: OpenAlexWork[]
}

export class OpenAlexService {
  private api = ky.create({ prefix: 'https://api.openalex.org' }) // trocar pelo `fetch` dps

  async search(query: string): Promise<AcademicProjectDto[]> {
    const response: OpenAlexResponse = await this.api
      .get('works', {
        searchParams: {
          search: query,
          'per-page': 10,
          select: 'id,doi,title,authorships,primary_location,abstract_inverted_index',
          api_key: process.env.OPENALEX_API_KEY ?? '',
        },
      })
      .json<OpenAlexResponse>()

    return response.results
      .filter((project) => project.title)
      .map((project) => ({
        title: project.title as string,
        authors: project.authorships.map((a) => a.author.display_name),
        externalUrl: project.primary_location?.landing_page_url ?? project.doi ?? project.id,
        publishedIn: project.primary_location?.source?.display_name ?? '',
        abstract: this.rebuildAbstract(project.abstract_inverted_index),
      }))
  }

  private rebuildAbstract(index: Record<string, number[]> | null): string | undefined {
    if (!index) return undefined

    return Object.entries(index)
      .flatMap(([word, positions]) => positions.map((pos) => [pos, word] as const))
      .sort((a, b) => a[0] - b[0])
      .map(([, word]) => word)
      .join(' ')
  }
}
