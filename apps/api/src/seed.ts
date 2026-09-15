import { readFileSync, statSync } from 'node:fs'
import { resolve } from 'node:path'
import { faker } from '@faker-js/faker'
import { makeAccessCodeOnDatabase } from '@tests/factories/make-access-code'
import { makeAccountOnDatabase } from '@tests/factories/make-account'
import { makeAttachmentOnDatabase, makeAttachmentOnStorage } from '@tests/factories/make-attachment'
import { makeInstitutionOnDatabase } from '@tests/factories/make-institution'
import { makeInstitutionMemberOnDatabase } from '@tests/factories/make-institution-member'
import { makeInstitutionMembershipRequestOnDatabase } from '@tests/factories/make-institution-membership-request'
import { makePreferenceTagOnDatabase } from '@tests/factories/make-preference-tag'
import { makeProjectOnDatabase } from '@tests/factories/make-project'
import { makeProjectScheduledOnDatabase } from '@tests/factories/make-project-scheduled'
import { makeProjectTagOnDatabase } from '@tests/factories/make-project-tag'
import { makeSessionOnDatabase } from '@tests/factories/make-session'
import { makeTagOnDatabase } from '@tests/factories/make-tag'
import { makeUserOnDatabase } from '@tests/factories/make-user'
import { sql } from 'drizzle-orm'
import { Slug } from '@/core/entities/value-objects/slug'
import { UserStatus } from '@/domain/identity/enterprise/entities/user'
import {
  InstitutionMemberRole,
  InstitutionMemberStatus,
} from '@/domain/institution/enterprise/entities/institution-member'
import {
  InstitutionMembershipRequestRole,
  InstitutionMembershipRequestStatus,
} from '@/domain/institution/enterprise/entities/institution-membership-request'
import { InstitutionOrigin, InstitutionType } from '@/domain/institution/enterprise/entities/institutions'
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
  { fileName: '2-pintura.jpg', mimeType: 'image/jpeg' },
  { fileName: '3-pintura.jpg', mimeType: 'image/jpeg' },
  { fileName: '4-pintura.jpeg', mimeType: 'image/jpeg' },
] as const

const TAG_NAMES = ['Inteligência Artificial', 'Educação', 'Sustentabilidade', 'Saúde', 'Cultura', 'Tecnologia']

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

const PROJECT_SEEDS = [
  {
    title: faker.lorem.word(4).toLocaleUpperCase(),
    description: faker.lorem.sentence(),
    status: ProjectStatus.PUBLISHED,
  },
  {
    title: faker.lorem.word(4).toLocaleUpperCase(),
    description: faker.lorem.sentence(),
    status: ProjectStatus.PUBLISHED,
  },
  {
    title: faker.lorem.word(4).toLocaleUpperCase(),
    description: faker.lorem.sentence(),
    status: ProjectStatus.SCHEDULED,
  },
  {
    title: faker.lorem.word(4).toLocaleUpperCase(),
    description: faker.lorem.sentence(),
    status: ProjectStatus.SCHEDULED,
  },
  {
    title: faker.lorem.word(4).toLocaleUpperCase(),
    description: faker.lorem.sentence(),
    status: ProjectStatus.SKETCH,
  },
  {
    title: faker.lorem.word(4).toLocaleUpperCase(),
    description: faker.lorem.sentence(),
    status: ProjectStatus.ARCHIVED,
  },
] as const

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
    sql`TRUNCATE TABLE "users", "accounts", "attachments", "tags", "preference_tags", "projects", "project_tags", "project_scheduled", "access_codes", "sessions", "institutions", "institution_members", "institution_membership_requests" CASCADE`,
  )
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

  const attachments = await seedAttachments()

  console.log('\nCriando usuários e contas...')
  const users = []
  const accounts = []

  for (let i = 1; i <= 6; i++) {
    const { user } = await makeUserOnDatabase({
      name: faker.person.fullName(),
      email: faker.internet.email(),
      status: UserStatus.ACTIVE,
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

  console.log('\nCriando projetos com capas/attachments...')
  const projects = []

  for (const [index, data] of PROJECT_SEEDS.entries()) {
    const cover = attachments[index % attachments.length]!
    const extra = attachments[(index + 1) % attachments.length]!
    const projectTags = [tags[index % tags.length]?.id.toString(), tags[(index + 1) % tags.length]?.id.toString()]

    const { project } = await makeProjectOnDatabase({
      title: data.title,
      description: data.description,
      author: users[index % users.length]?.id,
      status: data.status,
      attachments: [cover.id.toString(), extra.id.toString()],
      tags: projectTags,
    })

    projects.push(project)
    console.log(`  ✓ ${project.title} (capa: ${cover.name})`)
  }

  console.log('\nCriando project tags...')
  const projectTags = []

  for (let i = 0; i < 5; i++) {
    const { projectTag } = await makeProjectTagOnDatabase({
      projectId: projects[i]?.id,
      tagId: tags[i]?.id,
    })
    projectTags.push(projectTag)
  }

  const { projectTag: extraProjectTag } = await makeProjectTagOnDatabase({
    projectId: projects[5]?.id,
    tagId: tags[0]?.id,
  })
  projectTags.push(extraProjectTag)
  console.log(`  ✓ ${projectTags.length} project tags`)

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
    const publishedIn = new Date()
    publishedIn.setDate(publishedIn.getDate() + (i + 1) * 3)

    const { projectScheduled } = await makeProjectScheduledOnDatabase({
      projectId: projects[i]?.id,
      publishedIn,
    })
    schedules.push(projectScheduled)
  }
  console.log(`  ✓ ${schedules.length} agendamentos`)

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
  console.log(`Membership requests: ${requests.length}`)
  console.log(`Projects: ${projects.length}`)
  console.log(`Project tags: ${projectTags.length}`)
  console.log(`Preference tags: ${preferenceTags.length}`)
  console.log(`Project scheduled: ${schedules.length}`)
  console.log(`Sessions: ${sessions.length}`)
  console.log(`Access codes: ${accessCodes.length}`)
  console.log('────────────────────────────────────')
  console.log('Login de exemplo:')
  console.log(`  email: seed.user1@vitrine.local`)
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
