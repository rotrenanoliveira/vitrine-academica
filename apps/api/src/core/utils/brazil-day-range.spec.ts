import { brazilDayRange } from './brazil-day-range'

describe('brazilDayRange', () => {
  it('deve devolver o início e o fim do dia de Brasília para um horário da tarde', () => {
    const { start, end } = brazilDayRange(new Date('2026-09-09T15:00:00.000Z'))

    expect(start.toISOString()).toBe('2026-09-09T03:00:00.000Z')
    expect(end.toISOString()).toBe('2026-09-10T03:00:00.000Z')
  })

  it('deve manter o dia de Brasília quando o horário já virou o dia em UTC', () => {
    const { start, end } = brazilDayRange(new Date('2026-09-10T01:00:00.000Z'))

    expect(start.toISOString()).toBe('2026-09-09T03:00:00.000Z')
    expect(end.toISOString()).toBe('2026-09-10T03:00:00.000Z')
  })

  it('deve começar o dia exatamente à meia-noite de Brasília', () => {
    const { start, end } = brazilDayRange(new Date('2026-09-09T03:00:00.000Z'))

    expect(start.toISOString()).toBe('2026-09-09T03:00:00.000Z')
    expect(end.toISOString()).toBe('2026-09-10T03:00:00.000Z')
  })

  it('deve tratar o último instante antes da meia-noite como o mesmo dia', () => {
    const { start } = brazilDayRange(new Date('2026-09-10T02:59:59.999Z'))

    expect(start.toISOString()).toBe('2026-09-09T03:00:00.000Z')
  })
})
