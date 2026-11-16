import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { faker } from '@faker-js/faker/locale/pt_BR'
import { makeAttachmentOnDatabase, makeAttachmentOnStorage } from '@tests/factories/make-attachment'
import { makeCallOnDatabase } from '@tests/factories/make-call'
import { makeCallApplicationOnDatabase } from '@tests/factories/make-call-application'
import { makeCallSkillOnDatabase } from '@tests/factories/make-call-skill'
import { makeEventOnDatabase } from '@tests/factories/make-event'
import { makeEventRegistrationOnDatabase } from '@tests/factories/make-event-registration'
import { makeInstitutionOnDatabase } from '@tests/factories/make-institution'
import { makeInstitutionMemberOnDatabase } from '@tests/factories/make-institution-member'
import { makePointTransactionOnDatabase } from '@tests/factories/make-point-transaction'
import { makeProjectOnDatabase } from '@tests/factories/make-project'
import { makeProjectMemberOnDatabase } from '@tests/factories/make-project-member'
import { makeProjectScheduledOnDatabase } from '@tests/factories/make-project-scheduled'
import { makeProjectStarOnDatabase } from '@tests/factories/make-project-star'
import { makeProjectTagOnDatabase } from '@tests/factories/make-project-tag'
import { makeProjectTeacherRatingOnDatabase } from '@tests/factories/make-project-teacher-rating'
import { makePromotionOnDatabase } from '@tests/factories/make-promotion'
import { makeRatingCriterionOnDatabase } from '@tests/factories/make-rating-criterion'
import { makeTagOnDatabase } from '@tests/factories/make-tag'
import { makeThemeOnDatabase } from '@tests/factories/make-theme'
import { makeUserOnDatabase } from '@tests/factories/make-user'
import { sql } from 'drizzle-orm'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { Slug } from '@/core/entities/value-objects/slug'
import { CallStatus } from '@/domain/call/enterprise/entities/call'
import { CallApplicationStatus } from '@/domain/call/enterprise/entities/call-application'
import { type Event, EventPhase, ParticipationScope } from '@/domain/event/enterprise/entities/event'
import { EventRegistrationStatus } from '@/domain/event/enterprise/entities/event-registration'
import { ThemeStatus } from '@/domain/event/enterprise/entities/theme'
import type { User } from '@/domain/identity/enterprise/entities/user'
import {
  type InstitutionMember,
  InstitutionMemberRole,
  InstitutionMemberStatus,
} from '@/domain/institution/enterprise/entities/institution-member'
import {
  type Institution,
  InstitutionOrigin,
  InstitutionType,
} from '@/domain/institution/enterprise/entities/institutions'
import { PROMOTION_COST } from '@/domain/points/application/constants/promotion-rules'
import { PointTransactionReason, PointTransactionType } from '@/domain/points/enterprise/entities/point-transaction'
import { type Project, ProjectStatus } from '@/domain/project/enterprise/entities/project'
import { ProjectMemberStatus } from '@/domain/project/enterprise/entities/project-member'
import type { RatingCriterion } from '@/domain/project/enterprise/entities/rating-criterion'
import { TeacherRatingItem } from '@/domain/project/enterprise/entities/teacher-rating-item'
import { Attachment } from '@/domain/storage/enterprise/entities/attachment'
import type { Tag } from '@/domain/tag/enterprise/entities/tag'
import { UserRole, UserStatus } from '../../../domain/identity/enterprise/entities/user'
import { db } from '../drizzle/client'

const INSTITUTION_COUNT = 20
const UNLINKED_USER_COUNT = 25
const EVENTS_PER_INSTITUTION = 5
const SCHEDULED_DAYS = 30
const SCHEDULES_PER_DAY = 2
const CLOSED_INSTITUTION_PROJECTS = 3
const STAR_USER_THRESHOLD = 100
const MIN_STARS_PER_PROJECT = 20
const MAX_STARS_PER_PROJECT = 40
const PROMOTION_COUNT = 5
const PROMOTION_EXPIRES_AT = new Date('2027-12-31T23:59:59.000-03:00')
const ONE_DAY_IN_MS = 24 * 60 * 60 * 1000
const ONE_WEEK_IN_MS = 7 * ONE_DAY_IN_MS
const ONE_MONTH_IN_MS = 30 * ONE_DAY_IN_MS
const INSTITUTION_TYPES = Object.values(InstitutionType)
const MEMBER_ROLES = Object.values(InstitutionMemberRole)
const EVENT_PHASE_ROTATION = [
  EventPhase.THEME_SELECTION,
  EventPhase.OPEN,
  EventPhase.CLOSED,
  EventPhase.THEME_SELECTION,
  EventPhase.OPEN,
] as const

interface SeedTag {
  name: string
  slug: string
}

interface SeedCallSkill {
  tagSlug: string
  description: string
}

interface SeedCall {
  title: string
  description: string
  skills: SeedCallSkill[]
}

interface SeedEventTheme {
  title: string
  description: string
}

interface SeedEvent {
  name: string
  participationScope: ParticipationScope
  phase: EventPhase.THEME_SELECTION | EventPhase.OPEN | EventPhase.CLOSED
  themes: SeedEventTheme[]
  winnerThemeTitle?: string
}

interface SeedProject {
  title: string
  description: string
  tags: string[]
  image: string | null
}

interface ProjectDraft {
  seedProject: SeedProject
  author: User
  status: ProjectStatus
  publishedIn: Date | null
  closedEventId: string | null
  institutionId: string | null
}

const SEED_DIR = __dirname
const IMAGE_DIR = join(SEED_DIR, 'images')

const { tags: SEED_TAGS } = JSON.parse(readFileSync(join(SEED_DIR, 'tags.json'), 'utf8')) as {
  tags: SeedTag[]
}

const { calls: SEED_CALLS } = JSON.parse(readFileSync(join(SEED_DIR, 'chamados.json'), 'utf8')) as {
  calls: SeedCall[]
}

