import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Política de Privacidade | Vitrine Acadêmica',
  description:
    'Política de Privacidade da plataforma Vitrine Acadêmica em conformidade com a LGPD: inventário de dados, hipóteses legais, operadores em nuvem e direitos dos titulares.',
}

export default function PoliticaDePrivacidadePage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
      <header className="mb-10 border-b border-border pb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Política de Privacidade (LGPD)
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Última Atualização: Setembro de 2026 | Versão: 1.0 (PFC / UMC)
        </p>
        <p className="mt-6 leading-relaxed text-foreground">
          Esta Política de Privacidade descreve como a plataforma Vitrine Acadêmica coleta, utiliza, armazena,
          compartilha e protege os dados pessoais dos seus usuários, em total conformidade com a Lei Geral de Proteção
          de Dados Pessoais (Lei nº 13.709/2018 - LGPD) e as diretrizes do Projeto Final de Curso (PFC/UMC).
        </p>
      </header>

      <div className="space-y-10">
        <section aria-labelledby="secao-1" className="space-y-4">
          <h2 id="secao-1" className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            1. Controladores e Responsáveis pelo Tratamento
          </h2>
          <p className="leading-relaxed text-muted-foreground">
            <span className="font-medium text-foreground">1.1.</span> No âmbito acadêmico deste Projeto Final de Curso
            da Universidade de Mogi das Cruzes (UMC), os desenvolvedores discentes e a instituição atuam como
            controladores simulados das operações de tratamento de dados pessoais.
          </p>
          <p className="leading-relaxed text-muted-foreground">
            <span className="font-medium text-foreground">1.2.</span> Para questões relativas à proteção de dados e ao
            exercício dos seus direitos de titular, entre em contato através dos canais de atendimento disponíveis no
            painel da aplicação.
          </p>
        </section>

        <section aria-labelledby="secao-2" className="space-y-4">
          <h2 id="secao-2" className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            2. Inventário de Dados Pessoais Coletados
          </h2>
          <p className="leading-relaxed text-muted-foreground">
            Em obediência ao princípio da minimização da LGPD, a plataforma coleta apenas as informações estritamente
            necessárias para a prestação dos serviços acadêmicos:
          </p>
          <ul className="list-disc space-y-3 pl-6 marker:text-muted-foreground">
            <li className="leading-relaxed text-muted-foreground">
              <strong className="font-semibold text-foreground">Dados de Identificação e Acesso:</strong> Nome completo,
              endereço de e-mail, handle (username), foto de perfil e registros de consentimento da LGPD.
            </li>
            <li className="leading-relaxed text-muted-foreground">
              <strong className="font-semibold text-foreground">Dados de Vínculo Institucional:</strong> Instituição de
              ensino vinculada, papel acadêmico (Aluno, Professor, Secretaria, Gerente), RGM/matrícula e comprovantes
              documentais em PDF/imagem enviados para validação.
            </li>
            <li className="leading-relaxed text-muted-foreground">
              <strong className="font-semibold text-foreground">Dados de Conteúdo e Interação:</strong> Projetos
              criados, chamados publicados, candidaturas enviadas, avaliações atribuídas (estrelas e notas docentes),
              histórico do extrato de pontos, preferências de tags e inscrições em autores.
            </li>
            <li className="leading-relaxed text-muted-foreground">
              <strong className="font-semibold text-foreground">Dados Técnicos e de Auditoria:</strong> Endereço IP de
              origem, user-agent do navegador, registros de sessão (sid), hashes dos códigos de acesso e logs imutáveis
              de auditoria.
            </li>
          </ul>
        </section>

        <section aria-labelledby="secao-3" className="space-y-4">
          <h2 id="secao-3" className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            3. Matriz de Finalidades, Hipóteses Legais e Retenção
          </h2>
          <p className="leading-relaxed text-muted-foreground">
            Cada atividade de tratamento realizada na Vitrine Acadêmica possui respaldo em uma hipótese legal prevista
            no Art. 7º da LGPD:
          </p>
          <div className="overflow-x-auto pt-2">
            <table className="w-full text-left text-sm text-muted-foreground">
              <thead className="border-b border-border text-xs uppercase text-foreground">
                <tr>
                  <th scope="col" className="py-3 pr-4 font-semibold">
                    Categoria de Dado
                  </th>
                  <th scope="col" className="py-3 pr-4 font-semibold">
                    Finalidade Concreta
                  </th>
                  <th scope="col" className="py-3 pr-4 font-semibold">
                    Hipótese Legal (LGPD)
                  </th>
                  <th scope="col" className="py-3 font-semibold">
                    Retenção
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <tr>
                  <td className="py-3 pr-4 font-medium text-foreground">E-mail e Username</td>
                  <td className="py-3 pr-4">Autenticação passwordless e emissão de sessões JWT.</td>
                  <td className="py-3 pr-4">Execução de Contrato (Art. 7º, V)</td>
                  <td className="py-3">Até a exclusão da conta.</td>
                </tr>
                <tr>
                  <td className="py-3 pr-4 font-medium text-foreground">Comprovantes Institucionais</td>
                  <td className="py-3 pr-4">Homologação do papel de aluno/professor pela secretaria.</td>
                  <td className="py-3 pr-4">Execução de Contrato e Legítimo Interesse (Art. 7º, V e IX)</td>
                  <td className="py-3">Privado no R2; descarte pós-análise.</td>
                </tr>
                <tr>
                  <td className="py-3 pr-4 font-medium text-foreground">Projetos e Chamados</td>
                  <td className="py-3 pr-4">Exposição do trabalho e recrutamento de colaboradores.</td>
                  <td className="py-3 pr-4">Execução de Contrato (Art. 7º, V)</td>
                  <td className="py-3">Enquanto mantido publicado pelo autor.</td>
                </tr>
                <tr>
                  <td className="py-3 pr-4 font-medium text-foreground">Inscrições e Tags</td>
                  <td className="py-3 pr-4">Personalização do feed e envio de e-mails de acompanhamento.</td>
                  <td className="py-3 pr-4">Consentimento e Contrato (Art. 7º, I e V)</td>
                  <td className="py-3">Até o cancelamento pelo usuário (opt-out).</td>
                </tr>
                <tr>
                  <td className="py-3 pr-4 font-medium text-foreground">Logs de Auditoria</td>
                  <td className="py-3 pr-4">Rastreabilidade de ações críticas e segurança do sistema.</td>
                  <td className="py-3 pr-4">Obrigação Legal e Legítimo Interesse (Art. 7º, II e IX)</td>
                  <td className="py-3">Prazo legal imutável do Marco Civil.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section aria-labelledby="secao-4" className="space-y-4">
          <h2 id="secao-4" className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            4. Compartilhamento e Fornecedores Externos (Operadores)
          </h2>
          <p className="leading-relaxed text-muted-foreground">
            Para o correto funcionamento da infraestrutura em nuvem, a plataforma compartilha dados estritamente
            operacionais com os seguintes prestadores de serviços:
          </p>
          <ul className="list-disc space-y-2 pl-6 marker:text-muted-foreground">
            <li className="leading-relaxed text-muted-foreground">
              <strong className="font-semibold text-foreground">Vercel Inc.:</strong> Hospedagem da aplicação front-end
              em Next.js.
            </li>
            <li className="leading-relaxed text-muted-foreground">
              <strong className="font-semibold text-foreground">Render Services Inc.:</strong> Hospedagem da API
              back-end em Node.js/Fastify.
            </li>
            <li className="leading-relaxed text-muted-foreground">
              <strong className="font-semibold text-foreground">Neon Inc.:</strong> Banco de dados relacional PostgreSQL
              serverless.
            </li>
            <li className="leading-relaxed text-muted-foreground">
              <strong className="font-semibold text-foreground">Upstash Inc.:</strong> Banco de dados em memória Redis
              para controle de cache.
            </li>
            <li className="leading-relaxed text-muted-foreground">
              <strong className="font-semibold text-foreground">Cloudflare Inc. (Cloudflare R2):</strong> Armazenamento
              de arquivos, imagens e comprovantes com acesso restrito.
            </li>
            <li className="leading-relaxed text-muted-foreground">
              <strong className="font-semibold text-foreground">Resend Inc.:</strong> Serviço de disparo de e-mails para
              envio de códigos de acesso e notificações.
            </li>
            <li className="leading-relaxed text-muted-foreground">
              <strong className="font-semibold text-foreground">OpenAlex API:</strong> Consulta externa de catalogação
              de trabalhos acadêmicos públicos (sem transmissão de dados pessoais).
            </li>
          </ul>
        </section>

        <section aria-labelledby="secao-5" className="space-y-4">
          <h2 id="secao-5" className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            5. Medidas Técnicas de Segurança da Informação
          </h2>
          <p className="leading-relaxed text-muted-foreground">
            A proteção de dados é integrada à arquitetura da aplicação desde a concepção (Privacy by Design):
          </p>
          <ul className="list-disc space-y-2 pl-6 marker:text-muted-foreground">
            <li className="leading-relaxed text-muted-foreground">
              <strong className="font-semibold text-foreground">Autenticação Passwordless:</strong> Não há armazenamento
              de senhas. Os códigos de acesso têm uso único e são armazenados com criptografia hash.
            </li>
            <li className="leading-relaxed text-muted-foreground">
              <strong className="font-semibold text-foreground">Autorização Estrita no Back-End:</strong> As permissões
              são validadas na API por JWT e regras de propriedade/RBAC em cada requisição.
            </li>
            <li className="leading-relaxed text-muted-foreground">
              <strong className="font-semibold text-foreground">Criptografia e Isolamento:</strong> Tráfego 100%
              protegido por HTTPS, uso de Drizzle ORM contra SQL Injection e buckets privados para comprovantes de
              verificação.
            </li>
            <li className="leading-relaxed text-muted-foreground">
              <strong className="font-semibold text-foreground">Logs de Auditoria:</strong> Mutações administrativas e
              transações de pontos geram registros imutáveis protegidos contra adulteração.
            </li>
          </ul>
        </section>

        <section aria-labelledby="secao-6" className="space-y-4">
          <h2 id="secao-6" className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            6. Direitos dos Titulares e Procedimentos
          </h2>
          <p className="leading-relaxed text-muted-foreground">
            Em conformidade com o Art. 18 da LGPD, os usuários podem exercer seus direitos de forma automatizada na
            página <strong className="font-medium text-foreground">"Minha Conta"</strong>:
          </p>
          <ul className="list-disc space-y-2 pl-6 marker:text-muted-foreground">
            <li className="leading-relaxed text-muted-foreground">
              <strong className="font-semibold text-foreground">Acesso e Confirmação:</strong> Acesso imediato aos dados
              de perfil, preferências e histórico de atividades.
            </li>
            <li className="leading-relaxed text-muted-foreground">
              <strong className="font-semibold text-foreground">Portabilidade dos Dados:</strong> Funcionalidade de
              download para exportação de todos os dados em formato JSON estruturado.
            </li>
            <li className="leading-relaxed text-muted-foreground">
              <strong className="font-semibold text-foreground">Eliminação de Dados:</strong> Botão de exclusão de conta
              que executa a remoção permanente dos dados pessoais e a anonimização de registros públicos.
            </li>
            <li className="leading-relaxed text-muted-foreground">
              <strong className="font-semibold text-foreground">Revogação de Consentimento:</strong> Desconexão imediata
              de acompanhamento de autores no perfil ou pelo link de opt-out no rodapé dos e-mails.
            </li>
          </ul>
        </section>

        <section aria-labelledby="secao-7" className="space-y-4">
          <h2 id="secao-7" className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            7. Tratamento de Dados Especiais e Inteligência Artificial
          </h2>
          <p className="leading-relaxed text-muted-foreground">
            <span className="font-medium text-foreground">7.1.</span> A plataforma não trata dados pessoais sensíveis de
            saúde, biometria, informações financeiras reais ou dados de crianças.
          </p>
          <p className="leading-relaxed text-muted-foreground">
            <span className="font-medium text-foreground">7.2.</span> O uso previsto de modelos de Inteligência
            Artificial para sugestão de nomes de eventos e verificação de similaridade atuará exclusivamente como
            ferramenta de apoio técnico, sendo{' '}
            <strong className="font-medium text-foreground">obrigatória a revisão humana</strong> antes de qualquer
            decisão com efeito para os usuários.
          </p>
        </section>

        <section aria-labelledby="secao-8" className="space-y-4">
          <h2 id="secao-8" className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            8. Plano de Resposta a Incidentes de Segurança
          </h2>
          <p className="leading-relaxed text-muted-foreground">
            Na eventualidade de um incidente de segurança envolvendo dados pessoais, a equipe executará um protocolo
            estruturado em 4 etapas:
          </p>
          <ol className="list-decimal space-y-2 pl-6 marker:text-muted-foreground">
            <li className="leading-relaxed text-muted-foreground">
              <strong className="font-semibold text-foreground">Detecção e Contenção:</strong> Identificação e
              isolamento da vulnerabilidade técnica com preservação dos registros de log.
            </li>
            <li className="leading-relaxed text-muted-foreground">
              <strong className="font-semibold text-foreground">Avaliação de Impacto:</strong> Análise do volume e da
              sensibilidade das informações afetadas.
            </li>
            <li className="leading-relaxed text-muted-foreground">
              <strong className="font-semibold text-foreground">Notificação:</strong> Comunicação formal aos titulares
              afetados e autoridades competentes caso seja constatado risco relevante.
            </li>
            <li className="leading-relaxed text-muted-foreground">
              <strong className="font-semibold text-foreground">Remediação:</strong> Aplicação de correções definitivas
              e auditoria pós-incidente.
            </li>
          </ol>
        </section>

        <section aria-labelledby="secao-9" className="space-y-4">
          <h2 id="secao-9" className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            9. Alterações desta Política
          </h2>
          <p className="leading-relaxed text-muted-foreground">
            Esta Política de Privacidade poderá ser atualizada periodicamente para refletir evoluções técnicas ou
            regulatórias. Notificações sobre alterações relevantes serão exibidas na plataforma ou enviadas aos e-mails
            cadastrados.
          </p>
        </section>
      </div>
    </main>
  )
}
