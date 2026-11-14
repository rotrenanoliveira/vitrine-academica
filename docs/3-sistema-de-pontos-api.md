# Sistema de pontos: contrato da API

Prefixo de todas as rotas: `/api/v1`. Todas exigem `Authorization: Bearer <accessToken>`. Sem login, a API responde 401.

## Como os pontos funcionam

- Quando alguém dá estrela pela primeira vez em um projeto publicado, o autor do projeto e os coautores com convite aceito recebem pontos iguais ao peso da estrela: 1 para usuário comum e aluno, 5 para professor ou docente com vínculo institucional ativo.
- Remover a estrela e dar de novo não gera pontos novos, e remover a estrela não tira os pontos.
- Quem dá a estrela não recebe pontos por ela, mesmo sendo coautor do projeto (regra a confirmar).
- Estrelas dadas antes do sistema de pontos não geraram pontos. A nota docente também não gera pontos.
- O saldo é a soma dos créditos menos a soma dos débitos.
- O saldo e o histórico completo também aparecem na exportação de dados (`GET /users/me/export`, campo `points`).

## GET /points/me

Saldo do usuário logado. Use na aba da conta.

Resposta 200:

```json
{ "balance": 1006 }
```

## GET /points/me/transactions

Histórico do usuário logado, da transação mais recente para a mais antiga.

Parâmetro opcional: `limit` (inteiro de 1 a 100, padrão 20).

Resposta 200:

```json
{
  "transactions": [
    {
      "id": "uuid",
      "type": "CREDIT",
      "amount": 5,
      "reason": "STAR_RECEIVED",
      "referenceId": "uuid-da-estrela",
      "createdAt": "2026-11-12T10:00:00.000Z"
    }
  ]
}
```

- `type`: `CREDIT` soma ao saldo e `DEBIT` subtrai.
- `reason`: `STAR_RECEIVED` (o `referenceId` é o id da estrela) ou `PROMOTION` (o `referenceId` é o id da promoção, quando a promoção existir).
- `amount` é sempre positivo. O sinal vem do `type`.

Erros: 400 (`limit` fora de 1 a 100) e 401.

## POST /projects/:projectId/promotions

Promove o projeto gastando pontos do usuário logado. Sem corpo. O custo (1000 pontos) é debitado na mesma operação que cria a promoção, que dura 7 dias (duração ainda provisória).

Resposta 201:

```json
{
  "promotion": {
    "id": "uuid",
    "projectId": "uuid",
    "promoterId": "uuid",
    "cost": 1000,
    "status": "ACTIVE",
    "expiresAt": "2026-11-20T10:00:00.000Z",
    "createdAt": "2026-11-13T10:00:00.000Z"
  }
}
```

Regras e erros (todos com `{ "message": "..." }` em português, para mostrar direto na tela):

| Status | Quando |
| --- | --- |
| 400 | O projeto não está publicado |
| 401 | Sem login |
| 403 | É o seu próprio projeto (autor ou coautor com convite aceito) ou o usuário não está ativo |
| 404 | O projeto não existe |
| 409 | Saldo insuficiente (a mensagem informa o custo e o saldo) ou você já tem uma promoção ativa neste projeto |

Pessoas diferentes podem promover o mesmo projeto. Depois de promover, o saldo e o histórico (`GET /points/me` e `GET /points/me/transactions`) já refletem o débito, com `reason: "PROMOTION"` e `referenceId` igual ao id da promoção.

## GET /promotions/active

Promoções ativas (status `ACTIVE`, dentro da validade e de projetos publicados), da mais recente à mais antiga. Rota pública (não exige login).

Quando o mesmo projeto tem mais de uma promoção ativa, a lista devolve **apenas uma entrada por projeto**, sempre a promoção mais recente.

Parâmetros de query:

| Parâmetro | Tipo | Padrão | Limite |
| --- | --- | --- | --- |
| `page` | inteiro ≥ 1 | `1` | — |
| `limit` | inteiro | `20` | 1 a 100 |

Resposta 200:

```json
{
  "items": [
    {
      "promotion": { "id": "uuid", "projectId": "uuid", "promoterId": "uuid", "cost": 1000, "status": "ACTIVE", "expiresAt": "...", "createdAt": "..." },
      "project": {
        "id": "uuid",
        "title": "...",
        "slug": "...",
        "description": "...",
        "authorId": "uuid",
        "status": "PUBLISHED",
        "coverUrl": null,
        "attachments": [],
        "tags": [],
        "createdAt": "..."
      },
      "promoter": { "id": "uuid", "name": "Nome de quem promoveu" }
    }
  ],
  "total": 17,
  "page": 1,
  "limit": 20
}
```

O e-mail de quem promoveu nunca é exposto.

Se quem promoveu excluir a conta, a promoção continua na lista até o fim da validade, e `promoter.name` vem com o nome anonimizado pela exclusão de conta. Os pontos já foram debitados e não voltam. O front deve esperar que esse nome possa vir anonimizado.

## Campo `featured` nos projetos

Três rotas devolvem `featured` (booleano) em cada projeto: `GET /projects/:projectId` (no objeto `project`), `GET /projects/published` e `GET /users/:userId/projects-of-interest` (a home personalizada), ambas em `projects`.

`true` quando o projeto tem ao menos uma promoção ativa (status `ACTIVE` e dentro da validade). Use para mostrar a etiqueta de "promovido". Para saber quem promoveu e até quando, use `GET /promotions/active`.

As demais rotas que devolvem projetos (por exemplo `GET /projects/me` e `GET /me/starred-projects`) ainda não trazem o campo.


## Encerramento das promoções

Uma promoção termina sozinha quando a validade passa: um processo interno, que roda a cada 30 segundos, muda o status dela para `EXPIRED`. Isso não depende de nenhuma rota. Mesmo antes desse processo rodar, a promoção vencida já deixa de aparecer em `GET /promotions/active` e o `featured` do projeto volta a `false`, porque essas consultas olham a data de validade.