const { events: SEED_EVENTS } = JSON.parse(readFileSync(join(SEED_DIR, 'eventos.json'), 'utf8')) as {
  events: SeedEvent[]
}

const { projects: SEED_PROJECT_ROWS } = JSON.parse(readFileSync(join(SEED_DIR, 'projetos.json'), 'utf8')) as {
  projects: Array<Omit<SeedProject, 'image'> & { image?: string }>
}

const SEED_PROJECTS: SeedProject[] = SEED_PROJECT_ROWS.map((project, index) => {
  const quadroImage = `img-${index + 1}.png`
  const isQuadro = project.image === quadroImage

  return {
    title: project.title,
    description: project.description,
    tags: project.tags,
    image: isQuadro ? quadroImage : null,
  }
})

const RATING_CRITERIA_SEED = [
  {
    name: 'Originalidade e inovação',
    description:
      'Grau de contribuição nova, diferenciação frente a soluções conhecidas e avanço em relação ao estado da arte. Âncoras: 0–3 repetição; 4–6 adaptação; 7–8 contribuição clara; 9–10 inovação marcante.',
    weight: 1,
    active: true,
  },
  {
    name: 'Rigor metodológico e qualidade técnica',
    description:
      'Coerência do método, fundamentação, correção técnica, reproducibilidade e solidez dos resultados. Âncoras: 0–3 falhas graves; 4–6 parcial; 7–8 sólido; 9–10 exemplar.',
    weight: 1,
    active: true,
  },
  {
    name: 'Clareza e organização da apresentação',
    description:
      'Estrutura do material na vitrine, linguagem, organização lógica e facilidade de compreensão. Âncoras: 0–3 confuso; 4–6 com esforço; 7–8 bem organizado; 9–10 exemplar.',
    weight: 1,
    active: true,
  },
  {
    name: 'Relevância e impacto',
    description:
      'Pertinência do problema, aplicabilidade acadêmica/social/tecnológica e potencial de uso. Âncoras: 0–3 pouco pertinente; 4–6 limitada; 7–8 impacto claro; 9–10 alto potencial.',
    weight: 1,
    active: true,
  },
] as const

const WEIGHTED_MEMBER_ROLES = new Set<InstitutionMemberRole>([
  InstitutionMemberRole.PROFESSOR,
  InstitutionMemberRole.TEACHER,
])

async function resetDatabase() {
  console.log('[database]: Limpando tabelas...')
  await db.execute(
    sql`TRUNCATE TABLE "users", "accounts", "attachments", "tags", "preference_tags", "projects", "project_tags", "project_members", "project_scheduled", "project_stars", "project_teacher_ratings", "teacher_rating_items", "rating_criteria", "point_transactions", "promotions", "access_codes", "sessions", "institutions", "institution_members", "institution_membership_requests", "events", "event_themes", "event_votes", "event_registrations", "calls", "call_applications", "call_skills" CASCADE`,
  )
}

async function seedUser(override: Parameters<typeof makeUserOnDatabase>[0] = {}) {
  const { user } = await makeUserOnDatabase({
    name: faker.person.fullName(),
    email: faker.internet.email({ provider: 'vitrineacademica.com' }).toLowerCase(),
    ...override,
  })

  return user
}

function institutionName(type: InstitutionType) {
  const lastName = faker.person.lastName()
  const city = faker.location.city()

  switch (type) {
    case InstitutionType.UNIVERSITY:
      return faker.helpers.arrayElement([
        `Universidade Federal de ${city}`,
        `Universidade Estadual de ${city}`,
        `Universidade ${lastName}`,
      ])
    case InstitutionType.COLLEGE:
      return faker.helpers.arrayElement([`Faculdade ${lastName}`, `Centro Universitário ${lastName}`])
    case InstitutionType.CENTER:
      return `Instituto ${lastName}`
    case InstitutionType.TECHNICAL_COLLEGE:
      return faker.helpers.arrayElement([`Instituto Federal de ${city}`, `Colégio Técnico ${lastName}`])
    default:
      return `Escola ${lastName}`
  }
}

function uniqueInstitutionName(type: InstitutionType, usedSlugs: Set<string>) {
  let name = institutionName(type)
  let slug = Slug.createFromText(name).value
  let suffix = 2

  while (usedSlugs.has(slug)) {
    name = `${institutionName(type)} ${suffix}`
    slug = Slug.createFromText(name).value
    suffix += 1
  }

  usedSlugs.add(slug)

  return { name, slug: Slug.create(slug) }
}

async function seedInstitutions(registerBy: UniqueEntityId) {
  console.log('[database]: Criando instituições...')

  const usedSlugs = new Set<string>()
  const institutions = []

  for (let index = 0; index < INSTITUTION_COUNT; index++) {
    const type = INSTITUTION_TYPES[index % INSTITUTION_TYPES.length]!
    const { name, slug } = uniqueInstitutionName(type, usedSlugs)

    const { institution } = await makeInstitutionOnDatabase({
      name,
      slug,
      type,
      origin: InstitutionOrigin.SEED,
      description: faker.lorem.paragraph(),
      registerBy,
      shouldProof: faker.datatype.boolean(),
      shouldVerify: faker.datatype.boolean(),
      domain: faker.datatype.boolean() ? faker.internet.domainName() : undefined,
    })

    institutions.push(institution)
  }

  return institutions
}

async function seedInstitutionMembers(institutions: Institution[]) {
  console.log('[database]: Criando membros por função em cada instituição...')

  const users: User[] = []
  const members = []

  for (const institution of institutions) {
    for (const role of MEMBER_ROLES) {
      const user = await seedUser()

      const { member } = await makeInstitutionMemberOnDatabase({
        institutionId: institution.id.toString(),
        userId: user.id.toString(),
        role,
        status: InstitutionMemberStatus.ACTIVE,
      })

      users.push(user)
      members.push(member)
    }
  }

  return { users, members }
}

