import { fillDailySeries, fillLabelCounts, periodStart, sumTotals } from './series'

describe('(UT) - Analytics series', () => {
  it('deve iniciar o período no começo do dia em UTC', () => {
    const start = periodStart(7, new Date('2026-11-06T15:30:00.000Z'))

    expect(start.toISOString()).toBe('2026-10-31T00:00:00.000Z')
  })

  it('deve preencher com zero os dias sem registros', () => {
    const series = fillDailySeries([{ date: '2026-11-05', total: 2 }], 3, new Date('2026-11-06T10:00:00.000Z'))

    expect(series).toEqual([
      { date: '2026-11-04', total: 0 },
      { date: '2026-11-05', total: 2 },
      { date: '2026-11-06', total: 0 },
    ])
  })

  it('deve preencher com zero os rótulos ausentes e ignorar os desconhecidos', () => {
    const counts = fillLabelCounts(
      [
        { label: 'B', total: 2 },
        { label: 'X', total: 9 },
      ],
      ['A', 'B', 'C'],
    )

    expect(counts).toEqual([
      { label: 'A', total: 0 },
      { label: 'B', total: 2 },
      { label: 'C', total: 0 },
    ])
  })

  it('deve somar os totais', () => {
    expect(sumTotals([{ total: 1 }, { total: 4 }])).toBe(5)
    expect(sumTotals([])).toBe(0)
  })
})
