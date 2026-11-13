/** biome-ignore-all lint/style/noNonNullAssertion: seed file */
import { readFileSync, statSync } from 'node:fs'
import { resolve } from 'node:path'
import { faker } from '@faker-js/faker'
import { makeAccessCodeOnDatabase } from '@tests/factories/make-access-code'
import { makeAccountOnDatabase } from '@tests/factories/make-account'
import { makeAttachmentOnDatabase, makeAttachmentOnStorage } from '@tests/factories/make-attachment'
import { makeEventOnDatabase } from '@tests/factories/make-event'
import { makeInstitutionOnDatabase } from '@tests/factories/make-institution'
import { makeInstitutionMemberOnDatabase } from '@tests/factories/make-institution-member'
import { makeInstitutionMembershipRequestOnDatabase } from '@tests/factories/make-institution-membership-request'
import { makePointTransactionOnDatabase } from '@tests/factories/make-point-transaction'
import { makePreferenceTagOnDatabase } from '@tests/factories/make-preference-tag'
import { makeProjectOnDatabase } from '@tests/factories/make-project'
import { makeProjectScheduledOnDatabase } from '@tests/factories/make-project-scheduled'
import { makeProjectStarOnDatabase } from '@tests/factories/make-project-star'
import { makeProjectTagOnDatabase } from '@tests/factories/make-project-tag'
import { makeProjectTeacherRatingOnDatabase } from '@tests/factories/make-project-teacher-rating'
import { makePromotionOnDatabase } from '@tests/factories/make-promotion'
import { makeRatingCriterionOnDatabase } from '@tests/factories/make-rating-criterion'
import { makeSessionOnDatabase } from '@tests/factories/make-session'
import { makeTagOnDatabase } from '@tests/factories/make-tag'
import { makeThemeOnDatabase } from '@tests/factories/make-theme'
import { makeUserOnDatabase } from '@tests/factories/make-user'
import { sql } from 'drizzle-orm'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { Slug } from '@/core/entities/value-objects/slug'
import { EventPhase, ParticipationScope } from '@/domain/event/enterprise/entities/event'
import { ThemeStatus } from '@/domain/event/enterprise/entities/theme'
import { UserRole, UserStatus } from '@/domain/identity/enterprise/entities/user'
import {
  InstitutionMemberRole,
  InstitutionMemberStatus,
} from '@/domain/institution/enterprise/entities/institution-member'
import {
  InstitutionMembershipRequestRole,
  InstitutionMembershipRequestStatus,
} from '@/domain/institution/enterprise/entities/institution-membership-request'
import { InstitutionOrigin, InstitutionType } from '@/domain/institution/enterprise/entities/institutions'
import { PROMOTION_COST, PROMOTION_DURATION_DAYS } from '@/domain/points/application/constants/promotion-rules'
import { PointTransactionReason, PointTransactionType } from '@/domain/points/enterprise/entities/point-transaction'
import { ProjectStatus } from '@/domain/project/enterprise/entities/project'
import { Attachment } from '@/domain/storage/enterprise/entities/attachment'
import { PreferenceTagStatus } from '@/domain/tag/enterprise/entities/preference-tag'
import { BcryptHasher } from '@/infra/cryptography/bcrypt-hasher'
import { db } from '@/infra/database/drizzle/client'

const FILES_DIR = resolve(process.cwd(), 'tests/files')
const SEED_ACCESS_CODE = 'SEEDCODE1234'
const ATTACHMENT_FOLDER = 'seed'

const IMAGE_FILES = [
  { fileName: '1-pintura.jpg', mimeType: 'image/jpeg' },
  { fileName: '2-pintura.jpeg', mimeType: 'image/jpeg' },
  { fileName: '3-pintura.png', mimeType: 'image/png' },
  { fileName: '4-pintura.png', mimeType: 'image/png' },
  { fileName: '5-pintura.png', mimeType: 'image/png' },
  { fileName: '6-pintura.png', mimeType: 'image/png' },
] as const

const TAG_NAMES = ['Inteligência Artificial', 'Educação', 'Sustentabilidade', 'Saúde', 'Cultura']
const PROJECT_COUNT = 30
const MIN_PROJECTS_PER_TAG = 5

