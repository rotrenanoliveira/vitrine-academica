import { HttpResponse, http } from 'msw'
import { getTestStorage, TEST_STORAGE_ORIGIN } from '@/infra/storage/test-storage'

const assetsOrigin = process.env.CLOUDFLARE_R2_ASSETS_URL ?? 'https://assets.test'

function storageKeyFromUrl(requestUrl: string): string {
  const url = new URL(requestUrl)
  return url.pathname.replace(/^\//, '')
}

function isOrigin(requestUrl: string, origin: string): boolean {
  return new URL(requestUrl).origin === new URL(origin).origin
}

export const handlers = [
  http.get('https://api.openalex.org/works', ({ request }) => {
    const url = new URL(request.url)
    const search = url.searchParams.get('search')

    if (search === 'query sem resultados') {
      return HttpResponse.json({
        results: [],
        meta: { count: 0, page: 1, per_page: 30 },
      })
    }

    return HttpResponse.json({
      results: [
        {
          id: 'https://openalex.org/W123',
          doi: 'https://doi.org/10.1234/teste',
          title: 'PFC Teste',
          authorships: [{ author: { display_name: 'Thainá Soares' } }],
          primary_location: { landing_page_url: 'https://pfc.1234/test', source: { display_name: 'PFC UMC' } },

          abstract_inverted_index: {
            Resumo: [0],
            de: [1],
            teste: [2],
          },
        },
      ],
      meta: { count: 1, page: 1, per_page: 30 },
    })
  }),

  http.put(
    ({ request }) => isOrigin(request.url, TEST_STORAGE_ORIGIN),
    async ({ request }) => {
      const key = storageKeyFromUrl(request.url)
      const body = Buffer.from(await request.arrayBuffer())

      await getTestStorage().put(key, body)

      return new HttpResponse(null, { status: 200 })
    },
  ),

  http.get(
    ({ request }) => isOrigin(request.url, assetsOrigin),
    async ({ request }) => {
      const key = storageKeyFromUrl(request.url)
      const blob = await getTestStorage().get(key)

      if (!blob) {
        return new HttpResponse(null, { status: 404 })
      }

      return new HttpResponse(new Uint8Array(blob), { status: 200 })
    },
  ),
]