async function seedUnlinkedUsers(count: number) {
  console.log('[database]: Criando usuários sem instituição...')

  const users = []

  for (let index = 0; index < count; index++) {
    const user = await seedUser()
    users.push(user)
  }

  return users
}

async function seedTags() {
  console.log('[database]: Criando tags...')

  const tags = []

  for (const seedTag of SEED_TAGS) {
    const { tag } = await makeTagOnDatabase({
      name: seedTag.name,
      slug: Slug.create(seedTag.slug),
    })
    tags.push(tag)
  }

  return tags
}

function pickOtherUser(users: User[], excludedUserId: string) {
  const candidates = users.filter((user) => user.id.toString() !== excludedUserId)

  return faker.helpers.arrayElement(candidates)
}

async function createCallWithApplication({
  author,
  users,
  tagsBySlug,
  status,
  seedCall,
}: {
  author: User
  users: User[]
  tagsBySlug: Map<string, Tag>
  status: CallStatus
  seedCall: SeedCall
}) {
  const now = Date.now()
  const isOpen = status === CallStatus.OPEN

  const { call } = await makeCallOnDatabase({
    authorId: author.id,
    title: seedCall.title,
    description: seedCall.description,
    applicationDeadline: new Date(isOpen ? now + ONE_WEEK_IN_MS : now - ONE_WEEK_IN_MS),
    status,
    createdAt: new Date(now - faker.number.int({ min: ONE_WEEK_IN_MS, max: ONE_MONTH_IN_MS })),
  })

  for (const skill of seedCall.skills) {
    const tag = tagsBySlug.get(skill.tagSlug)

    if (!tag) {
      throw new Error(`Tag não encontrada para o slug "${skill.tagSlug}" no chamado "${seedCall.title}"`)
    }

    await makeCallSkillOnDatabase({
      callId: call.id,
      tagId: tag.id,
      description: skill.description,
    })
  }

  const applicant = pickOtherUser(users, author.id.toString())
  const applicationStatus = isOpen
    ? CallApplicationStatus.PENDING
    : faker.helpers.arrayElement([CallApplicationStatus.APPROVED, CallApplicationStatus.REJECTED])

  const { application } = await makeCallApplicationOnDatabase({
    callId: call.id,
    applicantId: applicant.id,
    message: faker.datatype.boolean() ? faker.lorem.paragraph() : null,
    status: applicationStatus,
    decidedAt: applicationStatus === CallApplicationStatus.PENDING ? null : new Date(),
  })

  return { call, application }
}

async function seedCalls(users: User[], tags: Tag[]) {
  console.log('[database]: Criando chamados e candidaturas...')

  const tagsBySlug = new Map(tags.map((tag) => [tag.slug.value, tag]))
  const shuffledCalls = faker.helpers.shuffle([...SEED_CALLS])
  const shuffledUsers = faker.helpers.shuffle([...users])

  const openAuthorCount = Math.floor(users.length / 5)
  const openAuthorsWithClosedCount = Math.floor(openAuthorCount / 2)
  const closedOnlyAuthorCount = Math.floor(openAuthorCount / 2)

  const openAuthors = shuffledUsers.slice(0, openAuthorCount)
  const openAuthorsWithClosed = openAuthors.slice(0, openAuthorsWithClosedCount)
  const closedOnlyAuthors = shuffledUsers.slice(openAuthorCount, openAuthorCount + closedOnlyAuthorCount)

  const availableCalls = [...shuffledCalls]
  const calls = []
  const applications = []

  const takeSeedCall = () => {
    if (availableCalls.length === 0) {
      throw new Error('Não há chamados suficientes em seed/chamados.json para a distribuição do seed')
    }

    return availableCalls.shift()!
  }

  for (const author of openAuthors) {
    const { call, application } = await createCallWithApplication({
      author,
      users,
      tagsBySlug,
      status: CallStatus.OPEN,
      seedCall: takeSeedCall(),
    })
    calls.push(call)
    applications.push(application)
  }

  for (const author of openAuthorsWithClosed) {
    const { call, application } = await createCallWithApplication({
      author,
      users,
      tagsBySlug,
      status: CallStatus.CLOSED,
      seedCall: takeSeedCall(),
    })
    calls.push(call)
    applications.push(application)
  }

  for (const author of closedOnlyAuthors) {
    const { call, application } = await createCallWithApplication({
      author,
      users,
      tagsBySlug,
      status: CallStatus.CLOSED,
      seedCall: takeSeedCall(),
    })
    calls.push(call)
    applications.push(application)
  }

  return {
    calls,
    applications,
    openAuthors: openAuthors.length,
    openAuthorsWithClosed: openAuthorsWithClosed.length,
    closedOnlyAuthors: closedOnlyAuthors.length,
  }
}

function seedEventsByPhase() {
  return {
    [EventPhase.THEME_SELECTION]: SEED_EVENTS.filter((event) => event.phase === EventPhase.THEME_SELECTION),
    [EventPhase.OPEN]: SEED_EVENTS.filter((event) => event.phase === EventPhase.OPEN),
    [EventPhase.CLOSED]: SEED_EVENTS.filter((event) => event.phase === EventPhase.CLOSED),
  }
}

function eventWindowForPhase(phase: EventPhase) {
  const now = Date.now()

  if (phase === EventPhase.THEME_SELECTION) {
    return {
      startsAt: new Date(now - 2 * ONE_DAY_IN_MS),
      themeSelectionEndsAt: new Date(now + 5 * ONE_DAY_IN_MS),
      endsAt: new Date(now + 3 * ONE_MONTH_IN_MS),
    }
  }

  if (phase === EventPhase.OPEN) {
    return {
      startsAt: new Date(now - 3 * ONE_WEEK_IN_MS),
      themeSelectionEndsAt: new Date(now - 2 * ONE_WEEK_IN_MS),
      endsAt: new Date(now + 2 * ONE_MONTH_IN_MS),
    }
  }

  return {
    startsAt: new Date(now - 4 * ONE_MONTH_IN_MS),
    themeSelectionEndsAt: new Date(now - 4 * ONE_MONTH_IN_MS + ONE_WEEK_IN_MS),
    endsAt: new Date(now - ONE_MONTH_IN_MS),
  }
}

