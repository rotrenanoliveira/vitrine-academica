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

## Ainda não implementado (proposta, pode mudar)

- Promover um projeto: custo de 1000 pontos, duração de 7 dias (duração provisória). Só projeto publicado, não pode ser o próprio projeto, precisa de saldo, e a mesma pessoa não pode ter duas promoções ativas no mesmo projeto.
- Rotas previstas: `POST /projects/:projectId/promotions` e `GET /promotions/active`.
- Etiqueta de "promovido" nos projetos: o formato (campo `featured` ou objeto com quem promoveu e quando expira) ainda será definido com o front.