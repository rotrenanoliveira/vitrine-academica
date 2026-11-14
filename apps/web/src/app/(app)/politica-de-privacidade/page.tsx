import type { Metadata } from 'next'
import type { ReactNode } from 'react'

export const metadata: Metadata = {
  title: 'Política de Privacidade | Vitrine Acadêmica',
  description:
    'Saiba quais dados pessoais a Vitrine Acadêmica trata, para quais finalidades, com quem são compartilhados e como exercer seus direitos previstos na LGPD.',
}

const Section = ({ id, title, children }: { id: string; title: string; children: ReactNode }) => (
  <section aria-labelledby={id} className="space-y-4">
    <h2 id={id} className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
      {title}
    </h2>
    <div className="space-y-3 leading-relaxed text-muted-foreground">{children}</div>
  </section>
)

export default function PoliticaDePrivacidadePage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
      <header className="mb-10 border-b border-border pb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Política de Privacidade</h1>
        <p className="mt-3 text-sm text-muted-foreground">Última atualização: 13 de novembro de 2026 · Versão 2.0</p>
        <p className="mt-6 leading-relaxed text-foreground">
          Esta Política explica como a Vitrine Acadêmica trata dados pessoais no site e em seus recursos autenticados.
          Foi elaborada com base nas funcionalidades e na estrutura técnica identificadas no projeto disponibilizado e
          considera a Lei nº 13.709/2018 (Lei Geral de Proteção de Dados Pessoais — LGPD). Leia também os
          <a className="font-medium underline underline-offset-4" href="/termos-de-uso">
            {' '}
            Termos de Uso
          </a>
          .
        </p>
      </header>

      <div className="space-y-10">
        <Section id="secao-1" title="1. A quem esta Política se aplica">
          <p>
            Aplica-se a visitantes, titulares de contas, estudantes, professores, representantes de instituições,
            candidatos a chamadas, participantes de eventos, autores acompanhados e demais pessoas cujos dados sejam
            tratados em razão do uso da Vitrine Acadêmica ou de contato com sua equipe.
          </p>
          <p>
            A plataforma é voltada ao contexto acadêmico e não deve ser utilizada para cadastrar crianças ou inserir
            dados de crianças. Se houver tratamento de dados de crianças ou adolescentes em alguma atividade, o
            controlador deverá avaliar previamente as regras específicas da LGPD e do melhor interesse, implementar
            salvaguardas e atualizar esta Política.
          </p>
        </Section>

        <Section id="secao-2" title="2. Quais dados pessoais podem ser tratados">
          <p>
            As categorias abaixo refletem campos e funcionalidades encontrados na aplicação. Nem todos os dados são
            exigidos de todos os usuários; a coleta depende do recurso utilizado.
          </p>
          <ul className="list-disc space-y-3 pl-6">
            <li>
              <strong className="text-foreground">Identificação e conta:</strong> nome, endereço de e-mail,
              identificador interno da conta, papel/status da conta, data de criação e atualização, confirmação do
              e-mail, identificador da imagem de perfil e registro de aceite/consentimento quando aplicável.
            </li>
            <li>
              <strong className="text-foreground">Vínculo institucional:</strong> instituição, papel solicitado ou
              atribuído (por exemplo, estudante, professor ou função administrativa), status do vínculo, solicitações de
              associação e documento comprobatório anexado quando exigido para validação.
            </li>
            <li>
              <strong className="text-foreground">Projetos e colaboração:</strong> autoria, integrantes e convites,
              títulos, descrições, arquivos anexados, tags, situação e datas de publicação/agendamento, além de conteúdo
              que o próprio usuário inserir.
            </li>
            <li>
              <strong className="text-foreground">Chamadas e candidaturas:</strong> chamadas publicadas, prazo,
              candidatura, mensagem opcional, situação da candidatura e decisão do responsável pela chamada.
            </li>
            <li>
              <strong className="text-foreground">Avaliações, eventos e pontos:</strong> estrelas e avaliações docentes
              por critérios, votos e inscrições em eventos, temas sugeridos, saldo e histórico de transações de pontos,
              promoções e referências às operações correspondentes.
            </li>
            <li>
              <strong className="text-foreground">Preferências e acompanhamento:</strong> tags de interesse, autores
              acompanhados, endereço de e-mail utilizado para notificações, estado da inscrição e registros de
              descadastramento.
            </li>
            <li>
              <strong className="text-foreground">Arquivos e anexos:</strong> nome original, tipo MIME, tamanho,
              identificador e chave de armazenamento do arquivo, além do próprio conteúdo do arquivo enviado.
            </li>
            <li>
              <strong className="text-foreground">Autenticação e auditoria:</strong> códigos temporários de acesso
              (armazenados de forma protegida, conforme a implementação), identificadores de sessão,
              expiração/revogação, registros de login/logout, ações de criação, alteração, exclusão e exportação,
              recurso afetado, responsável pela ação, horário, status e metadados de auditoria.
            </li>
            <li>
              <strong className="text-foreground">Dados técnicos e logs de erro:</strong> o tratamento de erros da API
              registra, em determinadas falhas não classificadas, data/hora, mensagem e stack do erro, método e URL da
              requisição, cabeçalhos, endereço IP, corpo, parâmetros e consulta da requisição. Esses registros podem
              conter dados pessoais ou informações incluídas pelo usuário; o controlador deve limitar o acesso, definir
              retenção e aplicar mascaramento de credenciais e dados desnecessários. Também podem existir registros
              técnicos do navegador, sessão e infraestrutura, conforme a configuração de produção.
            </li>
          </ul>
          <p>
            Não solicitamos, como categoria necessária do serviço, dados pessoais sensíveis definidos no art. 5º, II, da
            LGPD. Não inclua informações sobre saúde, biometria, origem racial ou étnica, convicção religiosa, opinião
            política, filiação sindical, vida sexual ou dados genéticos, salvo se houver necessidade excepcional, base
            legal adequada e informação específica ao titular.
          </p>
        </Section>

        <Section id="secao-3" title="3. Para que usamos os dados e quais bases legais">
          <p>
            Cada atividade de tratamento deve estar amparada por uma hipótese legal prevista na LGPD. As bases indicadas
            abaixo são referências gerais para as finalidades descritas e sua aplicação depende das circunstâncias de
            cada operação. O consentimento não é a base legal para todo tratamento.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-border text-foreground">
                  <th className="py-3 pr-4">Atividade</th>
                  <th className="py-3 pr-4">Finalidade</th>
                  <th className="py-3">Base legal possível</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <tr>
                  <td className="py-3 pr-4">Cadastro e autenticação</td>
                  <td className="py-3 pr-4">
                    Criar e administrar conta, confirmar e-mail, autenticar e manter sessões.
                  </td>
                  <td className="py-3">
                    Execução de contrato ou procedimentos preliminares (art. 7º, V); legítimo interesse, quando cabível
                    (art. 7º, IX).
                  </td>
                </tr>
                <tr>
                  <td className="py-3 pr-4">Vínculo institucional</td>
                  <td className="py-3 pr-4">Analisar solicitações e atribuir permissões institucionais.</td>
                  <td className="py-3 pr-4">
                    Execução de contrato/procedimentos preliminares (art. 7º, V) ou legítimo interesse (art. 7º, IX),
                    após avaliação de necessidade e balanceamento.
                  </td>
                </tr>
                <tr>
                  <td className="py-3 pr-4">Projetos e chamadas</td>
                  <td className="py-3 pr-4">
                    Publicar conteúdo, permitir colaboração, receber candidaturas e administrar oportunidades.
                  </td>
                  <td className="py-3 pr-4">
                    Execução de contrato (art. 7º, V); legítimo interesse (art. 7º, IX) para recursos compatíveis e
                    devidamente avaliados.
                  </td>
                </tr>
                <tr>
                  <td className="py-3 pr-4">Avaliações, pontos e eventos</td>
                  <td className="py-3 pr-4">
                    Registrar avaliações, votos, inscrições, resultados, saldo e prevenção de manipulação.
                  </td>
                  <td className="py-3 pr-4">
                    Execução de contrato (art. 7º, V); legítimo interesse (art. 7º, IX); exercício regular de direitos
                    (art. 7º, VI), quando aplicável.
                  </td>
                </tr>
                <tr>
                  <td className="py-3 pr-4">Acompanhamento de autores</td>
                  <td className="py-3 pr-4">Enviar avisos de novos projetos e administrar cancelamentos.</td>
                  <td className="py-3 pr-4">
                    Consentimento (art. 7º, I) ou execução de contrato (art. 7º, V), conforme o fluxo de adesão
                    efetivamente implementado.
                  </td>
                </tr>
                <tr>
                  <td className="py-3 pr-4">Segurança e auditoria</td>
                  <td className="py-3 pr-4">
                    Proteger contas, investigar fraude, rastrear ações críticas e manter evidências.
                  </td>
                  <td className="py-3 pr-4">
                    Legítimo interesse (art. 7º, IX), cumprimento de obrigação legal/regulatória (art. 7º, II) e
                    exercício regular de direitos (art. 7º, VI), conforme o registro.
                  </td>
                </tr>
                <tr>
                  <td className="py-3 pr-4">Atendimento a solicitações</td>
                  <td className="py-3 pr-4">
                    Responder pedidos de titulares, reclamações e requisições de autoridades.
                  </td>
                  <td className="py-3">
                    Cumprimento de obrigação legal/regulatória (art. 7º, II) e exercício regular de direitos (art. 7º,
                    VI).
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p>
            Quando o tratamento depender de consentimento, ele será solicitado de forma livre, informada, inequívoca e
            vinculada a finalidades determinadas. O titular poderá revogá-lo, sem afetar a licitude do tratamento
            realizado anteriormente, observadas as consequências da retirada para o recurso solicitado.
          </p>
        </Section>

        <Section id="secao-4" title="4. Conteúdo público e informações compartilhadas com outros usuários">
          <p>
            Projetos publicados, nome de exibição, autoria, instituição, tags, arquivos e demais informações
            configuradas como públicas podem ser visualizados por visitantes e usuários. A publicação é uma escolha do
            usuário, mas a plataforma também poderá exibir informações necessárias à atribuição de autoria, integridade
            de avaliações ou funcionamento de recursos públicos.
          </p>
          <p>
            Candidaturas, mensagens, documentos comprobatórios, dados de conta, sessões e informações de auditoria não
            se tornam públicos apenas por serem enviados à plataforma. O acesso a esses dados é limitado às pessoas que
            precisam deles para a finalidade correspondente, como o responsável pela chamada ou a equipe autorizada a
            validar um vínculo.
          </p>
          <p>
            Não publique dados pessoais de terceiros em áreas públicas sem fundamento jurídico. A remoção posterior do
            conteúdo pode não eliminar cópias feitas por terceiros, resultados de mecanismos de busca, caches ou
            registros que estejam legitimamente sujeitos à retenção.
          </p>
        </Section>

        <Section id="secao-5" title="5. Compartilhamento e operadores">
          <p>Dados podem ser compartilhados apenas na medida necessária com:</p>
          <ul className="list-disc space-y-2 pl-6">
            <li>
              <strong className="text-foreground">Provedores de infraestrutura e banco de dados:</strong> para
              hospedagem da aplicação, processamento e armazenamento dos registros;
            </li>
            <li>
              <strong className="text-foreground">Cloudflare R2:</strong> armazenamento de arquivos e anexos, conforme a
              configuração técnica identificada no projeto;
            </li>
            <li>
              <strong className="text-foreground">Resend:</strong> envio de códigos de acesso e mensagens por e-mail,
              conforme a configuração técnica identificada no projeto;
            </li>
            <li>
              <strong className="text-foreground">OpenAlex:</strong> consulta de catálogo de trabalhos científicos. A
              funcionalidade identificada envia um termo de busca; não foi identificada necessidade de transmitir o
              perfil do usuário para realizar essa consulta;
            </li>
            <li>
              <strong className="text-foreground">Instituições e responsáveis autorizados:</strong> para validar vínculo
              institucional, administrar membros, analisar candidaturas, inscrições ou atividades institucionais;
            </li>
            <li>
              <strong className="text-foreground">Autoridades públicas, órgãos reguladores ou terceiros:</strong> quando
              houver obrigação legal, ordem válida, exercício regular de direitos ou proteção de direitos e segurança.
            </li>
          </ul>
          <p>
            Os fornecedores que atuam como operadores devem tratar os dados conforme instruções documentadas do
            controlador e obrigações contratuais de segurança e confidencialidade. A lista de provedores, suboperadores,
            países de processamento e respectivas funções deve ser mantida atualizada pelo controlador. A arquitetura do
            código não permite confirmar, sozinha, todos os fornecedores efetivamente contratados ou a região em que os
            dados de produção estão armazenados.
          </p>
        </Section>

        <Section id="secao-6" title="6. Transferência internacional de dados">
          <p>
            Alguns fornecedores de tecnologia podem armazenar ou acessar dados a partir de outros países. Quando isso
            ocorrer, a transferência deverá observar os arts. 33 a 36 da LGPD e a regulamentação da ANPD, inclusive a
            Resolução CD/ANPD nº 19/2024, quando aplicável, e utilizar uma das hipóteses e garantias legalmente
            previstas.
          </p>
        </Section>

        <Section id="secao-7" title="7. Retenção e descarte">
          <p>
            Os dados são mantidos pelo tempo necessário para cumprir as finalidades informadas, administrar a conta e as
            interações, atender obrigações legais, preservar a segurança e permitir o exercício regular de direitos. Não
            há um prazo único aplicável a todas as categorias.
          </p>
          <ul className="list-disc space-y-2 pl-6">
            <li>
              <strong className="text-foreground">Dados de conta e perfil:</strong> durante a vigência da conta e o
              período necessário para concluir a exclusão, anonimização e eventuais retenções justificadas.
            </li>
            <li>
              <strong className="text-foreground">Comprovantes institucionais:</strong> pelo período necessário à
              análise e à eventual contestação; devem ser eliminados ou ter o acesso encerrado quando deixarem de ser
              necessários, salvo obrigação ou fundamento legítimo de conservação.
            </li>
            <li>
              <strong className="text-foreground">Projetos, chamadas, candidaturas e eventos:</strong> enquanto
              disponíveis na plataforma e pelo período posterior necessário à administração, histórico, segurança ou
              defesa de direitos.
            </li>
            <li>
              <strong className="text-foreground">Sessões e autenticação:</strong> até expiração ou revogação, com
              registros técnicos pelo período necessário à segurança.
            </li>
            <li>
              <strong className="text-foreground">Auditoria e transações:</strong> pelo prazo definido em política
              interna de retenção, considerando obrigações legais, prevenção a fraude e exercício regular de direitos.
              Os registros de auditoria não devem ser descritos como “imutáveis” sem validação técnica e de governança.
            </li>
            <li>
              <strong className="text-foreground">Backups e cópias técnicas:</strong> conforme o ciclo de retenção e
              rotação dos fornecedores, com acesso restrito e eliminação ao fim do prazo aplicável.
            </li>
          </ul>
          <p>
            A conservação é limitada ao período necessário para cada finalidade. Encerrada essa necessidade, os dados
            são eliminados ou anonimizados, ressalvadas as hipóteses legais que autorizam sua manutenção, conforme os
            arts. 15 e 16 da LGPD.
          </p>
        </Section>

        <Section id="secao-8" title="8. Segurança da informação">
          <p>
            A aplicação utiliza controles técnicos identificados no código, como autenticação por código temporário,
            sessões com expiração e revogação, autorização de operações na API, armazenamento de anexos em serviço de
            objetos, e registros de auditoria para operações relevantes. A implementação e a configuração de produção
            devem ser continuamente verificadas.
          </p>
          <p>
            São adotadas ou devem ser mantidas medidas proporcionais ao risco, incluindo controle de acesso por função e
            necessidade, proteção de credenciais e segredos, atualização de dependências, gestão de vulnerabilidades,
            cópias de segurança, monitoramento, treinamento e procedimentos de resposta a incidentes. Nenhum sistema é
            totalmente livre de riscos; por isso, não se promete segurança absoluta.
          </p>
        </Section>

        <Section id="secao-9" title="9. Incidentes de segurança">
          <p>
            Em caso de incidente que possa afetar dados pessoais, o controlador deverá avaliar natureza, categorias de
            dados, titulares afetados, riscos e medidas de mitigação, documentar a ocorrência e acionar os fornecedores
            envolvidos.
          </p>
          <p>
            Quando o incidente puder acarretar risco ou dano relevante, a comunicação à ANPD e aos titulares deverá
            observar o prazo e os critérios da Resolução CD/ANPD nº 15/2024 — em regra, três dias úteis contados do
            conhecimento pelo controlador, ressalvadas as regras específicas aplicáveis, inclusive eventual prazo em
            dobro para agente de tratamento de pequeno porte que efetivamente se enquadre na regulamentação. A
            comunicação deve ser clara, individualizada sempre que possível, e conter as informações exigidas pela
            norma.
          </p>
          <p>
            O registro do incidente deverá ser mantido pelo prazo mínimo regulamentar aplicável. Os usuários poderão
            receber comunicação pelos canais de contato cadastrados ou por outros meios adequados, com informações sobre
            a natureza do evento, possíveis impactos e medidas recomendadas.
          </p>
        </Section>

        <Section id="secao-10" title="10. Direitos dos titulares">
          <p>Nos termos do art. 18 da LGPD, o titular pode solicitar, conforme aplicável:</p>
          <ul className="list-disc space-y-2 pl-6">
            <li>confirmação da existência de tratamento e acesso aos dados;</li>
            <li>correção de dados incompletos, inexatos ou desatualizados;</li>
            <li>
              anonimização, bloqueio ou eliminação de dados desnecessários, excessivos ou tratados em desconformidade;
            </li>
            <li>portabilidade, observadas a regulamentação da ANPD e a proteção de segredos comercial e industrial;</li>
            <li>eliminação dos dados tratados com consentimento, ressalvadas as hipóteses legais de conservação;</li>
            <li>informação sobre entidades públicas e privadas com as quais houve compartilhamento;</li>
            <li>informação sobre a possibilidade de não fornecer consentimento e suas consequências;</li>
            <li>revogação do consentimento, quando essa for a base legal;</li>
            <li>
              revisão de decisões tomadas unicamente com base em tratamento automatizado que afetem seus interesses, nos
              termos da lei.
            </li>
          </ul>
          <p>
            O pedido pode ser encaminhado pelos canais de atendimento disponibilizados na própria plataforma. Para
            proteger o titular, poderemos solicitar informações razoáveis para confirmar sua identidade e localizar os
            dados. O atendimento será gratuito e ocorrerá nos prazos e condições da LGPD e da regulamentação aplicável.
            Quando não for possível atender imediatamente, serão informadas as razões de fato ou de direito e, quando
            cabível, as providências possíveis.
          </p>
          <p>
            A área autenticada pode oferecer consulta, exportação de dados em formato estruturado e solicitação de
            exclusão da conta. A exportação atualmente identificada na API abrange dados de usuário, conta, sessões,
            vínculos institucionais, preferências, projetos e pontos; ela não deve ser entendida como garantia de
            exportação de absolutamente todo conteúdo ou dado tratado por terceiros.
          </p>
          <p>
            A exclusão da conta implementada pela aplicação realiza anonimização dos dados do usuário, e não
            necessariamente apagamento físico imediato de cada registro. Dados que precisem ser conservados por
            fundamento legal poderão permanecer pelo prazo necessário, com restrição de acesso e finalidade.
          </p>
        </Section>

        <Section id="secao-11" title="11. Cookies e tecnologias semelhantes">
          <p>
            A aplicação pode utilizar cookies ou mecanismos equivalentes para autenticação, manutenção de sessão,
            segurança e funcionamento das funcionalidades solicitadas. Esses recursos podem armazenar informações no
            navegador ou dispositivo para permitir o funcionamento adequado da plataforma.
          </p>
          <p>
            Cookies não necessários, quando utilizados, dependem de informação clara sobre suas finalidades e de uma
            forma adequada de escolha pelo usuário, inclusive para recusar ou retirar o consentimento quando essa for a
            base legal aplicável.
          </p>
        </Section>

        <Section id="secao-12" title="12. Decisões automatizadas e inteligência artificial">
          <p>
            As funcionalidades identificadas na plataforma incluem automações operacionais, como publicação agendada,
            encerramento de promoções e avanço de fases de eventos. Essas automações executam regras previamente
            configuradas e, por si só, não significam que uma decisão relevante sobre o usuário seja tomada
            exclusivamente por meios automatizados.
          </p>
          <p>
            Caso sejam disponibilizados recursos de inteligência artificial, perfilamento ou decisões exclusivamente
            automatizadas que afetem os interesses dos usuários, serão fornecidas informações sobre suas finalidades,
            dados utilizados e meios de solicitar revisão, quando aplicável.
          </p>
        </Section>

        <Section id="secao-13" title="13. Alterações desta Política">
          <p>
            Esta Política poderá ser atualizada para refletir mudanças na plataforma, nos fornecedores, nas práticas de
            tratamento ou na legislação. A versão vigente e sua data estarão nesta página. Mudanças relevantes serão
            comunicadas por meio adequado e, quando necessário, será obtido novo consentimento ou aceite.
          </p>
        </Section>

        <Section id="secao-14" title="14. Contato e reclamações">
          <p>
            Para dúvidas, solicitações ou reclamações sobre privacidade, utilize os canais de atendimento
            disponibilizados na própria plataforma e identifique o assunto como “Proteção de Dados — LGPD”. O titular
            também pode apresentar petição à Autoridade Nacional de Proteção de Dados (ANPD), observados os
            procedimentos oficiais.
          </p>
        </Section>
      </div>
    </main>
  )
}