function takeSeedEvent(
  pool: SeedEvent[],
  cursorByPhase: Record<string, number>,
  phase: EventPhase.THEME_SELECTION | EventPhase.OPEN | EventPhase.CLOSED,
) {
  if (pool.length === 0) {
    throw new Error(`Não há eventos com fase ${phase} em seed/eventos.json`)
  }

  const cursor = cursorByPhase[phase] ?? 0
  const seedEvent = pool[cursor % pool.length]!
  cursorByPhase[phase] = cursor + 1

  return seedEvent
}

function pickInstitutionUsers(usersById: Map<string, User>, members: InstitutionMember[], institutionId: string) {
  const institutionUsers = members
    .filter((member) => member.institutionId === institutionId)
    .map((member) => usersById.get(member.userId))
    .filter((user): user is User => Boolean(user))

  if (institutionUsers.length === 0) {
    throw new Error(`Instituição ${institutionId} não possui usuários para autoría de temas`)
  }

  return institutionUsers
}

async function createEventFromSeed({
  institution,
  seedEvent,
  authors,
  moderator,
  eventIndex,
}: {
  institution: Institution
  seedEvent: SeedEvent
  authors: User[]
  moderator: User
  eventIndex: number
}) {
  if (seedEvent.themes.length < 3) {
    throw new Error(`Evento "${seedEvent.name}" precisa de pelo menos 3 temas sugeridos`)
  }

  const window = eventWindowForPhase(seedEvent.phase)
  const slug = `evento-${Slug.createFromText(seedEvent.name).value}-${institution.slug.value}-${eventIndex + 1}`
  const needsWinner = seedEvent.phase === EventPhase.OPEN || seedEvent.phase === EventPhase.CLOSED
  const winnerThemeId = needsWinner ? new UniqueEntityId() : null

  const { event } = await makeEventOnDatabase({
    institutionId: institution.id,
    slug,
    name: seedEvent.name,
    participationScope: seedEvent.participationScope,
    phase: seedEvent.phase,
    winnerThemeId,
    startsAt: window.startsAt,
    themeSelectionEndsAt: window.themeSelectionEndsAt,
    endsAt: window.endsAt,
  })

  const themes = []

  for (const [themeIndex, seedTheme] of seedEvent.themes.entries()) {
    const isWinner = needsWinner && seedTheme.title === seedEvent.winnerThemeTitle
    const author = authors[themeIndex % authors.length]!

    const { theme } = await makeThemeOnDatabase(
      {
        eventId: event.id,
        authorId: author.id,
        title: seedTheme.title,
        description: seedTheme.description,
        status: ThemeStatus.APPROVED,
        moderatedByUserId: moderator.id,
        moderatedAt: new Date(window.startsAt.getTime() + ONE_DAY_IN_MS),
      },
      isWinner && winnerThemeId ? winnerThemeId : undefined,
    )

    themes.push(theme)
  }

  if (needsWinner) {
    const winner = themes.find((theme) => theme.title === seedEvent.winnerThemeTitle)

    if (!winner) {
      throw new Error(`Tema vencedor "${seedEvent.winnerThemeTitle}" não encontrado no evento "${seedEvent.name}"`)
    }
  }

  return { event, themes }
}

async function seedEvents({
  institutions,
  members,
  users,
  moderator,
}: {
  institutions: Institution[]
  members: InstitutionMember[]
  users: User[]
  moderator: User
}) {
  console.log('[database]: Criando eventos e temas...')

  const eventsByPhase = seedEventsByPhase()
  const cursorByPhase: Record<string, number> = {
    [EventPhase.THEME_SELECTION]: 0,
    [EventPhase.OPEN]: 0,
    [EventPhase.CLOSED]: 0,
  }
  const usersById = new Map(users.map((user) => [user.id.toString(), user]))

  const events = []
  const themes = []
  const phaseCounts = {
    [EventPhase.THEME_SELECTION]: 0,
    [EventPhase.OPEN]: 0,
    [EventPhase.CLOSED]: 0,
  }

  for (const institution of institutions) {
    const authors = pickInstitutionUsers(usersById, members, institution.id.toString())

    for (let eventIndex = 0; eventIndex < EVENTS_PER_INSTITUTION; eventIndex++) {
      const phase = EVENT_PHASE_ROTATION[eventIndex % EVENT_PHASE_ROTATION.length]!
      const seedEvent = takeSeedEvent(eventsByPhase[phase], cursorByPhase, phase)

      const created = await createEventFromSeed({
        institution,
        seedEvent,
        authors,
        moderator,
        eventIndex,
      })

      events.push(created.event)
      themes.push(...created.themes)
      phaseCounts[phase] += 1
    }
  }

  return { events, themes, phaseCounts }
}

function saoPauloCalendarDate(dayOffset: number) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date())

  const year = Number(parts.find((part) => part.type === 'year')?.value)
  const month = Number(parts.find((part) => part.type === 'month')?.value)
  const day = Number(parts.find((part) => part.type === 'day')?.value)
  const shifted = new Date(Date.UTC(year, month - 1, day + dayOffset))
  const shiftedMonth = String(shifted.getUTCMonth() + 1).padStart(2, '0')
  const shiftedDay = String(shifted.getUTCDate()).padStart(2, '0')

  return `${shifted.getUTCFullYear()}-${shiftedMonth}-${shiftedDay}`
}

