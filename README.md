# GitHub Actions

O CI da Vitrine Acadêmica está em [`.github/workflows/`](.github/workflows/). São três workflows independentes. Todos disparam em qualquer `push` e em pull requests para `main` e `production`. O nome exibido no GitHub é a mensagem do commit ou o título do pull request.

Cada job roda em `ubuntu-latest`, com Node.js 24, pnpm `11.25.0` e `pnpm install --frozen-lockfile`.

| Workflow | Arquivo | O que executa |
|----------|---------|----------------|
| Biome Lint | [`run-biome-lint.yml`](.github/workflows/run-biome-lint.yml) | `pnpm exec biome check .` — lint e formatação do monorepo, com as regras de [`biome.json`](biome.json) |
| Unit Tests | [`run-unit-tests.yml`](.github/workflows/run-unit-tests.yml) | `pnpm --filter @vitrine-academica/api test:unit:run` — Vitest no projeto `unit` (`**/*.spec.ts` da API) |
| Integration Tests | [`run-e2e-tests.yml`](.github/workflows/run-e2e-tests.yml) | `pnpm --filter @vitrine-academica/api test:e2e:run` — Vitest no projeto `e2e` (`**/*.test.ts` e `**/*.e2e.spec.ts`) |

Os testes unitários cobrem casos de uso e domínio, sem banco. Os de integração sobem a API com [supertest](https://github.com/ladjs/supertest) e o [MSW](https://mswjs.io/) (`apps/api/tests/mocks/setup-msw.ts`), em série e com timeout de 30s.

O workflow de integração sobe um Postgres 18 como service container (`vitrine` / banco `vitrine_academica_test`, porta `5432`) e espera o healthcheck `pg_isready` antes dos testes. As variáveis da API (`DATABASE_URL`, `JWT_SECRET`, `COOKIE_SECRET`, Cloudflare R2, Resend e OpenAlex) são definidas no job com valores fictícios de teste. O frontend não entra nesses jobs.

Os mesmos comandos rodam localmente:

```bash
pnpm exec biome check .
pnpm --filter @vitrine-academica/api test:unit:run
pnpm --filter @vitrine-academica/api test:e2e:run
```

Os scripts de teste da API carregam `../../.env.test`. Para a integração local, o Postgres precisa estar acessível pela `DATABASE_URL` desse arquivo. No CI, as variáveis do workflow cobrem esse ambiente.