const INSTITUTION_SEEDS = [
  {
    name: faker.lorem.word(4).toLocaleUpperCase(),
    type: InstitutionType.UNIVERSITY,
    description: 'Instituição federal focada em pesquisa e extensão acadêmica.',
    domain: 'ufs.edu.br',
    shouldProof: true,
    shouldVerify: true,
  },
  {
    name: faker.lorem.word(4).toLocaleUpperCase(),
    type: InstitutionType.COLLEGE,
    description: 'Faculdade privada com ênfase em cursos tecnológicos.',
    domain: 'fts.edu.br',
    shouldProof: false,
    shouldVerify: true,
  },
  {
    name: faker.lorem.word(4).toLocaleUpperCase(),
    type: InstitutionType.CENTER,
    description: 'Centro interdisciplinar de inovação e empreendedorismo.',
    domain: 'cia.org.br',
    shouldProof: true,
    shouldVerify: false,
  },
  {
    name: faker.lorem.word(4).toLocaleUpperCase(),
    type: InstitutionType.TECHNICAL_COLLEGE,
    description: 'Escola técnica com cursos profissionalizantes.',
    domain: 'its.edu.br',
    shouldProof: false,
    shouldVerify: false,
  },
  {
    name: faker.lorem.word(4).toLocaleUpperCase(),
    type: InstitutionType.OTHER,
    description: 'Coletivo acadêmico independente para projetos colaborativos.',
    domain: undefined,
    shouldProof: false,
    shouldVerify: false,
  },
] as const

const EVENT_SEEDS = [
  {
    name: 'Mostra Acadêmica 2026',
    participationScope: ParticipationScope.GLOBAL,
    themeTitle: 'Pesquisa e extensão para o bem comum',
    themeDescription: 'Projetos que conectam produção científica e impacto social nas comunidades locais.',
  },
  {
    name: 'Feira de Tecnologia',
    participationScope: ParticipationScope.INSTITUTION,
    themeTitle: 'Inovação tecnológica aplicada',
    themeDescription: 'Soluções digitais, hardware e software com foco em problemas reais do mercado.',
  },
  {
    name: 'Semana de Inovação',
    participationScope: ParticipationScope.GLOBAL,
    themeTitle: 'Empreendedorismo e criatividade interdisciplinar',
    themeDescription: 'Ideias que cruzam áreas do conhecimento para gerar produtos e serviços originais.',
  },
  {
    name: 'Mostra Técnica Profissionalizante',
    participationScope: ParticipationScope.INSTITUTION,
    themeTitle: 'Formação técnica e práticas de oficina',
    themeDescription: 'Trabalhos que demonstram domínio técnico e aplicação prática em ambientes produtivos.',
  },
  {
    name: 'Encontro Colaborativo',
    participationScope: ParticipationScope.GLOBAL,
    themeTitle: 'Colaboração aberta e projetos comunitários',
    themeDescription: 'Iniciativas colaborativas que fortalecem redes acadêmicas e produção cultural compartilhada.',
  },
] as const

function projectStatusAt(index: number) {
  if (index < 20) return ProjectStatus.PUBLISHED
  if (index < 24) return ProjectStatus.SCHEDULED
  if (index < 27) return ProjectStatus.SKETCH
  return ProjectStatus.ARCHIVED
}

function projectTagIndex(index: number, tagCount: number) {
  return index % tagCount
}

const MEMBER_ROLES = [
  InstitutionMemberRole.MANAGER,
  InstitutionMemberRole.PROFESSOR,
  InstitutionMemberRole.TEACHER,
  InstitutionMemberRole.STUDENT,
  InstitutionMemberRole.ADMINISTRATIVE_OFFICE,
] as const

const REQUEST_ROLES = [
  InstitutionMembershipRequestRole.STUDENT,
  InstitutionMembershipRequestRole.PROFESSOR,
  InstitutionMembershipRequestRole.TEACHER,
  InstitutionMembershipRequestRole.MANAGER,
  InstitutionMembershipRequestRole.ADMINISTRATIVE_OFFICE,
] as const

const REQUEST_STATUSES = [
  InstitutionMembershipRequestStatus.PENDING,
  InstitutionMembershipRequestStatus.PENDING,
  InstitutionMembershipRequestStatus.APPROVED,
  InstitutionMembershipRequestStatus.REJECTED,
  InstitutionMembershipRequestStatus.PENDING,
] as const