function schedulePublishedIn(slotIndex: number) {
  const dayOffset = Math.floor(slotIndex / SCHEDULES_PER_DAY) + 1
  const hour = slotIndex % SCHEDULES_PER_DAY === 0 ? '12' : '18'
  const publishedIn = new Date(`${saoPauloCalendarDate(dayOffset)}T${hour}:00:00-03:00`)

  if (publishedIn.getTime() <= Date.now()) {
    throw new Error(`Agendamento ficou no passado: ${publishedIn.toISOString()}`)
  }

  return publishedIn
}

function uniqueProjectSlug(title: string, usedSlugs: Set<string>) {
  const base = Slug.createFromText(title).value
  let slug = base
  let suffix = 2

  while (usedSlugs.has(slug)) {
    slug = `${base}-${suffix}`
    suffix += 1
  }

  usedSlugs.add(slug)

  return slug
}

function institutionUsers(institutionId: string, members: InstitutionMember[], usersById: Map<string, User>) {
  return members
    .filter((member) => member.institutionId === institutionId && member.status === InstitutionMemberStatus.ACTIVE)
    .map((member) => usersById.get(member.userId))
    .filter((user): user is User => Boolean(user))
}

function teacherOverallScore(scores: number[]) {
  return Math.round((scores.reduce((sum, score) => sum + score, 0) / scores.length) * 10) / 10
}

async function seedRatingCriteria() {
  console.log('[database]: Criando critérios de avaliação docente...')

  const criteria = []

  for (const criterionSeed of RATING_CRITERIA_SEED) {
    const { criterion } = await makeRatingCriterionOnDatabase({
      name: criterionSeed.name,
      description: criterionSeed.description,
      weight: criterionSeed.weight,
      active: criterionSeed.active,
    })

    criteria.push(criterion)
  }

  return criteria
}

function listSeedImages() {
  const fileNames = readdirSync(IMAGE_DIR).filter((fileName) => fileName.toLowerCase().endsWith('.png'))

  if (fileNames.length === 0) {
    throw new Error('Não há imagens em infra/database/seed/images.')
  }

  return fileNames
}

async function uploadSeedImage(fileName: string) {
  const filePath = join(IMAGE_DIR, fileName)
  const fileBuffer = readFileSync(filePath)
  const { size } = statSync(filePath)
  const storageKey = Attachment.generateStorageKey(fileName, 'seed')

  const { attachment } = await makeAttachmentOnDatabase({
    storageKey,
    mimeType: 'image/png',
    size,
    name: fileName,
  })

  await makeAttachmentOnStorage(attachment, fileBuffer)

  return attachment.id.toString()
}

async function loadSeedCovers() {
  console.log('[database]: Enviando imagens dos projetos...')

  const fileNames = listSeedImages()
  const covers = new Map<string, string>()

  for (const fileName of fileNames) {
    covers.set(fileName, await uploadSeedImage(fileName))
  }

  return covers
}

function coverForProject(seedProject: SeedProject, covers: Map<string, string>, imageFiles: string[]) {
  const fileName = seedProject.image ?? faker.helpers.arrayElement(imageFiles)
  const coverUrl = covers.get(fileName)

  if (!coverUrl) {
    throw new Error(`Imagem "${fileName}" não encontrada para o projeto "${seedProject.title}".`)
  }

  return coverUrl
}

function takePublishedProject(shuffled: SeedProject[], cursor: { index: number }) {
  const seedProject = shuffled[cursor.index]

  if (!seedProject) {
    throw new Error('Não há projetos publicados suficientes em projetos.json para a reserva das instituições.')
  }

  cursor.index += 1

  return seedProject
}

