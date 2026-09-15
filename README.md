# Vitrine Acadêmica

Plataforma para exibir projetos acadêmicos vinculados a instituições (universidades, escolas, etc.). O acesso é feito por código enviado por e-mail (sem senha).

Monorepo com API (`apps/api`) e frontend (`apps/web`).

## Stack

- **Monorepo:** pnpm + Turbo
- **API:** Fastify, Zod, JWT, Drizzle ORM
- **Web:** Next.js (App Router), React, Tailwind
- **Banco:** PostgreSQL
- **Serviços:** Cloudflare R2 (arquivos), Resend (e-mail)

## Pré-requisitos

- Node.js ≥ 24
- pnpm 11
- PostgreSQL acessível via `DATABASE_URL`

## Como subir

Na raiz do repositório:

```bash
cp .env.example .env
cp apps/web/.env.example apps/web/.env
```

Preencha o `.env` da raiz (API). Use `PORT=4000` para bater com o frontend, que aponta para `http://localhost:4000`. Também são necessários `DATABASE_URL`, `COOKIE_SECRET`, `JWT_SECRET` e as variáveis de Cloudflare R2 e Resend — veja [`.env.example`](.env.example).

No `apps/web/.env`, mantenha `NEXT_PUBLIC_API_URL=http://localhost:4000` e adicione `NEXT_PUBLIC_ASSETS_URL` (URL pública dos assets no R2).

```bash
pnpm install
pnpm --filter @vitrine-academica/api db:migrate
pnpm --filter @vitrine-academica/api db:seed   # opcional
pnpm dev
```

`pnpm dev` sobe API e web juntos via Turbo.

| Serviço | URL |
|---------|-----|
| Web | http://localhost:3000 |
| API | http://localhost:4000 |
| Health | http://localhost:4000/health |
| Swagger | http://localhost:4000/docs |
