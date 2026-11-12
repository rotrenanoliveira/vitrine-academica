import { ArrowUpRight01Icon, UniversityIcon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import Link from 'next/link'
import { EventCard } from '@/components/event/event-card'
import { FormRequestInstitutionMembership } from '@/components/institution/form-request-institution-membership'
import { ProjectGalleryCard } from '@/components/project/project-gallery-card'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import type { Event, Institution, ProjectListItem } from '@/utils/type'

const typeLabels: Record<Institution['type'], string> = {
  UNIVERSITY: 'Universidade',
  COLLEGE: 'Faculdade',
  CENTER: 'Centro',
  TECHNICAL_COLLEGE: 'Escola técnica',
  OTHER: 'Outro',
}

const originLabels: Record<Institution['origin'], string> = {
  SEED: 'Seed',
  USER_REGISTRATION: 'Cadastro de usuário',
  ADMIN: 'Admin',
}

type InstitutionDetailProps = {
  institution: Institution
  projects: ProjectListItem[]
  events: Event[]
  isAuthenticated: boolean
  alreadyMember: boolean
  canManage: boolean
}

export function InstitutionDetail({
  institution,
  projects,
  events,
  isAuthenticated,
  alreadyMember,
  canManage,
}: InstitutionDetailProps) {
  return (
    <div className="space-y-6">
      <Card className="w-full rounded-none bg-[#ebe6de] shadow-none">
        <CardHeader>
          <CardTitle className="text-3xl normal-case tracking-normal flex items-center">
            <HugeiconsIcon icon={UniversityIcon} className="size-6 shrink-0 text-muted-foreground" />
            <span className="ml-2">{institution.name}</span>
          </CardTitle>
          <CardDescription className="whitespace-pre-wrap">{institution.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <div>
              <dt className="text-muted-foreground">Tipo</dt>
              <dd>{typeLabels[institution.type]}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Domínio</dt>
              <dd>{institution.domain ?? '—'}</dd>
            </div>

            {canManage && (
              <>
                <div>
                  <dt className="text-muted-foreground">Registrada em</dt>
                  <dd>{new Date(institution.createdAt).toLocaleString('pt-BR')}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Origem de cadastro</dt>
                  <dd>{originLabels[institution.origin]}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Verificação</dt>
                  <dd>{institution.shouldVerify ? 'Exigida' : 'Não exigida'}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Comprovante</dt>
                  <dd>{institution.shouldProof ? 'Exigido' : 'Não exigido'}</dd>
                </div>
              </>
            )}
          </dl>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-2">
          {canManage && (
            <>
              <Button variant="outline" nativeButton={false} render={<Link href="/eventos/novo" />}>
                Novo evento
              </Button>

              <Button
                variant="outline"
                nativeButton={false}
                render={<Link href={`/instituicoes/${institution.slug}/membros`} />}
              >
                Membros
              </Button>
              <Button
                variant="outline"
                nativeButton={false}
                render={<Link href={`/instituicoes/${institution.slug}/solicitacoes`} />}
              >
                Solicitações
              </Button>
              <Button
                variant="outline"
                nativeButton={false}
                render={<Link href={`/instituicoes/${institution.slug}/editar`} />}
              >
                Editar
              </Button>
            </>
          )}
        </div>
      </div>

      <Separator />

      <section className="space-y-3">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-lg font-medium">Projetos</h2>
            <p className="text-muted-foreground text-sm">
              Projetos publicados por membros ativos desta instituição.
            </p>
          </div>
          {projects.length > 0 ? (
            <Button
              nativeButton={false}
              size="icon"
              className="group size-14 shrink-0 rounded-none bg-[#252422] text-[#f4f1eb] shadow-none transition-[background-color,box-shadow] duration-200 hover:bg-[#252422]/85 hover:shadow-[6px_6px_0_rgba(37,36,34,0.18)] sm:w-16"
              render={<Link href={`/instituicoes/${institution.slug}/projetos`} />}
              aria-label="Ver todos os projetos da instituição"
            >
              <span className="sr-only">Ver todos os projetos</span>
              <HugeiconsIcon
                icon={ArrowUpRight01Icon}
                className="size-5 transition-transform duration-200 group-hover:scale-125"
              />
            </Button>
          ) : null}
        </div>
        {projects.length === 0 ? (
          <p className="text-muted-foreground text-sm">Nenhum projeto publicado ainda.</p>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <ProjectGalleryCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-medium">Eventos</h2>
          <p className="text-muted-foreground text-sm">Ciclos temáticos criados por esta instituição.</p>
        </div>
        {events.length === 0 ? (
          <p className="text-muted-foreground text-sm">Nenhum evento criado ainda.</p>
        ) : (
          <div>
            {events.map((event) => (
              <EventCard key={event.id} event={event} canManage={canManage} />
            ))}
          </div>
        )}
      </section>

      {isAuthenticated && !alreadyMember && (
        <FormRequestInstitutionMembership
          institutionId={institution.id}
          institutionSlug={institution.slug}
          shouldProof={institution.shouldProof}
          alreadyMember={alreadyMember}
        />
      )}
    </div>
  )
}