async function resetDatabase() {
  console.log('Limpando tabelas...')
  await db.execute(
    sql`TRUNCATE TABLE "users", "accounts", "attachments", "tags", "preference_tags", "projects", "project_tags", "project_scheduled", "project_stars", "project_teacher_ratings", "teacher_rating_items", "rating_criteria", "access_codes", "sessions", "institutions", "institution_members", "institution_membership_requests", "events", "event_themes", "event_votes", "event_registrations" CASCADE`,
  )
}

/** 4 critérios canônicos (FEATURE-AVALIACAO §2.3) — pesos iguais; notas 0–10. */
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

async function seedRatingCriteria() {
  console.log('Criando critérios de avaliação docente (4 categorias canônicas)...')

  for (const [index, criterionSeed] of RATING_CRITERIA_SEED.entries()) {
    const { criterion } = await makeRatingCriterionOnDatabase({
      name: criterionSeed.name,
      description: criterionSeed.description,
      weight: criterionSeed.weight,
      active: criterionSeed.active,
    })

    console.log(`  ✓ ${index + 1}/${RATING_CRITERIA_SEED.length} ${criterion.name}`)
  }
}

async function seedAttachments() {
  console.log('Enviando attachments para o Cloudflare R2...')

  const attachments = []

  for (const [index, image] of IMAGE_FILES.entries()) {
    const filePath = resolve(FILES_DIR, image.fileName)
    const fileBuffer = readFileSync(filePath)
    const { size } = statSync(filePath)
    const storageKey = Attachment.generateStorageKey(image.fileName, ATTACHMENT_FOLDER)

    const { attachment } = await makeAttachmentOnDatabase({
      storageKey,
      mimeType: image.mimeType,
      size,
      name: image.fileName,
    })

    await makeAttachmentOnStorage(attachment, fileBuffer)

    console.log(`  ✓ ${index + 1}/${IMAGE_FILES.length} ${image.fileName} → ${storageKey}`)
    attachments.push(attachment)
  }

  return attachments
}

