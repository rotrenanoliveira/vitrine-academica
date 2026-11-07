import { type Either, right } from '@/core/either'
import type {
  CommunityCurationEntry,
  CurationRepository,
  TeacherCurationEntry,
} from '../repositories/curation-repository'

const DEFAULT_PERIOD_IN_MONTHS = 3 //3 meses
const DEFAULT_LIMIT = 10

interface GetCurationUseCaseRequest {
  institutionId?: string | undefined
  months?: number | undefined
  limit?: number | undefined

  now?: Date | undefined
}

type GetCurationUseCaseResponse = Either<
  never,
  { board: TeacherCurationEntry[]; community: CommunityCurationEntry[] }
>

export class GetCurationUseCase {
  constructor(private readonly curationRepository: CurationRepository) {}

  async execute({
    institutionId,
    months = DEFAULT_PERIOD_IN_MONTHS,
    limit = DEFAULT_LIMIT,
    now = new Date(),
  }: GetCurationUseCaseRequest): Promise<GetCurationUseCaseResponse> {
    const since = new Date(now)
    since.setUTCMonth(since.getUTCMonth() - months)

    const filters = { since, institutionId, limit }

    const [board, community] = await Promise.all([
      this.curationRepository.findTopByTeachers(filters),
      this.curationRepository.findTopByCommunity(filters),
    ])

    return right({ board, community })
  }
}