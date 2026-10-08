import { HttpResponse, http } from 'msw'

export const handlers = [
  http.get('https://api.openalex.org/works', ({ request }) => {
    const url = new URL(request.url)
    const search = url.searchParams.get('search')

    if (search === 'query sem resultados') {
      return HttpResponse.json({ results: [] })
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
    })
  }),
]