async function seed() {
  console.log('Iniciando seed...\n')

  await resetDatabase()

  await seedRatingCriteria()

  const attachments = await seedAttachments()

  console.log('\nCriando usuários e contas...')
  const users = []
  const accounts = []

  for (let i = 1; i <= 6; i++) {
    const { user } = await makeUserOnDatabase({
      name: faker.person.fullName(),
      email: i === 1 ? 'admin@vitrine.local' : faker.internet.email(),
      status: UserStatus.ACTIVE,
      role: i === 1 ? UserRole.ADMIN : UserRole.USER,
    })

    const avatarId = i <= attachments.length ? attachments[i - 1]?.id : null

    const { account } = await makeAccountOnDatabase({
      userId: user.id,
      avatarId,
      confirmationAt: new Date(),
      consentedAt: new Date(),
    })

    users.push(user)
    accounts.push(account)
    console.log(`  ✓ ${user.email}`)
  }

  console.log('\nCriando tags...')
  const tags = []

  for (const name of TAG_NAMES) {
    const { tag } = await makeTagOnDatabase({
      name,
      slug: Slug.createFromText(name),
    })
    tags.push(tag)
    console.log(`  ✓ ${tag.name}`)
  }

  console.log('\nCriando instituições...')
  const institutions = []

  for (const [index, data] of INSTITUTION_SEEDS.entries()) {
    const registerBy = users[index]?.id
    const { institution } = await makeInstitutionOnDatabase({
      name: data.name,
      slug: Slug.createFromText(data.name),
      type: data.type,
      origin: InstitutionOrigin.SEED,
      description: data.description,
      registerBy,
      shouldProof: data.shouldProof,
      shouldVerify: data.shouldVerify,
      domain: data.domain,
    })
    institutions.push(institution)
    console.log(`  ✓ ${institution.name}`)
  }

  console.log('\nCriando membros de instituições...')
  const members = []

  for (let i = 0; i < 5; i++) {
    const { member } = await makeInstitutionMemberOnDatabase({
      institutionId: institutions[i]?.id.toString(),
      userId: users[i]?.id.toString(),
      role: MEMBER_ROLES[i]!,
      status: InstitutionMemberStatus.ACTIVE,
    })
    members.push(member)
  }

  // membro extra cruzado para enriquecer vínculos
  const { member: extraMember } = await makeInstitutionMemberOnDatabase({
    institutionId: institutions[0]?.id.toString(),
    userId: users[5]?.id.toString(),
    role: InstitutionMemberRole.STUDENT,
    status: InstitutionMemberStatus.ACTIVE,
  })
  members.push(extraMember)
  console.log(`  ✓ ${members.length} membros`)

  console.log('\nCriando eventos com temas escolhidos...')
  const events = []
  const themes = []

  for (const [index, data] of EVENT_SEEDS.entries()) {
    const institution = institutions[index]!
    const author = users[index]!
    const moderator = users[0]!
    const winnerThemeId = new UniqueEntityId()
    const eventName = data.name
    const eventSlug = `evento-${Slug.createFromText(eventName).value}-${institution.slug.value}`

    const { event } = await makeEventOnDatabase({
      institutionId: institution.id,
      slug: eventSlug,
      name: eventName,
      participationScope: data.participationScope,
      phase: EventPhase.OPEN,
      winnerThemeId,
      startsAt: new Date(),
    })

    const { theme } = await makeThemeOnDatabase(
      {
        eventId: event.id,
        authorId: author.id,
        title: data.themeTitle,
        description: data.themeDescription,
        status: ThemeStatus.APPROVED,
        moderatedByUserId: moderator.id,
        moderatedAt: new Date(),
      },
      winnerThemeId,
    )

    events.push(event)
    themes.push(theme)
    console.log(`  ✓ ${event.name} → tema: ${theme.title}`)
  }

  console.log('\nCriando solicitações de vínculo...')
  const requests = []

  for (let i = 0; i < 5; i++) {
    const needsProof = institutions[i]?.shouldProof
    const { request } = await makeInstitutionMembershipRequestOnDatabase({
      institutionId: institutions[i]?.id.toString(),
      userId: users[(i + 1) % users.length]?.id.toString(),
      role: REQUEST_ROLES[i]!,
      status: REQUEST_STATUSES[i]!,
      proofAttachmentId: needsProof ? attachments[i % attachments.length]?.id.toString() : null,
    })
    requests.push(request)
  }
  console.log(`  ✓ ${requests.length} solicitações`)

  console.log(`\nCriando ${PROJECT_COUNT} projetos com capas/attachments...`)
  const projects = []
  const tagAssignments: { projectIndex: number; tagIndex: number }[] = []

  for (let index = 0; index < PROJECT_COUNT; index++) {
    const cover = attachments[index % attachments.length]!
    const extra = attachments[(index + 1) % attachments.length]!
    const tagIndex = projectTagIndex(index, tags.length)

    const { project } = await makeProjectOnDatabase({
      title: `${faker.lorem.sentence()}`,
      description: faker.lorem.paragraphs(3),
      author: users[index % users.length]?.id,
      status: projectStatusAt(index),
      coverUrl: cover.id.toString(),
      attachments: [extra.id.toString()],
      tags: [tags[tagIndex]?.id.toString()],
    })

    projects.push(project)
    tagAssignments.push({ projectIndex: index, tagIndex })

    console.log(`  ✓ ${project.title} (capa: ${cover.name})`)
  }

  console.log('\nCriando project tags...')
  const projectTags = []
  const projectsPerTag = new Array<number>(tags.length).fill(0)

  for (const assignment of tagAssignments) {
    const { projectTag } = await makeProjectTagOnDatabase({
      projectId: projects[assignment.projectIndex]?.id,
      tagId: tags[assignment.tagIndex]?.id,
    })
    projectTags.push(projectTag)
    projectsPerTag[assignment.tagIndex] = (projectsPerTag[assignment.tagIndex] ?? 0) + 1
  }

  for (const [tagIndex, tag] of tags.entries()) {
    const total = projectsPerTag[tagIndex] ?? 0

    if (total < MIN_PROJECTS_PER_TAG) {
      throw new Error(`A tag "${tag.name}" ficou com ${total} projetos; o mínimo é ${MIN_PROJECTS_PER_TAG}.`)
    }

    console.log(`  ✓ ${tag.name}: ${total} projetos`)
  }

  console.log('\nCriando preference tags...')
  const preferenceTags = []

  for (let i = 0; i < 5; i++) {
    const { preferenceTag } = await makePreferenceTagOnDatabase({
      userId: users[i]?.id,
      tagId: tags[i]?.id,
      status: i === 4 ? PreferenceTagStatus.INACTIVE : PreferenceTagStatus.ACTIVE,
    })
    preferenceTags.push(preferenceTag)
  }

  const { preferenceTag: extraPreference } = await makePreferenceTagOnDatabase({
    userId: users[5]?.id,
    tagId: tags[0]?.id,
    status: PreferenceTagStatus.ACTIVE,
  })
  preferenceTags.push(extraPreference)
  console.log(`  ✓ ${preferenceTags.length} preference tags`)

  console.log('\nCriando projetos agendados...')
  const schedules = []

  for (let i = 0; i < 5; i++) {
    const { projectScheduled } = await makeProjectScheduledOnDatabase({
      projectId: projects[i]?.id,
      publishedIn: new Date(),
    })
    schedules.push(projectScheduled)
  }

  const soonOffsetsInDays = [1, 2, 4, 6] as const

  for (const [index, daysAhead] of soonOffsetsInDays.entries()) {
    const publishedIn = new Date()
    publishedIn.setDate(publishedIn.getDate() + daysAhead)

    const { projectScheduled } = await makeProjectScheduledOnDatabase({
      projectId: projects[20 + index]?.id,
      publishedIn,
    })
    schedules.push(projectScheduled)
  }
  console.log(`  ✓ ${schedules.length} agendamentos (5 hoje + ${soonOffsetsInDays.length} em breve)`)

  const publishedToday = projects.slice(0, 5)

  console.log('\nCriando avaliações docentes (banca)...')
  const teacherRatings = []

  const teacherRatingSeeds = [
    { projectIndex: 0, teacherIndex: 1, overallScore: 9 },
    { projectIndex: 0, teacherIndex: 2, overallScore: 7 },
    { projectIndex: 1, teacherIndex: 2, overallScore: 9.5 },
    { projectIndex: 2, teacherIndex: 1, overallScore: 6 },
    { projectIndex: 3, teacherIndex: 1, overallScore: 8 },
    { projectIndex: 4, teacherIndex: 2, overallScore: 6.5 },
  ] as const

  for (const seed of teacherRatingSeeds) {
    const { teacherRating } = await makeProjectTeacherRatingOnDatabase({
      projectId: publishedToday[seed.projectIndex]!.id,
      teacherId: users[seed.teacherIndex]!.id,
      overallScore: seed.overallScore,
      items: [],
    })
    teacherRatings.push(teacherRating)
  }
  console.log(`  ✓ ${teacherRatings.length} avaliações docentes`)

  console.log('\nCriando estrelas (comunidade)...')
  const projectStars = []

  const starSeeds = [
    { projectIndex: 0, userIndex: 2, weight: 5, active: true },
    { projectIndex: 0, userIndex: 3, weight: 1, active: true },
    { projectIndex: 1, userIndex: 3, weight: 1, active: true },
    { projectIndex: 1, userIndex: 4, weight: 1, active: true },
    { projectIndex: 1, userIndex: 5, weight: 1, active: true },
    { projectIndex: 2, userIndex: 1, weight: 5, active: true },
    { projectIndex: 3, userIndex: 0, weight: 1, active: false },
  ] as const

  for (const seed of starSeeds) {
    const { projectStar } = await makeProjectStarOnDatabase({
      projectId: publishedToday[seed.projectIndex]!.id,
      userId: users[seed.userIndex]!.id,
      weight: seed.weight,
      active: seed.active,
    })
    projectStars.push(projectStar)
  }
  console.log(`  ✓ ${projectStars.length} estrelas`)

  console.log('\nCriando sessões...')
  const sessions = []

  for (let i = 0; i < 5; i++) {
    const { session } = await makeSessionOnDatabase({
      accountId: accounts[i]?.id,
      userId: users[i]?.id,
      expiresAt: new Date(Date.now() + (i + 1) * 24 * 60 * 60 * 1000),
    })
    sessions.push(session)
  }

  const { session: extraSession } = await makeSessionOnDatabase({
    accountId: accounts[5]?.id,
    userId: users[5]?.id,
    expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    revokedAt: new Date(),
  })
  sessions.push(extraSession)
  console.log(`  ✓ ${sessions.length} sessões`)

  console.log('\nCriando access codes...')
  const hasher = new BcryptHasher()
  const codeHash = await hasher.hash(SEED_ACCESS_CODE)
  const accessCodes = []

  for (let i = 0; i < 5; i++) {
    const { accessCode } = await makeAccessCodeOnDatabase({
      accountId: accounts[i]?.id,
      codeHash,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      plainCode: SEED_ACCESS_CODE,
    })
    accessCodes.push(accessCode)
  }

  const { accessCode: consumedCode } = await makeAccessCodeOnDatabase({
    accountId: accounts[5]?.id,
    codeHash,
    expiresAt: new Date(Date.now() + 15 * 60 * 1000),
    consumedAt: new Date(),
    plainCode: SEED_ACCESS_CODE,
  })
  accessCodes.push(consumedCode)
  console.log(`  ✓ ${accessCodes.length} access codes`)

  console.log('\nSeed concluído com sucesso!')
  console.log('────────────────────────────────────')
  console.log(`Users: ${users.length}`)
  console.log(`Accounts: ${accounts.length}`)
  console.log(`Attachments: ${attachments.length}`)
  console.log(`Tags: ${tags.length}`)
  console.log(`Institutions: ${institutions.length}`)
  console.log(`Institution members: ${members.length}`)
  console.log(`Events: ${events.length}`)
  console.log(`Themes: ${themes.length}`)
  console.log(`Membership requests: ${requests.length}`)
  console.log(`Projects: ${projects.length}`)
  console.log(`Project tags: ${projectTags.length}`)

  console.log('\nCriando estrelas e pontos...')

  const starSeeds = [
    { project: projects[0], starrer: users[1], weight: 5, daysAgo: 4 },
    { project: projects[0], starrer: users[3], weight: 1, daysAgo: 3 },
    { project: projects[1], starrer: users[2], weight: 5, daysAgo: 2 },
    { project: projects[1], starrer: users[4], weight: 1, daysAgo: 1 },
  ]

  for (const starSeed of starSeeds) {
    const ratedAt = new Date(Date.now() - starSeed.daysAgo * 24 * 60 * 60 * 1000)

    const { projectStar } = await makeProjectStarOnDatabase({
      projectId: starSeed.project?.id,
      userId: starSeed.starrer?.id,
      weight: starSeed.weight,
      ratedAt,
      createdAt: ratedAt,
    })

    await makePointTransactionOnDatabase({
      userId: starSeed.project?.author,
      type: PointTransactionType.CREDIT,
      amount: projectStar.weight,
      reason: PointTransactionReason.STAR_RECEIVED,
      referenceId: projectStar.id,
      createdAt: ratedAt,
    })
  }

  await makePointTransactionOnDatabase({
    userId: users[0]?.id,
    type: PointTransactionType.CREDIT,
    amount: PROMOTION_COST * 2,
    reason: PointTransactionReason.STAR_RECEIVED,
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
  })

  const promotionCreatedAt = new Date(Date.now() - 24 * 60 * 60 * 1000)

  const { promotion } = await makePromotionOnDatabase({
    projectId: projects[1]?.id,
    promoterId: users[0]?.id,
    cost: PROMOTION_COST,
    createdAt: promotionCreatedAt,
    expiresAt: new Date(promotionCreatedAt.getTime() + PROMOTION_DURATION_DAYS * 24 * 60 * 60 * 1000),
  })

  await makePointTransactionOnDatabase({
    userId: users[0]?.id,
    type: PointTransactionType.DEBIT,
    amount: promotion.cost,
    reason: PointTransactionReason.PROMOTION,
    referenceId: promotion.id,
    createdAt: promotionCreatedAt,
  })

  console.log(`  ✓ ${starSeeds.length} estrelas, ${starSeeds.length + 2} transações de pontos, 1 promoção`)
  console.log(`Preference tags: ${preferenceTags.length}`)
  console.log(`Project scheduled: ${schedules.length}`)
  console.log(`Teacher ratings: ${teacherRatings.length}`)
  console.log(`Project stars: ${projectStars.length}`)
  console.log(`Project stars: ${starSeeds.length}`)
  console.log(`Point transactions: ${starSeeds.length + 2}`)
  console.log('Promotions: 1')
  console.log(`Sessions: ${sessions.length}`)
  console.log(`Access codes: ${accessCodes.length}`)
  console.log('────────────────────────────────────')
  console.log('Login de exemplo:')
  console.log(`  email: admin@vitrine.local`)
  console.log(`  code:  ${SEED_ACCESS_CODE}`)
}

seed()
  .then(() => {
    process.exit(0)
  })
  .catch((error) => {
    console.error('\nSeed falhou:', error)
    process.exit(1)
  })