async function seedProjects({
  users,
  members,
  tags,
  events,
}: {
  users: User[]
  members: InstitutionMember[]
  tags: Tag[]
  events: Event[]
}) {
  console.log('[database]: Criando projetos, tags, coautoria e agenda...')

  const covers = await loadSeedCovers()
  const imageFiles = [...covers.keys()]

  const tagsBySlug = new Map(tags.map((tag) => [tag.slug.value, tag]))
  const usersById = new Map(users.map((user) => [user.id.toString(), user]))
  const shuffled = faker.helpers.shuffle([...SEED_PROJECTS])
  const scheduledCount = SCHEDULED_DAYS * SCHEDULES_PER_DAY
  const closedInstitutionEvents = events.filter(
    (event) => event.phase === EventPhase.CLOSED && event.participationScope === ParticipationScope.INSTITUTION,
  )
  const openInstitutionIds = [
    ...new Set(
      events
        .filter(
          (event) => event.phase === EventPhase.OPEN && event.participationScope === ParticipationScope.INSTITUTION,
        )
        .map((event) => event.institutionId.toString()),
    ),
  ]
  const closedInstitutionIds = new Set(closedInstitutionEvents.map((event) => event.institutionId.toString()))
  const openOnlyInstitutionIds = openInstitutionIds.filter((institutionId) => !closedInstitutionIds.has(institutionId))
  const requiredPublished = closedInstitutionEvents.length * CLOSED_INSTITUTION_PROJECTS + openOnlyInstitutionIds.length

  if (shuffled.length < scheduledCount + requiredPublished) {
    throw new Error(
      `projetos.json tem ${shuffled.length} projetos; o seed precisa de ${scheduledCount} agendados e pelo menos ${requiredPublished} publicados.`,
    )
  }

  const publishedCursor = { index: scheduledCount }
  const authorRotation = faker.helpers.shuffle([...users])
  let rotationIndex = 0
  const nextAuthor = () => {
    const author = authorRotation[rotationIndex % authorRotation.length]

    if (!author) {
      throw new Error('Não há usuários para autoria de projetos.')
    }

    rotationIndex += 1

    return author
  }

  const drafts: ProjectDraft[] = []

  for (const event of closedInstitutionEvents) {
    const institutionId = event.institutionId.toString()
    const authors = institutionUsers(institutionId, members, usersById)

    if (authors.length < CLOSED_INSTITUTION_PROJECTS) {
      throw new Error(
        `Instituição ${institutionId} precisa de pelo menos ${CLOSED_INSTITUTION_PROJECTS} membros para os projetos do evento fechado.`,
      )
    }

    for (let index = 0; index < CLOSED_INSTITUTION_PROJECTS; index++) {
      const author = authors[index]

      if (!author) {
        throw new Error(`Instituição ${institutionId} ficou sem autor para o projeto reservado ${index + 1}.`)
      }

      drafts.push({
        seedProject: takePublishedProject(shuffled, publishedCursor),
        author,
        status: ProjectStatus.PUBLISHED,
        publishedIn: null,
        closedEventId: event.id.toString(),
        institutionId,
      })
    }
  }

  for (const institutionId of openOnlyInstitutionIds) {
    const authors = institutionUsers(institutionId, members, usersById)
    const author = authors[0]

    if (!author) {
      throw new Error(`Instituição ${institutionId} não possui membros para o evento institucional aberto.`)
    }

    drafts.push({
      seedProject: takePublishedProject(shuffled, publishedCursor),
      author,
      status: ProjectStatus.PUBLISHED,
      publishedIn: null,
      closedEventId: null,
      institutionId,
    })
  }

  while (publishedCursor.index < shuffled.length) {
    drafts.push({
      seedProject: takePublishedProject(shuffled, publishedCursor),
      author: nextAuthor(),
      status: ProjectStatus.PUBLISHED,
      publishedIn: null,
      closedEventId: null,
      institutionId: null,
    })
  }

  shuffled.slice(0, scheduledCount).forEach((seedProject, index) => {
    drafts.push({
      seedProject,
      author: nextAuthor(),
      status: ProjectStatus.SCHEDULED,
      publishedIn: schedulePublishedIn(index),
      closedEventId: null,
      institutionId: null,
    })
  })

  const usedSlugs = new Set<string>()
  const projects: Project[] = []
  const published: Project[] = []
  const scheduled: Project[] = []
  const reservedForClosedEvent = new Map<string, Project[]>()
  const reservedForInstitution = new Map<string, Project[]>()

  for (const draft of drafts) {
    const tagIds = draft.seedProject.tags.map((tagSlug) => {
      const tag = tagsBySlug.get(tagSlug)

      if (!tag) {
        throw new Error(`Tag não encontrada para o slug "${tagSlug}" no projeto "${draft.seedProject.title}"`)
      }

      return tag.id
    })

    const { project } = await makeProjectOnDatabase({
      title: draft.seedProject.title,
      slug: uniqueProjectSlug(draft.seedProject.title, usedSlugs),
      description: draft.seedProject.description,
      author: draft.author.id,
      status: draft.status,
      tags: tagIds.map((tagId) => tagId.toString()),
      coverUrl: coverForProject(draft.seedProject, covers, imageFiles),
    })

    for (const tagId of tagIds) {
      await makeProjectTagOnDatabase({
        projectId: project.id,
        tagId,
      })
    }

    if (draft.status === ProjectStatus.SCHEDULED) {
      if (!draft.publishedIn) {
        throw new Error(`Projeto agendado "${project.title}" ficou sem data de publicação.`)
      }

      await makeProjectScheduledOnDatabase({
        projectId: project.id,
        publishedIn: draft.publishedIn,
      })
      scheduled.push(project)
    } else {
      published.push(project)
    }

    if (draft.closedEventId) {
      const reserved = reservedForClosedEvent.get(draft.closedEventId) ?? []
      reserved.push(project)
      reservedForClosedEvent.set(draft.closedEventId, reserved)
    }

    if (draft.institutionId) {
      const reserved = reservedForInstitution.get(draft.institutionId) ?? []
      reserved.push(project)
      reservedForInstitution.set(draft.institutionId, reserved)
    }

    projects.push(project)
  }

  const coauthoredProjects = faker.helpers.shuffle([...projects]).slice(0, Math.round(projects.length / 3))
  const coauthorsByProjectId = new Map<string, string[]>()

  for (const project of coauthoredProjects) {
    const count = faker.number.int({ min: 1, max: 2 })
    const candidates = faker.helpers.shuffle(users.filter((user) => user.id.toString() !== project.author.toString()))
    const selected = candidates.slice(0, count)
    const coauthorIds: string[] = []

    for (const coauthor of selected) {
      await makeProjectMemberOnDatabase({
        projectId: project.id,
        userId: coauthor.id,
        status: ProjectMemberStatus.ACCEPTED,
      })
      coauthorIds.push(coauthor.id.toString())
    }

    coauthorsByProjectId.set(project.id.toString(), coauthorIds)
  }

  const weightedUserIds = new Set(
    members
      .filter((member) => member.status === InstitutionMemberStatus.ACTIVE && WEIGHTED_MEMBER_ROLES.has(member.role))
      .map((member) => member.userId),
  )
  const teachers = users.filter((user) => weightedUserIds.has(user.id.toString()))

  return {
    projects,
    published,
    scheduled,
    coauthorCount: [...coauthorsByProjectId.values()].reduce((total, ids) => total + ids.length, 0),
    coauthorsByProjectId,
    reservedForClosedEvent,
    reservedForInstitution,
    weightedUserIds,
    teachers,
  }
}

