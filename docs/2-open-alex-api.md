## OpenAlex

A OpenAlex é um catálogo aberto e gratuito de produção acadêmica mundial, mantido pela OurResearch, organização sem fins lucrativos. Ela reúne mais de 240 milhões de trabalhos científicos (artigos, teses, livros, conference papers) indexados a partir de diversas fontes, como Crossref, PubMed e repositórios institucionais, e disponibiliza esses dados por meio de uma API pública. Ela nasceu como sucessora do Microsoft Academic Graph, encerrado em 2021, e hoje é uma das principais bases abertas de metadados acadêmicos, usada tanto por pesquisadores quanto por sistemas que precisam consultar produção científica de forma programática.  No nosso sistema, ela é usada para permitir que o usuário pesquise trabalhos científicos relacionados à sua área diretamente na plataforma, sem precisar abrir outro site. Ao informar um termo de busca, a API devolve uma lista de trabalhos correspondentes, com título, autores, link de acesso, periódico e resumo, dados que o sistema exibe já formatados ao usuário.


## Definição do contrato interno (DTO)

Antes de conectar com a API, defini qual formato de dado o meu sistema usaria internamente, independente do formato da OpenAlex:

```ts
export interface AcademicProjectDto {  
  title: string;
  authors: string[];
  externalUrl: string;
  publishedIn: string;
  abstract?: string 
}
```

Essa separação existe para que, se a API externa mudar ou for substituída no futuro, apenas o serviço de integração precise ser alterado, sem afetar o restante do sistema.


## Criação do serviço de integração

Criei uma classe responsável exclusivamente por se comunicar com a OpenAlex: Usa a biblioteca ky para fazer a chamada HTTP. Envia o termo de busca, um limite de resultados e a chave de autenticação. Traduz a resposta da API (que vem em um formato próprio da OpenAlex) para o formato do AcademicProjectDto. Principal desafio técnico: a OpenAlex não devolve o resumo (abstract) como texto comum. Ela envia um "índice invertido", uma estrutura que informa em quais posições cada palavra aparece no texto original, e não o texto propriamente dito. Foi necessário escrever uma função que reconstrói o resumo a partir desse índice, ordenando as palavras pela posição. Também tratei casos em que a API não retorna todos os campos (por exemplo, trabalhos sem link direto ou sem resumo), usando valores alternativos (DOI ou identificador da OpenAlex) quando o link principal não existe.


## Uso da chave de API

A OpenAlex exige uma chave de autenticação para as requisições. Segui a prática de segurança do projeto: A chave foi salva em uma variável de ambiente (OPENALEX_API_KEY), nunca escrita diretamente no código. O arquivo .env.example do repositório contém apenas o nome da variável, sem o valor real, para orientar quem for configurar o projeto sem expor a chave. A chave é lida em tempo de execução e enviada como parâmetro na chamada à API.


## Criação do controller e da rota

O controller recebe a requisição HTTP, chama o caso de uso e traduz o resultado em resposta: 200 com a lista de trabalhos, ou 502 com uma mensagem genérica em caso de falha na integração. A rota `GET /api/v1/projects/external-search` define: Autenticação obrigatória: só usuários logados podem realizar a busca, o que protege o uso da chave de API contra abuso. Validação do parâmetro de busca `(q)` com Zod: obrigatório, com espaços removidos das pontas, entre 3 e 200 caracteres. Requisições inválidas recebem 400 antes mesmo de chegar ao caso de uso. Documentação automática no Swagger, com os formatos de requisição e resposta.


## Registro da rota na aplicação

A rota foi registrada junto às demais rotas de projeto da aplicação (arquivo central de rotas), o que a torna acessível em `/api/v1/projects/external-search`, seguindo o mesmo prefixo usado por todas as rotas do sistema.


## Validação e conclusão 

Após os testes automatizados passarem, subi a aplicação localmente e testei a rota real pelo Swagger `/docs`, autenticado com um token válido, confirmando que a integração funciona de ponta a ponta com a API da OpenAlex. A separação feita em camadas segue o padrão de arquitetura já adotado no restante do projeto e mantém a dependência da API externa isolada em um único ponto do sistema.
