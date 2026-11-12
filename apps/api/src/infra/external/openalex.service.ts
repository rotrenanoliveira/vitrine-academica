import ky from 'ky'
import type { AcademicProjectDto } from '@/domain/project/application/dtos/academic-project-dto'
import type {
  ExternalProjectsSearch,
  ExternalProjectsSearchResult,
} from '@/domain/project/application/external/external-projects-search'

const PER_PAGE = 30

interface OpenAlexWork {
  id: string
  doi: string | null
  title: string | null
  authorships?: { author: { display_name: string } }[] | null
  primary_location: {
    landing_page_url: string | null
    source: { display_name: string } | null
  } | null
  abstract_inverted_index: Record<string, number[]> | null
}

interface OpenAlexResponse {
  results: OpenAlexWork[]
  meta?: {
    count?: number
    page?: number
    per_page?: number
  }
}

type OpenAlexWorkWithTitle = OpenAlexWork & { title: string }

export class OpenAlexService implements ExternalProjectsSearch {
  private readonly api = ky.create({
    prefix: 'https://api.openalex.org',
  })

  async search(query: string, page = 1): Promise<ExternalProjectsSearchResult | null> {
    const apiKey = process.env.OPENALEX_API_KEY

    try {
      const response = await this.api
        .get('works', {
          searchParams: {
            search: query,
            page,
            'per-page': PER_PAGE,
            select: 'id,doi,title,authorships,primary_location,abstract_inverted_index',
            ...(apiKey && { api_key: apiKey }),
          },
        })
        .json<OpenAlexResponse>()

      const projects = response.results
        .filter((work): work is OpenAlexWorkWithTitle => Boolean(work.title))
        .map((work) => this.toDto(work))

      const totalCount = response.meta?.count ?? projects.length
      const hasNextPage = page * PER_PAGE < totalCount

      return {
        projects,
        page,
        perPage: PER_PAGE,
        hasNextPage,
      }
    } catch (error) {
      console.error(error)
      return null
    }
  }

  private toDto(work: OpenAlexWorkWithTitle): AcademicProjectDto {
    return {
      title: work.title,
      authors: (work.authorships ?? []).map((a) => a.author.display_name),
      externalUrl: work.primary_location?.landing_page_url ?? work.doi ?? work.id,
      publishedIn: work.primary_location?.source?.display_name ?? '',
      abstract: this.rebuildAbstract(work.abstract_inverted_index),
    }
  }

  private rebuildAbstract(index: Record<string, number[]> | null): string | undefined {
    if (!index) return undefined

    return Object.entries(index)
      .flatMap(([word, positions]) => positions.map((pos) => [pos, word] as const))
      .sort(([a], [b]) => a - b)
      .map(([, word]) => word)
      .join(' ')
  }
}
