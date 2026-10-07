import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Termos de Uso | Vitrine Acadêmica',
  description:
    'Termos de Uso da plataforma Vitrine Acadêmica: regras de acesso, perfis acadêmicos, condutas, propriedade intelectual, sistema de pontos e moderação.',
}

export default function TermosDeUsoPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
      <header className="mb-10 border-b border-border pb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Termos de Uso da Plataforma Vitrine Acadêmica
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Última Atualização: Setembro de 2026 | Versão: 2.0 (PFC / UMC)
        </p>
        <p className="mt-6 leading-relaxed text-foreground">
          Por favor, leia atentamente estes Termos de Uso antes de utilizar a plataforma Vitrine Acadêmica. Ao acessar
          ou utilizar qualquer funcionalidade do sistema, você concorda expressamente em cumprir as condições
          estipuladas abaixo.
        </p>
      </header>

      <div className="space-y-10">
        <section aria-labelledby="secao-1" className="space-y-4">
          <h2 id="secao-1" className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            1. Objeto e Finalidade da Plataforma
          </h2>
          <p className="leading-relaxed text-muted-foreground">
            <span className="font-medium text-foreground">1.1.</span> A Vitrine Acadêmica é um ecossistema digital
            desenvolvido para centralizar, expor, avaliar e fomentar o desenvolvimento colaborativo de projetos
            acadêmicos, integrando estudantes, professores e instituições de ensino.
          </p>
          <p className="leading-relaxed text-muted-foreground">
            <span className="font-medium text-foreground">1.2.</span> O serviço disponibiliza funcionalidades de
            publicação e agendamento de trabalhos, recrutamento de colaboradores por meio de chamados, avaliações
            comunitárias e docentes por critérios, curadoria temática, gestão de pontos e eventos acadêmicos.
          </p>
        </section>

        <section aria-labelledby="secao-2" className="space-y-4">
          <h2 id="secao-2" className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            2. Elegibilidade, Perfis e Vínculo Institucional
          </h2>
          <p className="leading-relaxed text-muted-foreground">
            <span className="font-medium text-foreground">2.1.</span> A utilização da plataforma é permitida a
            estudantes, docentes, gestores e membros da comunidade acadêmica devidamente cadastrados.
          </p>
          <p className="leading-relaxed text-muted-foreground">
            <span className="font-medium text-foreground">2.2.</span> Os níveis de acesso e permissões na plataforma
            adotam o controle por papéis (RBAC) condicionados à validação do vínculo do usuário:
          </p>
          <ul className="list-disc space-y-3 pl-6 marker:text-muted-foreground">
            <li className="leading-relaxed text-muted-foreground">
              <strong className="font-semibold text-foreground">Usuário (Sem vínculo verificado):</strong> Permite
              navegação, leitura de projetos e chamados públicos, marcação de favoritos e personalização básica da home
              por tags.
            </li>
            <li className="leading-relaxed text-muted-foreground">
              <strong className="font-semibold text-foreground">Aluno (Vínculo institucional ativo):</strong> Permite a
              criação e edição de projetos individuais ou em grupo, publicação de chamados, candidatura a oportunidades,
              votação em eventos e atribuição de estrelas comunitárias (peso 1).
            </li>
            <li className="leading-relaxed text-muted-foreground">
              <strong className="font-semibold text-foreground">Professor (Verificação docente aprovada):</strong>{' '}
              Permite publicação de projetos, avaliação técnica por critérios institucionais com notas de 0 a 10,
              atribuição de estrela (peso 5) e composição da banca de curadoria.
            </li>
            <li className="leading-relaxed text-muted-foreground">
              <strong className="font-semibold text-foreground">Secretaria / Gerente Institucional:</strong> Permite a
              validação, aprovação ou rejeição dos pré-registros de vínculo dos alunos e professores vinculados à sua
              respectiva instituição.
            </li>
            <li className="leading-relaxed text-muted-foreground">
              <strong className="font-semibold text-foreground">Administrador:</strong> Acesso a recursos globais,
              moderação de conteúdos e temas, gerenciamento de tags e eventos da plataforma.
            </li>
          </ul>
        </section>

        <section aria-labelledby="secao-3" className="space-y-4">
          <h2 id="secao-3" className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            3. Cadastro, Autenticação e Segurança da Conta
          </h2>
          <p className="leading-relaxed text-muted-foreground">
            <span className="font-medium text-foreground">3.1.</span> O acesso à plataforma é realizado por meio de
            autenticação sem senha (passwordless), mediante o envio de um código de confirmação de uso único e
            temporário enviado ao e-mail cadastrado pelo usuário.
          </p>
          <p className="leading-relaxed text-muted-foreground">
            <span className="font-medium text-foreground">3.2.</span> Os códigos de acesso são armazenados em formato
            hash no banco de dados e possuem tempo de expiração estrito. O usuário é o único responsável pela guarda e
            privacidade do seu e-mail de acesso.
          </p>
          <p className="leading-relaxed text-muted-foreground">
            <span className="font-medium text-foreground">3.3.</span> As declarações de vínculo acadêmico enviadas à
            secretaria estão sujeitas à verificação documental. A prestação de informações falsas implicará a suspensão
            imediata da conta e o cancelamento das permissões concedidas.
          </p>
        </section>

        <section aria-labelledby="secao-4" className="space-y-4">
          <h2 id="secao-4" className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            4. Regras de Conduta e Publicação de Conteúdo
          </h2>
          <p className="leading-relaxed text-muted-foreground">
            <span className="font-medium text-foreground">4.1.</span> Ao publicar projetos, chamados, temas ou
            mensagens, o usuário garante que possui a autoria ou autorização necessária para divulgação e que o conteúdo
            não viola direitos autorais de terceiros.
          </p>
          <p className="leading-relaxed text-muted-foreground">
            <span className="font-medium text-foreground">4.2.</span> É estritamente proibido publicar conteúdos que:
          </p>
          <ul className="list-disc space-y-2 pl-6 marker:text-muted-foreground">
            <li className="leading-relaxed text-muted-foreground">
              Infrinjam leis vigentes, normas acadêmicas ou direitos de propriedade intelectual;
            </li>
            <li className="leading-relaxed text-muted-foreground">
              Contenham linguagem discriminatória, ofensiva, obscena ou incitação à violência;
            </li>
            <li className="leading-relaxed text-muted-foreground">
              Apresentem dados pessoais sensíveis ou desnecessários de terceiros sem respaldo legal;
            </li>
            <li className="leading-relaxed text-muted-foreground">
              Promovam interações artificiais, fraudes em votações, autoimpulso indevido ou manipulação do sistema de
              pontos.
            </li>
          </ul>
          <p className="leading-relaxed text-muted-foreground">
            <span className="font-medium text-foreground">4.3.</span> Conteúdos identificados em desacordo com estas
            regras serão submetidos à moderação humana e poderão ser suspensos, ocultados ou removidos.
          </p>
        </section>

        <section aria-labelledby="secao-5" className="space-y-4">
          <h2 id="secao-5" className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            5. Propriedade Intelectual e Licenciamento
          </h2>
          <p className="leading-relaxed text-muted-foreground">
            <span className="font-medium text-foreground">5.1.</span> A propriedade intelectual dos projetos acadêmicos
            divulgados na plataforma pertence exclusivamente aos seus respectivos autores ou integrantes do grupo de
            desenvolvimento.
          </p>
          <p className="leading-relaxed text-muted-foreground">
            <span className="font-medium text-foreground">5.2.</span> Ao publicar um trabalho na Vitrine Acadêmica, o
            autor concede à plataforma uma licença não exclusiva e gratuita para exibição, indexação e curadoria no
            ambiente do sistema.
          </p>
        </section>

        <section aria-labelledby="secao-6" className="space-y-4">
          <h2 id="secao-6" className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            6. Avaliações, Sistema de Pontos e Impulsionamento
          </h2>
          <p className="leading-relaxed text-muted-foreground">
            <span className="font-medium text-foreground">6.1.</span> As avaliações registradas seguem regramento
            técnico específico: alunos atribuem estrelas comunitárias (peso 1) e professores verificados atribuem nota
            docente de 0 a 10 por critérios institucionais.
          </p>
          <p className="leading-relaxed text-muted-foreground">
            <span className="font-medium text-foreground">6.2.</span> É expressamente proibido ao autor ou coautor
            avaliar o próprio projeto ou criar contas para inflar classificações.
          </p>
          <p className="leading-relaxed text-muted-foreground">
            <span className="font-medium text-foreground">6.3.</span> As avaliações recebidas são convertidas em pontos
            virtuais para o autor ou grupo. Os pontos acumulados podem ser utilizados exclusivamente para promover
            projetos de terceiros. É expressamente proibido o uso de pontos para autoimpulso do próprio projeto.
          </p>
          <p className="leading-relaxed text-muted-foreground">
            <span className="font-medium text-foreground">6.4.</span> Todos os projetos impulsionados serão exibidos com
            uma identificação visível indicando que se trata de um conteúdo promovido e informando o promotor
            responsável.
          </p>
        </section>

        <section aria-labelledby="secao-7" className="space-y-4">
          <h2 id="secao-7" className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            7. Privacidade e Proteção de Dados (LGPD)
          </h2>
          <p className="leading-relaxed text-muted-foreground">
            <span className="font-medium text-foreground">7.1.</span> O tratamento de dados pessoais na plataforma
            ocorre estritamente para o cumprimento das finalidades de identificação, autenticação, atribuição de
            autoria, composição de rankings e emissão de notificações autorizadas.
          </p>
          <p className="leading-relaxed text-muted-foreground">
            <span className="font-medium text-foreground">7.2.</span> O usuário pode exercer a qualquer momento seus
            direitos previstos na LGPD, incluindo a consulta, exportação em arquivo JSON ou exclusão definitiva do seu
            perfil diretamente na página de configurações do usuário.
          </p>
          <p className="leading-relaxed text-muted-foreground">
            <span className="font-medium text-foreground">7.3.</span> Os comprovantes institucionais e docentes enviados
            para verificação são mantidos em armazenamento privado com acesso restrito e serão utilizados unicamente
            para a validação da solicitação.
          </p>
        </section>

        <section aria-labelledby="secao-8" className="space-y-4">
          <h2 id="secao-8" className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            8. Moderação e Encerramento de Contas
          </h2>
          <p className="leading-relaxed text-muted-foreground">
            <span className="font-medium text-foreground">8.1.</span> A Vitrine Acadêmica reserva-se o direito de
            suspender ou encerrar contas, bloquear projetos ou cancelar promoções ativas em caso de descumprimento
            destes Termos de Uso, tentativas de fraude técnica ou por determinação administrativa.
          </p>
          <p className="leading-relaxed text-muted-foreground">
            <span className="font-medium text-foreground">8.2.</span> O usuário pode solicitar o encerramento da sua
            conta a qualquer momento, o que resultará na remoção ou anonimização dos seus dados pessoais identificáveis,
            mantendo-se apenas os registros imutáveis exigidos por obrigações legais e de auditoria.
          </p>
        </section>

        <section aria-labelledby="secao-9" className="space-y-4">
          <h2 id="secao-9" className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            9. Limitação de Responsabilidade e Disponibilidade
          </h2>
          <p className="leading-relaxed text-muted-foreground">
            <span className="font-medium text-foreground">9.1.</span> A plataforma empenha seus melhores esforços
            técnicos para manter a disponibilidade contínua do serviço, contudo não garante o funcionamento ininterrupto
            diante de manutenções programadas ou falhas na infraestrutura em nuvem de terceiros.
          </p>
          <p className="leading-relaxed text-muted-foreground">
            <span className="font-medium text-foreground">9.2.</span> A Vitrine Acadêmica não se responsabiliza pelo
            conteúdo direto das propostas, mensagens de candidaturas ou opiniões emitidas nos comentários e avaliações
            pelos usuários.
          </p>
        </section>

        <section aria-labelledby="secao-10" className="space-y-4">
          <h2 id="secao-10" className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            10. Legislação Aplicável e Foro
          </h2>
          <p className="leading-relaxed text-muted-foreground">
            <span className="font-medium text-foreground">10.1.</span> Estes Termos de Uso são regidos e interpretados
            segundo as leis da República Federativa do Brasil, em especial a Lei Geral de Proteção de Dados (Lei nº
            13.709/2018) e o Marco Civil da Internet (Lei nº 12.965/2014).
          </p>
          <p className="leading-relaxed text-muted-foreground">
            <span className="font-medium text-foreground">10.2.</span> Fica eleito o Foro da Comarca de Mogi das Cruzes,
            Estado de São Paulo, para dirimir quaisquer controvérsias decorrentes da utilização da plataforma.
          </p>
        </section>
      </div>
    </main>
  )
}
