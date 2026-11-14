import type { Metadata } from 'next'
import type { ReactNode } from 'react'

export const metadata: Metadata = {
  title: 'Termos de Uso | Vitrine Acadêmica',
  description:
    'Regras de acesso, participação, publicação de projetos, avaliações, eventos, propriedade intelectual e responsabilidades na Vitrine Acadêmica.',
}

const Section = ({ id, title, children }: { id: string; title: string; children: ReactNode }) => (
  <section aria-labelledby={id} className="space-y-4">
    <h2 id={id} className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
      {title}
    </h2>
    <div className="space-y-3 leading-relaxed text-muted-foreground">{children}</div>
  </section>
)

export default function TermosDeUsoPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
      <header className="mb-10 border-b border-border pb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Termos de Uso da Vitrine Acadêmica
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">Última atualização: 13 de novembro de 2026 · Versão 3.0</p>
        <p className="mt-6 leading-relaxed text-foreground">
          Estes Termos regulam o acesso e o uso da Vitrine Acadêmica. Ao criar uma conta ou utilizar recursos que exigem
          autenticação, você declara que leu e aceita estas condições. A navegação em páginas e conteúdos públicos
          também está sujeita às regras aplicáveis de conduta, propriedade intelectual e proteção de dados.
        </p>
      </header>

      <div className="space-y-10">
        <Section id="secao-1" title="1. Sobre a plataforma e seu escopo">
          <p>
            <strong className="text-foreground">1.1.</strong> A Vitrine Acadêmica é uma plataforma digital destinada à
            divulgação e descoberta de projetos acadêmicos, aproximação de pessoas interessadas em colaborar,
            organização de chamadas e candidaturas, avaliação de trabalhos, acompanhamento de autores, consulta a
            pesquisas científicas e realização de eventos e atividades institucionais.
          </p>
          <p>
            <strong className="text-foreground">1.2.</strong> Entre os recursos disponíveis, conforme a configuração e
            as permissões da conta, estão: cadastro e publicação de projetos (inclusive com publicação agendada), anexos
            e tags; chamadas e candidaturas; convites e participação em projetos; avaliações comunitárias e docentes por
            critérios; pontos e promoções de projetos; instituições e seus membros; eventos, temas, inscrições e
            votações; acompanhamento de autores e avisos por e-mail; e busca de trabalhos científicos em fontes
            externas.
          </p>
          <p>
            <strong className="text-foreground">1.3.</strong> A plataforma é um ambiente de divulgação e interação.
            Salvo acordo separado e expresso, ela não representa instituição de ensino, não certifica a validade
            acadêmica de trabalhos, não garante aprovação, contratação, bolsa, orientação, parceria ou resultado de
            pesquisa e não substitui os regulamentos de cada instituição.
          </p>
        </Section>

        <Section id="secao-2" title="2. Cadastro, elegibilidade e perfis">
          <p>
            <strong className="text-foreground">2.1.</strong> Para utilizar recursos autenticados, o usuário deve
            fornecer informações verdadeiras, completas e atualizadas, manter acesso ao e-mail informado e não utilizar
            identidade de terceiros. A autenticação é realizada por código temporário enviado ao endereço de e-mail
            cadastrado, sem uso de senha convencional.
          </p>
          <p>
            <strong className="text-foreground">2.2.</strong> A plataforma diferencia permissões de acordo com o papel
            atribuído à conta e, quando aplicável, com o vínculo institucional aprovado. Os papéis e permissões podem
            incluir usuário sem vínculo confirmado, estudante, professor, equipe administrativa/gestora de instituição e
            administrador da plataforma. A nomenclatura e os recursos disponíveis podem variar conforme a instituição e
            a versão do serviço.
          </p>
          <p>
            <strong className="text-foreground">2.3.</strong> A solicitação de vínculo pode exigir instituição, papel
            pretendido e documento comprobatório. A instituição ou pessoa autorizada poderá analisar, aprovar ou
            rejeitar a solicitação. O envio de documento não garante aprovação. Não envie documentos além dos
            solicitados nem informações de terceiros sem autorização ou outra base legal válida.
          </p>
          <p>
            <strong className="text-foreground">2.4.</strong> O usuário é responsável pelas atividades realizadas em sua
            conta e deve comunicar prontamente qualquer suspeita de acesso indevido. A plataforma poderá solicitar
            confirmação adicional, limitar recursos ou suspender temporariamente o acesso para proteger a conta, os
            usuários ou o serviço.
          </p>
        </Section>

        <Section id="secao-3" title="3. Projetos, chamadas, candidaturas e interações">
          <p>
            <strong className="text-foreground">3.1.</strong> O usuário deve assegurar que tem legitimidade para
            publicar cada projeto, descrição, imagem, arquivo, chamada, mensagem ou outro material enviado. Deve
            respeitar direitos autorais, marcas, confidencialidade, direitos de imagem, propriedade industrial, regras
            acadêmicas e direitos de terceiros.
          </p>
          <p>
            <strong className="text-foreground">3.2.</strong> Projetos publicados e informações que o autor escolher
            tornar públicas poderão ser visualizados por visitantes e usuários da plataforma. Chamadas podem receber
            candidaturas; os dados e mensagens fornecidos na candidatura serão disponibilizados ao responsável pela
            chamada e às pessoas autorizadas a avaliá-la, para análise da oportunidade.
          </p>
          <p>
            <strong className="text-foreground">3.3.</strong> Antes de publicar, verifique se o material contém dados
            pessoais, informações confidenciais, resultados ainda protegidos, dados de participantes de pesquisa ou
            conteúdo sujeito a embargo. Não publique dados pessoais sensíveis ou dados identificáveis de terceiros sem
            base legal adequada e, quando necessário, autorização. A plataforma não substitui a avaliação ética de
            pesquisas com participantes humanos.
          </p>
          <p>
            <strong className="text-foreground">3.4.</strong> O usuário é responsável pela exatidão das informações,
            pela gestão de permissões e convites de integrantes e por obter as autorizações necessárias dos coautores. A
            plataforma não decide disputas de autoria ou titularidade; poderá restringir temporariamente conteúdo objeto
            de reclamação fundamentada enquanto apura a situação.
          </p>
        </Section>

        <Section id="secao-4" title="4. Condutas proibidas">
          <p>É proibido utilizar a plataforma para:</p>
          <ul className="list-disc space-y-2 pl-6">
            <li>violar leis, direitos de terceiros, regras acadêmicas ou estes Termos;</li>
            <li>
              publicar conteúdo ilícito, discriminatório, ameaçador, difamatório, fraudulento, abusivo ou que incentive
              violência;
            </li>
            <li>
              expor dados pessoais, documentos, informações confidenciais ou imagens de terceiros sem autorização ou
              fundamento jurídico;
            </li>
            <li>
              praticar plágio, falsificar autoria, credenciais, vínculo institucional, resultados, avaliações ou
              informações de candidatura;
            </li>
            <li>
              criar contas, avaliações, votos, candidaturas ou interações artificiais para manipular reputação,
              rankings, eventos ou pontos;
            </li>
            <li>
              avaliar projeto próprio ou projeto em que tenha conflito de interesses, quando isso comprometer a
              imparcialidade;
            </li>
            <li>
              tentar acessar contas, arquivos, sistemas ou áreas sem autorização, contornar controles, introduzir código
              malicioso ou comprometer a disponibilidade e segurança do serviço;
            </li>
            <li>
              usar dados obtidos na plataforma para spam, assédio, prospecção não autorizada ou finalidade incompatível
              com o contexto da interação.
            </li>
          </ul>
        </Section>

        <Section id="secao-5" title="5. Avaliações, pontos e promoções">
          <p>
            <strong className="text-foreground">5.1.</strong> A plataforma pode oferecer avaliações comunitárias e
            avaliações docentes por critérios. Conforme as regras do recurso, avaliações comunitárias podem ser
            representadas por estrelas e avaliações de professores verificados por notas e critérios. A existência de
            avaliação não significa certificação, endosso institucional ou garantia de qualidade.
          </p>
          <p>
            <strong className="text-foreground">5.2.</strong> É proibido avaliar o próprio projeto, utilizar contas de
            terceiros ou combinar avaliações para manipular resultados. Avaliações devem refletir opinião ou análise
            genuína, respeitosa e relacionada ao trabalho avaliado.
          </p>
          <p>
            <strong className="text-foreground">5.3.</strong> A plataforma pode atribuir pontos virtuais segundo regras
            operacionais exibidas no serviço, incluindo créditos relacionados a avaliações recebidas e débitos por
            promoções. Pontos não são moeda, não têm valor monetário, não podem ser sacados, transferidos ou vendidos e
            não representam crédito ou direito de remuneração.
          </p>
          <p>
            <strong className="text-foreground">5.4.</strong> Quando disponível, a promoção utiliza pontos para dar
            destaque a projeto de terceiro, observadas as regras apresentadas no momento da operação. Conteúdo promovido
            deve ser identificado como tal. A plataforma poderá cancelar ou ajustar transações obtidas por fraude, erro
            técnico ou violação destes Termos, preservando os registros necessários à prestação de contas.
          </p>
        </Section>

        <Section id="secao-6" title="6. Eventos, instituições e recursos externos">
          <p>
            <strong className="text-foreground">6.1.</strong> Eventos podem incluir seleção de temas, inscrições de
            projetos, etapas institucionais e votações. Prazos, critérios, elegibilidade, escopo de participação e
            responsáveis devem ser consultados na página de cada evento. A organização do evento é responsável por suas
            regras específicas e decisões acadêmicas.
          </p>
          <p>
            <strong className="text-foreground">6.2.</strong> Instituições e seus representantes são responsáveis pela
            legitimidade das informações institucionais que cadastram e pelas decisões de gestão de seus membros e
            solicitações de vínculo. A plataforma fornece ferramentas técnicas e não assume automaticamente a
            responsabilidade acadêmica ou administrativa da instituição.
          </p>
          <p>
            <strong className="text-foreground">6.3.</strong> A busca de pesquisas científicas pode consultar serviços
            externos, como a OpenAlex, e exibir referências, autores e links de origem. Os resultados são fornecidos por
            terceiros, podem conter erros ou estar desatualizados e devem ser conferidos na fonte original. O acesso ao
            site externo fica sujeito aos termos e políticas do respectivo fornecedor.
          </p>
        </Section>

        <Section id="secao-7" title="7. Propriedade intelectual e licença de uso">
          <p>
            <strong className="text-foreground">7.1.</strong> O conteúdo enviado continua pertencendo ao seu titular,
            observados os direitos de coautores, instituições, financiadores e terceiros. Estes Termos não transferem à
            plataforma a propriedade de projetos, pesquisas, textos, imagens, marcas ou arquivos do usuário.
          </p>
          <p>
            <strong className="text-foreground">7.2.</strong> Ao enviar conteúdo, o usuário concede à plataforma licença
            não exclusiva, gratuita, válida durante a disponibilização do conteúdo e limitada ao necessário para
            hospedar, armazenar, reproduzir tecnicamente, formatar, exibir, distribuir dentro das funcionalidades, gerar
            cópias de segurança e divulgar o conteúdo conforme as configurações de visibilidade escolhidas. A licença
            termina quando o conteúdo é removido, ressalvadas cópias técnicas temporárias, backups e retenções
            legalmente necessárias.
          </p>
          <p>
            <strong className="text-foreground">7.3.</strong> O usuário declara possuir as autorizações necessárias para
            conceder essa licença e deve indicar adequadamente coautoria, licenças abertas, restrições de uso e créditos
            aplicáveis. A plataforma não concede ao público licença mais ampla do que aquela indicada pelo titular ou
            permitida pela lei.
          </p>
          <p>
            <strong className="text-foreground">7.4.</strong> A marca, identidade visual, software, estrutura e
            elementos próprios da Vitrine Acadêmica são protegidos pela legislação aplicável e não podem ser copiados,
            modificados ou explorados sem autorização, salvo permissões legais.
          </p>
        </Section>

        <Section id="secao-8" title="8. Acompanhamento de autores e comunicações">
          <p>
            <strong className="text-foreground">8.1.</strong> O usuário autenticado pode acompanhar autores para receber
            avisos por e-mail sobre novos projetos publicados. O acompanhamento pode ser cancelado na plataforma ou pelo
            link de descadastramento disponível na mensagem, quando aplicável.
          </p>
          <p>
            <strong className="text-foreground">8.2.</strong> Mensagens operacionais, como códigos de acesso, avisos de
            segurança e comunicações necessárias à conta, podem ser enviadas para viabilizar o serviço. Mensagens de
            acompanhamento ou outras comunicações opcionais serão tratadas conforme as escolhas e configurações
            disponíveis.
          </p>
        </Section>

        <Section id="secao-9" title="9. Moderação, denúncias e medidas">
          <p>
            <strong className="text-foreground">9.1.</strong> A plataforma poderá analisar denúncias e sinais de
            violação, solicitar esclarecimentos, restringir a visibilidade, remover conteúdo, cancelar promoções,
            reverter pontos indevidos, limitar funcionalidades ou suspender/encerrar contas, considerando a gravidade,
            recorrência, risco e contexto.
          </p>
          <p>
            <strong className="text-foreground">9.2.</strong> Sempre que razoavelmente possível, o usuário será
            informado sobre a medida e sua justificativa, sem prejuízo de restrições necessárias para segurança,
            prevenção a fraude, cumprimento de ordem legal ou proteção de terceiros. O usuário poderá apresentar
            contestação pelo canal de atendimento informado na plataforma.
          </p>
          <p>
            <strong className="text-foreground">9.3.</strong> Reclamações sobre direitos autorais, privacidade ou
            conteúdo devem conter informações suficientes para identificar o material e explicar a alegada violação. A
            plataforma poderá preservar registros e cooperar com autoridades mediante requisição válida.
          </p>
        </Section>

        <Section id="secao-10" title="10. Disponibilidade, alterações e limitações">
          <p>
            <strong className="text-foreground">10.1.</strong> A plataforma é fornecida no estado em que se encontra e
            poderá passar por manutenção, atualização, indisponibilidade ou alteração de funcionalidades. São adotados
            esforços razoáveis para manter o serviço disponível e seguro, mas não há garantia de funcionamento
            ininterrupto, ausência de erros ou compatibilidade com todo dispositivo.
          </p>
          <p>
            <strong className="text-foreground">10.2.</strong> Na extensão permitida pela legislação, a plataforma não
            responde por conteúdo inserido por usuários, decisões de instituições, negociações entre usuários,
            indisponibilidade de serviços externos ou danos decorrentes de uso contrário a estes Termos. Esta disposição
            não exclui responsabilidades que não possam ser afastadas por lei, nem direitos assegurados ao consumidor
            quando aplicáveis.
          </p>
          <p>
            <strong className="text-foreground">10.3.</strong> Estes Termos podem ser atualizados para refletir mudanças
            legais, técnicas ou funcionais. Alterações relevantes serão comunicadas por meio adequado. A versão e a data
            de atualização serão indicadas nesta página. Quando exigido por lei, será solicitado novo aceite.
          </p>
        </Section>

        <Section id="secao-11" title="11. Encerramento da conta">
          <p>
            <strong className="text-foreground">11.1.</strong> O usuário poderá solicitar a exclusão da conta pelos
            recursos disponíveis em sua área autenticada. A operação pode anonimizar os dados de identificação e
            encerrar sessões, mas pode depender de providências prévias quando o usuário for o único gestor de
            instituição com outros membros ou quando houver pendências operacionais.
          </p>
          <p>
            <strong className="text-foreground">11.2.</strong> A exclusão não implica necessariamente apagar
            imediatamente todo registro. Dados poderão ser conservados quando houver obrigação legal ou regulatória,
            exercício regular de direitos, prevenção a fraude, segurança, auditoria ou outra hipótese legal, pelo prazo
            necessário e com acesso limitado. A Política de Privacidade explica os critérios de retenção.
          </p>
        </Section>

        <Section id="secao-12" title="12. Privacidade e proteção de dados">
          <p>
            O tratamento de dados pessoais é explicado na{' '}
            <a className="font-medium text-foreground underline underline-offset-4" href="/politica-de-privacidade">
              Política de Privacidade
            </a>
            , que integra estes Termos para fins informativos. Ela descreve categorias de dados, finalidades, bases
            legais, compartilhamentos, retenção, direitos dos titulares e canais de contato, nos termos da Lei nº
            13.709/2018 (LGPD).
          </p>
        </Section>

        <Section id="secao-13" title="13. Legislação e disposições finais">
          <p>
            <strong className="text-foreground">13.1.</strong> Aplicam-se as leis da República Federativa do Brasil,
            especialmente a LGPD (Lei nº 13.709/2018), o Marco Civil da Internet (Lei nº 12.965/2014), o Código Civil, a
            legislação de direitos autorais e, quando aplicável, o Código de Defesa do Consumidor.
          </p>
          <p>
            <strong className="text-foreground">13.2.</strong> Eventuais controvérsias serão submetidas ao foro
            legalmente competente, respeitadas as regras de competência e os direitos de consumidores. Nenhuma
            disposição destes Termos limita direitos indisponíveis previstos em lei.
          </p>
          <p>
            <strong className="text-foreground">13.3.</strong> Se alguma disposição for considerada inválida, as demais
            permanecerão em vigor na extensão permitida pela legislação.
          </p>
        </Section>
      </div>
    </main>
  )
}