async function seedProjectStars({
  projects,
  users,
  weightedUserIds,
  coauthorsByProjectId,
}: {
  projects: Project[]
  users: User[]
  weightedUserIds: Set<string>
  coauthorsByProjectId: Map<string, string[]>
}) {
  console.log('[database]: Criando estrelas e pontos...')

  if (users.length > STAR_USER_THRESHOLD && users.length - 1 < MIN_STARS_PER_PROJECT) {
    throw new Error(
      `Há ${users.length} usuários, mas não há avaliadores suficientes para ${MIN_STARS_PER_PROJECT} estrelas por projeto.`,
    )
  }

  let starCount = 0

  for (const project of projects) {
    const available = users.filter((user) => user.id.toString() !== project.author.toString())
    const minimum = users.length > STAR_USER_THRESHOLD ? MIN_STARS_PER_PROJECT : 1
    const maximum = users.length > STAR_USER_THRESHOLD ? MAX_STARS_PER_PROJECT : available.length
    const count = faker.number.int({
      min: Math.min(minimum, available.length),
      max: Math.min(maximum, available.length),
    })
    const raters = faker.helpers.shuffle(available).slice(0, count)
    const coauthorIds = coauthorsByProjectId.get(project.id.toString()) ?? []

    for (const rater of raters) {
      const weight = weightedUserIds.has(rater.id.toString()) ? 5 : 1
      const { projectStar } = await makeProjectStarOnDatabase({
        projectId: project.id,
        userId: rater.id,
        weight,
        active: true,
      })

      const beneficiaries = new Set<string>([project.author.toString(), ...coauthorIds])
      beneficiaries.delete(rater.id.toString())

      for (const beneficiaryId of beneficiaries) {
        await makePointTransactionOnDatabase({
          userId: new UniqueEntityId(beneficiaryId),
          type: PointTransactionType.CREDIT,
          amount: projectStar.weight,
          reason: PointTransactionReason.STAR_RECEIVED,
          referenceId: projectStar.id,
        })
      }

      starCount += 1
    }
  }

  return starCount
}

async function seedTeacherRatings({
  projects,
  teachers,
  criteria,
}: {
  projects: Project[]
  teachers: User[]
  criteria: RatingCriterion[]
}) {
  console.log('[database]: Criando avaliações docentes...')

  if (criteria.length === 0) {
    throw new Error('Não há critérios avaliativos para a banca.')
  }

  if (teachers.length < 3) {
    throw new Error('Não há professores suficientes para avaliar os projetos publicados.')
  }

  let ratingCount = 0

  for (const project of projects) {
    const candidates = teachers.filter((teacher) => teacher.id.toString() !== project.author.toString())

    if (candidates.length < 3) {
      throw new Error(`Projeto "${project.title}" não tem 3 professores disponíveis para a avaliação.`)
    }

    const count = faker.number.int({ min: 3, max: Math.min(5, candidates.length) })
    const selected = faker.helpers.shuffle(candidates).slice(0, count)

    for (const teacher of selected) {
      const ratingId = new UniqueEntityId()
      const scores = criteria.map(() => faker.number.int({ min: 0, max: 10 }))
      const items = criteria.map((criterion, index) => {
        const score = scores[index]

        if (score === undefined) {
          throw new Error(`Nota ausente no critério "${criterion.name}".`)
        }

        return TeacherRatingItem.create({
          ratingId,
          criterionId: criterion.id,
          score,
        })
      })

      await makeProjectTeacherRatingOnDatabase(
        {
          projectId: project.id,
          teacherId: teacher.id,
          overallScore: teacherOverallScore(scores),
          items,
        },
        ratingId,
      )

      ratingCount += 1
    }
  }

  return ratingCount
}

async function seedPromotions({
  projects,
  users,
  coauthorsByProjectId,
}: {
  projects: Project[]
  users: User[]
  coauthorsByProjectId: Map<string, string[]>
}) {
  console.log('[database]: Criando promoções...')

  const chosen = faker.helpers.shuffle([...projects]).slice(0, PROMOTION_COUNT)

  if (chosen.length < PROMOTION_COUNT) {
    throw new Error(`Não há projetos publicados suficientes para ${PROMOTION_COUNT} promoções.`)
  }

  const usedPromoters = new Set<string>()

  for (const project of chosen) {
    const blocked = new Set<string>([
      project.author.toString(),
      ...(coauthorsByProjectId.get(project.id.toString()) ?? []),
    ])
    const promoter = users.find((user) => !usedPromoters.has(user.id.toString()) && !blocked.has(user.id.toString()))

    if (!promoter) {
      throw new Error(`Não há usuário elegível para promover o projeto "${project.title}".`)
    }

    usedPromoters.add(promoter.id.toString())

    await makePointTransactionOnDatabase({
      userId: promoter.id,
      type: PointTransactionType.CREDIT,
      amount: PROMOTION_COST,
      reason: PointTransactionReason.STAR_RECEIVED,
    })

    const { promotion } = await makePromotionOnDatabase({
      projectId: project.id,
      promoterId: promoter.id,
      cost: PROMOTION_COST,
      expiresAt: PROMOTION_EXPIRES_AT,
    })

    await makePointTransactionOnDatabase({
      userId: promoter.id,
      type: PointTransactionType.DEBIT,
      amount: promotion.cost,
      reason: PointTransactionReason.PROMOTION,
      referenceId: promotion.id,
    })
  }

  return chosen.length
}

