# Gitflow — guia para iniciantes

Este documento explica **como trabalhamos com Git** neste projeto. O objetivo é que qualquer pessoa júnior consiga criar branches, abrir PRs e integrar código sem medo de “quebrar” a `main`.

---

## O que é Gitflow?

Gitflow é um **modelo de branches**: regras claras sobre **onde** cada tipo de trabalho vive e **como** ele chega até produção.

Em resumo:

| Branch | Papel |
|--------|--------|
| `main` | Código **estável / produção**. Só recebe merges já revisados (via `develop` ou hotfix). |
| `develop` | Integração do dia a dia. É a base para novas features. |
| `feature/*` ou `feat/*` | Trabalho de uma tarefa específica (uma história, um bugfix, um chore). |
| `hotfix/*` | Correção urgente em produção (sai da `main`). |
| `release/*` (opcional) | Preparação de uma versão antes de ir para `main`. |

```text
main ──────────────────────────────────────────►  (produção)
  │                                    ▲
  │                                    │ merge / PR
  └──────── develop ───────────────────┘
              ▲
              │ PR
        feature/minha-tarefa
```

Neste repositório já usamos `main`, `develop` e branches como `feat/api-core` e `feature/identity-domain-user`.

---

## Regras de ouro (leia antes de qualquer comando)

1. **Nunca commit direto na `main`.** Sempre branch + Pull Request (PR).
2. **Novas features nascem a partir de `develop`**, não de `main`.
3. **Uma branch = uma intenção clara** (ex.: “domínio de usuário”, “setup do Vitest”). Evite misturar assuntos.
4. **Atualize sua branch com `develop` com frequência** para reduzir conflitos.
5. **Mensagens de commit no padrão Conventional Commits** (ex.: `feat:`, `fix:`, `chore:`, `docs:`).
6. **Só faça merge depois de review** (quando o time pedir).

---

## Nomes de branch

Use prefixo + descrição curta em inglês ou kebab-case:

| Prefixo | Quando usar | Exemplo |
|---------|-------------|---------|
| `feat/` ou `feature/` | Nova funcionalidade | `feat/identity-domain-user` |
| `fix/` | Correção de bug | `fix/login-token-expired` |
| `chore/` | Infra, tooling, deps | `chore/test-environment` |
| `docs/` | Só documentação | `docs/gitflow` |
| `hotfix/` | Urgente em produção | `hotfix/auth-500` |

Evite nomes vagos: `teste`, `wip`, `minha-branch`.

---

## Fluxo do dia a dia (feature)

### 1. Atualizar a `develop`

```bash
git checkout develop
git pull origin develop
```

### 2. Criar sua branch

```bash
git checkout -b feat/nome-da-tarefa
```

### 3. Trabalhar e commitiar

Faça commits pequenos e frequentes:

```bash
git add .
git commit -m "feat: add User entity"
```

Exemplos de mensagens:

- `feat: add User entity`
- `fix: prevent duplicate email on signup`
- `chore: add vitest`
- `docs: explain gitflow for juniors`

### 4. Enviar a branch para o remoto

```bash
git push -u origin feat/nome-da-tarefa
```

### 5. Abrir um Pull Request

- **Base (destino):** `develop`
- **Compare (origem):** sua `feat/...`
- Título claro, descrição do que mudou e como testar
- Peça review se o time exigir

### 6. Depois do merge

```bash
git checkout develop
git pull origin develop
git branch -d feat/nome-da-tarefa   # apaga local
```

No GitHub, a branch remota pode ser apagada ao finalizar o PR.

---

## Como manter a branch atualizada

Se `develop` avançou enquanto você trabalhava:

```bash
git checkout feat/nome-da-tarefa
git fetch origin
git merge origin/develop
# resolva conflitos, se houver
git push
```

Alternativa (só se o time usar rebase):

```bash
git fetch origin
git rebase origin/develop
git push --force-with-lease
```

> Prefira **merge** se ainda não estiver confortável com rebase. Nunca use `--force` sem `--force-with-lease`, e nunca force push em `main` / `develop`.

---

## Hotfix (bug urgente em produção)

Use quando o problema já está na `main` e não pode esperar o ciclo normal.

```bash
git checkout main
git pull origin main
git checkout -b hotfix/descricao-curta
# corrija, commit, push
```

Abra um PR para **`main`**. Depois do merge, **também integre a correção em `develop`** (PR ou cherry-pick), para o bug não voltar.

---

## Release (opcional)

Quando for “fechar” uma versão:

1. Crie `release/x.y.z` a partir de `develop`.
2. Ajuste versão, changelog, últimos ajustes.
3. Merge em `main` (e tag, se o time usar).
4. Merge de volta em `develop`.

Se o time ainda não usa releases formais, o caminho mais comum é: features → `develop` → periodicamente `develop` → `main`.

---

## Checklist rápido antes de abrir o PR

- [ ] Branch criada a partir de `develop` atualizada
- [ ] Só o que pertence à tarefa (sem arquivos sensíveis: `.env`, secrets)
- [ ] Commits com mensagens claras
- [ ] Código sobe / testes passam localmente (quando existirem)
- [ ] PR apontando para `develop` (exceto hotfix → `main`)
- [ ] Descrição do PR com o “porquê” e como validar

---

## Erros comuns (e como evitar)

| Erro | O que fazer |
|------|-------------|
| Commitou na `main` ou `develop` | Crie uma branch a partir do commit e abra PR; não continue commitando direto |
| Branch muito desatualizada | `merge` / `rebase` de `origin/develop` antes do PR |
| Um PR gigante com várias features | Divida em PRs menores |
| Force push na `main` | **Não faça.** Peça ajuda ao time |
| Incluiu `.env` no commit | Remova do stage; confirme que está no `.gitignore` |

---

## Glossário mínimo

- **Branch:** linha de trabalho isolada.
- **Commit:** snapshot do código com mensagem.
- **Push:** envia commits locais para o remoto (GitHub).
- **Pull:** traz alterações do remoto para o local.
- **PR (Pull Request):** pedido de revisão e merge de uma branch em outra.
- **Merge:** junta o histórico de uma branch em outra.
- **Conflito:** o Git não sabe escolher entre duas edições no mesmo trecho — você resolve manualmente.

---

## Resumo em uma frase

> Trabalhe em `feat/...` a partir de `develop` → abra PR para `develop` → depois `develop` vai para `main` quando estiver estável; hotfixes saem da `main` e voltam também para `develop`.
`)