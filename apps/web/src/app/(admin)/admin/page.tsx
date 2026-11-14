import Link from 'next/link'
import { BigNumber } from '@/components/admin/big-number'
import { CategoryBarChart } from '@/components/admin/category-bar-chart'
import { DailyAreaChart } from '@/components/admin/daily-area-chart'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'
import {
  getInstitutionsAnalytics,
  getProjectsAnalytics,
  getTagsAnalytics,
  getUsersAnalytics,
} from '@/server/http/routes/analytics/get-analytics'
import {
  institutionStatusLabels,
  memberRoleLabels,
  projectStatusLabels,
  toChartItems,
  userStatusLabels,
} from '@/utils/analytics-labels'

const PERIODS = [7, 30, 90]
const DEFAULT_DAYS = 30
const TAGS_LIMIT = 10

type PageProps = {
  searchParams: Promise<{ dias?: string }>
}

function parseDays(value?: string) {
  const days = Number(value)

  return PERIODS.includes(days) ? days : DEFAULT_DAYS
}

export default async function AdminPage({ searchParams }: PageProps) {
  const { dias } = await searchParams
  const days = parseDays(dias)

  const [projects, users, institutions, tags] = await Promise.all([
    getProjectsAnalytics(days),
    getUsersAnalytics(days),
    getInstitutionsAnalytics(),
    getTagsAnalytics(TAGS_LIMIT),
  ])

  const published = projects.byStatus.find((item) => item.label === 'PUBLISHED')?.total ?? 0

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex h-16 shrink-0 items-center gap-2 border-b border-border px-4">
        <SidebarTrigger />
        <Separator orientation="vertical" className="h-4" />
        <h1 className="font-heading text-lg font-semibold">Painel administrativo</h1>
      </header>

      <div className="flex flex-1 flex-col gap-8 p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">Período dos gráficos diários</p>
          <div className="flex gap-2">
            {PERIODS.map((period) => (
              <Button
                key={period}
                variant={period === days ? 'default' : 'outline'}
                nativeButton={false}
                render={<Link href={`/admin?dias=${period}`} />}
              >
                {period} dias
              </Button>
            ))}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <BigNumber label="Projetos" value={projects.total} />
          <BigNumber label="Projetos publicados" value={published} />
          <BigNumber label="Usuários" value={users.total} />
          <BigNumber label="Instituições" value={institutions.total} />
        </div>

        <section id="projetos" className="scroll-mt-4 space-y-4">
          <h2 className="font-heading text-xl font-semibold">Projetos</h2>
          <div className="grid gap-4 lg:grid-cols-2">
            <DailyAreaChart
              title="Projetos criados por dia"
              description={`${projects.createdInPeriod} nos últimos ${days} dias`}
              series="Projetos"
              data={projects.createdByDay}
            />
            <CategoryBarChart
              title="Projetos por status"
              description={`${projects.total} no total`}
              series="Projetos"
              data={toChartItems(projectStatusLabels, projects.byStatus)}
            />
          </div>
        </section>

        <section id="usuarios" className="scroll-mt-4 space-y-4">
          <h2 className="font-heading text-xl font-semibold">Usuários</h2>
          <div className="grid gap-4 lg:grid-cols-2">
            <DailyAreaChart
              title="Novos usuários por dia"
              description={`${users.createdInPeriod} nos últimos ${days} dias`}
              series="Usuários"
              data={users.createdByDay}
            />
            <CategoryBarChart
              title="Usuários por status"
              description={`${users.total} no total`}
              series="Usuários"
              data={toChartItems(userStatusLabels, users.byStatus)}
            />
          </div>
        </section>

        <section id="instituicoes" className="scroll-mt-4 space-y-4">
          <h2 className="font-heading text-xl font-semibold">Instituições</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <BigNumber label="Solicitações de vínculo pendentes" value={institutions.pendingMembershipRequests} />
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <CategoryBarChart
              title="Instituições por status"
              description={`${institutions.total} no total`}
              series="Instituições"
              data={toChartItems(institutionStatusLabels, institutions.byStatus)}
            />
            <CategoryBarChart
              title="Membros ativos por papel"
              description="Vínculos com status ativo"
              series="Membros"
              data={toChartItems(memberRoleLabels, institutions.membersByRole)}
            />
          </div>
        </section>

        <section id="tags" className="scroll-mt-4 space-y-4">
          <h2 className="font-heading text-xl font-semibold">Tags</h2>
          {tags.tags.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma tag foi usada em projetos ainda.</p>
          ) : (
            <CategoryBarChart
              title="Tags mais usadas"
              description={`As ${TAGS_LIMIT} tags mais frequentes nos projetos`}
              series="Projetos"
              data={tags.tags.map((tag) => ({ name: tag.name, total: tag.total }))}
            />
          )}
        </section>
      </div>
    </div>
  )
}