async function seedEventRegistrations({
  events,
  published,
  reservedForClosedEvent,
  reservedForInstitution,
  reviewer,
}: {
  events: Event[]
  published: Project[]
  reservedForClosedEvent: Map<string, Project[]>
  reservedForInstitution: Map<string, Project[]>
  reviewer: User
}) {
  console.log('[database]: Inscrevendo projetos nos eventos...')

  if (published.length === 0) {
    throw new Error('Não há projetos publicados para inscrever nos eventos.')
  }

  let openCount = 0
  let closedCount = 0
  let globalCursor = 0

  for (const event of events) {
    if (event.phase === EventPhase.OPEN) {
      const project =
        event.participationScope === ParticipationScope.INSTITUTION
          ? reservedForInstitution.get(event.institutionId.toString())?.[0]
          : published[globalCursor % published.length]

      if (!project) {
        throw new Error(`Evento aberto "${event.name}" ficou sem projeto publicado elegível.`)
      }

      if (event.participationScope === ParticipationScope.GLOBAL) {
        globalCursor += 1
      }

      await makeEventRegistrationOnDatabase({
        eventId: event.id,
        projectId: project.id,
        responsibleUserId: project.author,
        status: EventRegistrationStatus.PENDING,
        registeredAt: new Date(Math.max(event.startsAt.getTime(), Date.now() - ONE_DAY_IN_MS)),
      })
      openCount += 1
      continue
    }

    if (event.phase !== EventPhase.CLOSED) {
      continue
    }

    const selected =
      event.participationScope === ParticipationScope.INSTITUTION
        ? (reservedForClosedEvent.get(event.id.toString()) ?? [])
        : faker.helpers
            .shuffle([...published])
            .slice(0, faker.number.int({ min: 3, max: Math.min(5, published.length) }))

    if (event.participationScope === ParticipationScope.INSTITUTION && selected.length < CLOSED_INSTITUTION_PROJECTS) {
      throw new Error(
        `Evento fechado "${event.name}" não recebeu ${CLOSED_INSTITUTION_PROJECTS} projetos da instituição.`,
      )
    }

    if (selected.length < 3) {
      throw new Error(`Evento fechado "${event.name}" ficou com menos de 3 projetos.`)
    }

    const registeredAt = new Date(event.startsAt.getTime() + ONE_DAY_IN_MS)
    const reviewedAt = new Date(event.endsAt.getTime() - ONE_DAY_IN_MS)

    for (const project of selected) {
      await makeEventRegistrationOnDatabase({
        eventId: event.id,
        projectId: project.id,
        responsibleUserId: project.author,
        status: EventRegistrationStatus.APPROVED,
        reviewedByUserId: reviewer.id,
        reviewedAt,
        reviewReason: 'Inscrição aprovada no seed.',
        registeredAt,
      })
      closedCount += 1
    }
  }

  return { openCount, closedCount }
}

async function seed() {
  console.log('[database]: Iniciando seed...')

  await resetDatabase()

  console.log('[database]: Criando usuário seed...')

  const registerBy = await seedUser({
    name: 'Renan Oliveira',
    email: 'rotrenanoliveira@gmail.com',
    status: UserStatus.ACTIVE,
    role: UserRole.ADMIN,
  })

  const institutions = await seedInstitutions(registerBy.id)
  const { users: memberUsers, members } = await seedInstitutionMembers(institutions)
  const unlinkedUsers = await seedUnlinkedUsers(UNLINKED_USER_COUNT)
  const tags = await seedTags()

  const allUsers = [registerBy, ...memberUsers, ...unlinkedUsers]
  const callSeed = await seedCalls(allUsers, tags)
  const eventSeed = await seedEvents({
    institutions,
    members,
    users: allUsers,
    moderator: registerBy,
  })
  const criteria = await seedRatingCriteria()
  const projectSeed = await seedProjects({
    users: allUsers,
    members,
    tags,
    events: eventSeed.events,
  })
  const starCount = await seedProjectStars({
    projects: projectSeed.published,
    users: allUsers,
    weightedUserIds: projectSeed.weightedUserIds,
    coauthorsByProjectId: projectSeed.coauthorsByProjectId,
  })
  const teacherRatingCount = await seedTeacherRatings({
    projects: projectSeed.published,
    teachers: projectSeed.teachers,
    criteria,
  })
  const promotionCount = await seedPromotions({
    projects: projectSeed.published,
    users: allUsers,
    coauthorsByProjectId: projectSeed.coauthorsByProjectId,
  })
  const registrationSeed = await seedEventRegistrations({
    events: eventSeed.events,
    published: projectSeed.published,
    reservedForClosedEvent: projectSeed.reservedForClosedEvent,
    reservedForInstitution: projectSeed.reservedForInstitution,
    reviewer: registerBy,
  })

  console.log(`[database]: Instituições: ${institutions.length}`)
  console.log(`[database]: Membros: ${members.length}`)
  console.log(`[database]: Usuários: ${allUsers.length}`)
  console.log(`[database]: Tags: ${tags.length}`)
  console.log(`[database]: Chamados abertos por autores (1/5): ${callSeed.openAuthors}`)
  console.log(`[database]: Chamados abertos por autores com chamados fechados: ${callSeed.openAuthorsWithClosed}`)
  console.log(`[database]: Chamados fechados por autores: ${callSeed.closedOnlyAuthors}`)
  console.log(`[database]: Chamados: ${callSeed.calls.length}`)
  console.log(`[database]: Candidaturas: ${callSeed.applications.length}`)
  console.log(`[database]: Eventos: ${eventSeed.events.length}`)
  console.log(`[database]: Eventos em votação: ${eventSeed.phaseCounts[EventPhase.THEME_SELECTION]}`)
  console.log(`[database]: Eventos abertos para projetos: ${eventSeed.phaseCounts[EventPhase.OPEN]}`)
  console.log(`[database]: Eventos fechados: ${eventSeed.phaseCounts[EventPhase.CLOSED]}`)
  console.log(`[database]: Temas de eventos: ${eventSeed.themes.length}`)
  console.log(`[database]: Projetos: ${projectSeed.projects.length}`)
  console.log(`[database]: Projetos publicados: ${projectSeed.published.length}`)
  console.log(`[database]: Projetos agendados: ${projectSeed.scheduled.length}`)
  console.log(`[database]: Coautores: ${projectSeed.coauthorCount}`)
  console.log(`[database]: Estrelas: ${starCount}`)
  console.log(`[database]: Avaliações docentes: ${teacherRatingCount}`)
  console.log(`[database]: Critérios de avaliação: ${criteria.length}`)
  console.log(`[database]: Promoções: ${promotionCount}`)
  console.log(`[database]: Inscrições em eventos abertos: ${registrationSeed.openCount}`)
  console.log(`[database]: Inscrições em eventos fechados: ${registrationSeed.closedCount}`)
  console.log('[database]: Seed finalizado com sucesso!')
}

seed()
  .then(() => {
    process.exit(0)
  })
  .catch((error) => {
    console.error('[database]: Seed falhou:', error)
    process.exit(1)
  })
