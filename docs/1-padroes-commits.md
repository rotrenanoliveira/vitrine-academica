# Guia completo: branches, commits e sincronização com `develop`

Este documento é um tutorial **passo a passo** para quem está começando com Git.  
Ele complementa o [GITFLOW.md](../GITFLOW.md): lá estão as **regras do time**; aqui está o **como fazer**, com explicação de cada comando.

> **Padrão deste projeto:** branches no estilo Gitflow · commits no estilo **Conventional Commits (semantic commits)** · **mensagens sempre em inglês**.

---

## Índice

1. [Ideias básicas (sem jargão)](#1-ideias-básicas-sem-jargão)
2. [O mapa das branches (Gitflow)](#2-o-mapa-das-branches-gitflow)
3. [Antes de tudo: conferir onde você está](#3-antes-de-tudo-conferir-onde-você-está)
4. [Puxar o código atualizado da `develop`](#4-puxar-o-código-atualizado-da-develop)
5. [Criar uma nova branch](#5-criar-uma-nova-branch)
6. [Semantic commits (Conventional Commits)](#6-semantic-commits-conventional-commits)
7. [Como fazer um commit (do zero ao push)](#7-como-fazer-um-commit-do-zero-ao-push)
8. [Manter sua branch atualizada com a `develop`](#8-manter-sua-branch-atualizada-com-a-develop)
9. [Abrir o Pull Request](#9-abrir-o-pull-request)
10. [Depois do merge: limpar a casa](#10-depois-do-merge-limpar-a-casa)
11. [Hotfix (só em emergência)](#11-hotfix-só-em-emergência)
12. [Erros comuns e o que fazer](#12-erros-comuns-e-o-que-fazer)
13. [Cheatsheet (cola rápida)](#13-cheatsheet-cola-rápida)

---

## 1. Ideias básicas (sem jargão)

Pense no Git como um **histórico de fotos** do projeto:

| Conceito | Analogia simples |
|----------|------------------|
| **Repositório** | A pasta do projeto com o histórico completo |
| **Branch** | Uma linha do tempo **paralela** (você mexe sem alterar a linha principal) |
| **Commit** | Uma “foto” do código + uma mensagem explicando o que mudou |
| **Remote (`origin`)** | A cópia no GitHub (ou similar), compartilhada com o time |
| **Push** | Enviar suas fotos locais para o remoto |
| **Pull / fetch** | Trazer o que o time já enviou para a sua máquina |
| **Pull Request (PR)** | Pedido formal: “por favor, revisem e juntem minha branch na `develop`” |
| **Merge** | Juntar o histórico de uma branch em outra |

**Regra de ouro deste projeto:** você **não** comita direto em `main` nem em `develop`.  
Você cria uma branch sua → comita nela → abre um PR.

---

## 2. O mapa das branches (Gitflow)

Resumo do que está no [GITFLOW.md](../GITFLOW.md):

| Branch | Para que serve | Você comita nela? |
|--------|----------------|-------------------|
| `main` | Código estável / produção | **Não** (exceto fluxo de hotfix via PR) |
| `develop` | Integração do dia a dia | **Não** — só via PR |
| `feat/...` ou `feature/...` | Nova funcionalidade | **Sim** |
| `fix/...` | Correção de bug (não urgente) | **Sim** |
| `chore/...` | Infra, tooling, dependências | **Sim** |
| `docs/...` | Só documentação | **Sim** |
| `hotfix/...` | Bug urgente já em produção | **Sim** (parte da `main`) |

Fluxo mental:

```text
main  (produção)  ◄── só código já revisado
  │
  └── develop  (integração)  ◄── destino dos seus PRs
         ▲
         │  Pull Request
         │
    feat/minha-tarefa   ← você trabalha aqui
```

---

## 3. Antes de tudo: conferir onde você está

Abra o terminal **dentro da pasta do projeto** e rode:

```bash
git status
```

Você verá algo como:

- `On branch develop` → você está na `develop`
- `On branch feat/algo` → você já está numa branch de trabalho
- `nothing to commit, working tree clean` → não há alterações pendentes
- lista de arquivos em vermelho/verde → há mudanças ainda não commitadas

Também é útil:

```bash
git branch
```

A branch com `*` é a atual.

```bash
git remote -v
```

Confirma que o remoto se chama `origin` (padrão neste tipo de projeto).

---

## 4. Puxar o código atualizado da `develop`

Sempre que for **começar uma tarefa nova**, comece atualizando a `develop`.  
Assim sua branch nasce do código mais recente do time.

### Passo a passo (com explicação)

**1) Ir para a branch `develop`**

```bash
git checkout develop
```

(ou, em Git mais novo: `git switch develop`)

**2) Baixar e aplicar o que está no remoto**

```bash
git pull origin develop
```

O que esse comando faz:

1. conversa com o GitHub (`origin`);
2. pega os commits novos da `develop` remota;
3. junta esses commits na sua `develop` local.

Se aparecer `Already up to date.`, você já estava atualizado — ótimo.

### Alternativa em dois passos (mais explícita)

```bash
git fetch origin
git merge origin/develop
```

- `fetch` = só **baixa** as informações (não altera seus arquivos ainda);
- `merge origin/develop` = **aplica** esses commits na branch em que você está.

Para o dia a dia, `git pull origin develop` (estando em `develop`) é suficiente.

### Quando fazer isso?

- Antes de criar uma branch nova
- No começo do dia de trabalho
- Antes de abrir um PR (junto com atualizar a **sua** branch — ver seção 8)

---

## 5. Criar uma nova branch

### 5.1 Nomes permitidos (padrão do projeto)

Formato:

```text
prefixo/descricao-curta-em-kebab-case
```

| Prefixo | Quando usar | Exemplo |
|---------|-------------|---------|
| `feat/` ou `feature/` | Nova funcionalidade | `feat/register-user` |
| `fix/` | Correção de bug | `fix/login-token-expired` |
| `chore/` | Ferramentas, deps, CI | `chore/add-vitest` |
| `docs/` | Só docs | `docs/git-commit-guide` |
| `hotfix/` | Urgente em produção | `hotfix/auth-500` |

**Bom:** `feat/identity-domain-user`  
**Ruim:** `teste`, `wip`, `minha-branch`, `asdf`

Dicas de nome:

- inglês ou kebab-case legível;
- uma intenção só (não misture “login + docs + refatoração”);
- curto, mas específico.

### 5.2 Criar a branch a partir da `develop` atualizada

```bash
# 1) já estar na develop atualizada (seção 4)
git checkout develop
git pull origin develop

# 2) criar e já entrar na branch nova
git checkout -b feat/nome-da-tarefa
```

O `-b` significa: **criar** a branch e **mudar** para ela.

Equivalente moderno:

```bash
git switch -c feat/nome-da-tarefa
```

### 5.3 Confirmar

```bash
git status
```

Deve mostrar `On branch feat/nome-da-tarefa`.

---

## 6. Semantic commits (Conventional Commits)

Neste projeto usamos **Conventional Commits** (também chamados de semantic commits):  
a mensagem começa com um **tipo**, depois a descrição do que mudou.

### 6.1 Formato obrigatório

```text
tipo: descrição curta em inglês
```

Exemplos reais:

```text
feat: add User entity
fix: prevent duplicate email on signup
chore: add vitest
docs: explain gitflow for juniors
```

Regras da descrição:

1. **Em inglês**
2. **Modo imperativo** (como uma ordem): `add`, `fix`, `update`, `remove` — não `added` / `adds`
3. **Sem ponto final**
4. **Curta** (idealmente até ~72 caracteres na primeira linha)
5. Foca no **porquê / o que mudou para o projeto**, não numa lista de arquivos

### 6.2 Tipos mais usados

| Tipo | Significado | Quando usar |
|------|-------------|-------------|
| `feat` | Feature | Nova funcionalidade visível ou de domínio |
| `fix` | Bug fix | Corrige comportamento errado |
| `docs` | Documentation | Só README, guias, comentários de docs |
| `chore` | Manutenção | Dependências, scripts, configs sem feature |
| `refactor` | Refatoração | Melhora código sem mudar comportamento |
| `test` | Testes | Adiciona ou ajusta testes |
| `style` | Estilo | Formatação (espaços, lint) sem lógica |
| `perf` | Performance | Melhoria de desempenho |
| `ci` | CI/CD | Pipelines, GitHub Actions, etc. |
| `build` | Build | Empacotamento, bundler, toolchain de build |

### 6.3 Escopo opcional (avançado, mas permitido)

Você pode detalhar a área entre parênteses:

```text
feat(auth): issue JWT after access code validation
fix(api): return 409 when email already exists
chore(deps): bump prisma to latest patch
```

Use escopo só quando ajudar o time a achar o contexto rápido.

### 6.4 Corpo da mensagem (opcional)

Para commits que precisam de contexto:

```bash
git commit -m "$(cat <<'EOF'
feat: add register user endpoint

Persist Usuario with default role USUARIO and validate unique email.
EOF
)"
```

- **Primeira linha:** resumo (obrigatória, no padrão `tipo: ...`)
- **Linha em branco**
- **Corpo:** detalhes em inglês, se necessário

### 6.5 Exemplos bons vs ruins

| Ruim | Por quê | Bom |
|------|---------|-----|
| `ajuste` | Vago, sem tipo, não é inglês | `fix: correct user role default` |
| `WIP` | Não descreve nada | `feat: scaffold register user use case` |
| `feat: added users` | Tempo verbal errado (`added`) | `feat: add user registration` |
| `Feat: Add User.` | Maiúscula no tipo + ponto final | `feat: add User entity` |
| `update stuff` | Sem tipo e sem clareza | `chore: configure eslint for api` |
| `corrigi o bug do login` | Português + sem tipo | `fix: prevent expired token on login` |

### 6.6 Uma intenção por commit

Prefira **vários commits pequenos** a um commit gigante:

- `feat: add User entity`
- `feat: add register user use case`
- `feat: expose POST /users route`

Em vez de um único:

- `feat: add everything about users` ← difícil de revisar e de reverter

---

## 7. Como fazer um commit (do zero ao push)

Fluxo completo na sua branch de feature:

### 7.1 Ver o que mudou

```bash
git status
git diff
```

- `status` → quais arquivos mudaram
- `diff` → o conteúdo das mudanças ainda não adicionadas ao stage

### 7.2 Escolher o que entra no commit (stage)

Adicionar **tudo** que mudou (cuidado — não inclua `.env` nem secrets):

```bash
git add .
```

Ou adicionar arquivo por arquivo (mais seguro no começo):

```bash
git add apps/api/src/caminho/arquivo.ts
```

Conferir o que está preparado para o commit:

```bash
git status
```

Arquivos no stage aparecem como *staged* / em verde (conforme o terminal).

**Nunca** comite:

- `.env`, chaves, tokens, senhas
- arquivos gerados que o time ignora (se estiverem no `.gitignore`, o Git já bloqueia)

### 7.3 Criar o commit

```bash
git commit -m "feat: add User entity"
```

Se o Git reclamar de nome/e-mail não configurados, peça ajuda ao time **antes** de alterar configurações globais por conta própria — neste projeto o ideal é cada pessoa já ter `user.name` e `user.email` configurados na máquina.

### 7.4 Enviar a branch para o remoto (primeira vez)

```bash
git push -u origin feat/nome-da-tarefa
```

- `push` = envia seus commits
- `-u origin feat/nome-da-tarefa` = liga sua branch local à remota (nas próximas vezes basta `git push`)

Nas próximas vezes, estando na mesma branch:

```bash
git push
```

### 7.5 Ciclo típico enquanto desenvolve

```text
editar código → git add → git commit → (repetir) → git push
```

Não precisa (e não deve) esperar “terminar tudo” para o primeiro commit. Commits frequentes salvam progresso e facilitam review.

---

## 8. Manter sua branch atualizada com a `develop`

Enquanto você trabalha, outras pessoas fazem merge na `develop`.  
Antes do PR (e de tempos em tempos), traga essas mudanças para a **sua** branch.

### Método recomendado para iniciantes: merge

```bash
# 1) estar na sua branch
git checkout feat/nome-da-tarefa

# 2) baixar novidades do remoto
git fetch origin

# 3) juntar a develop remota na sua branch
git merge origin/develop
```

Se **não** houver conflito:

```text
Merge made by the 'ort' strategy.
```

(ou mensagem similar) → depois:

```bash
git push
```

### Se aparecer conflito

O Git vai marcar arquivos com trechos assim:

```text
<<<<<<< HEAD
seu código
=======
código que veio da develop
>>>>>>> origin/develop
```

O que fazer:

1. Abra cada arquivo listado em conflito
2. Decida o código final correto (remova os marcadores `<<<<<<<`, `=======`, `>>>>>>>`)
3. Salve
4. Marque como resolvido e conclua o merge:

```bash
git add caminho/do/arquivo-resolvido.ts
git commit -m "merge: integrate origin/develop into feat/nome-da-tarefa"
git push
```

> Se o time preferir outra mensagem de merge, siga a convenção combinada. O importante é **não deixar o conflito pela metade**.

### Rebase (só se o time pedir)

```bash
git fetch origin
git rebase origin/develop
git push --force-with-lease
```

Iniciantes: **prefira merge**.  
Nunca use `git push --force` em `main` ou `develop`.  
Se precisar de force na **sua** branch, use apenas `--force-with-lease` e só após entender o que está reescrevendo.

---

## 9. Abrir o Pull Request

Depois de dar push na sua branch:

1. No GitHub, abra um **Pull Request**
2. **Base (destino):** `develop`
3. **Compare (origem):** `feat/nome-da-tarefa` (sua branch)
4. Título claro (pode seguir o mesmo espírito dos commits, em inglês ou alinhado ao time)
5. Na descrição, explique:
   - o que mudou e **por quê**
   - como testar
6. Peça review se o time exigir
7. Só faça merge depois da revisão acordada

Checklist rápido (também no GITFLOW):

- [ ] Branch criada a partir de `develop` atualizada
- [ ] Só o que pertence à tarefa
- [ ] Sem secrets / `.env`
- [ ] Commits em inglês no padrão `tipo: descrição`
- [ ] Branch atualizada com `origin/develop` se necessário
- [ ] PR apontando para `develop` (exceto hotfix)

---

## 10. Depois do merge: limpar a casa

Quando o PR for mergeado:

```bash
git checkout develop
git pull origin develop
git branch -d feat/nome-da-tarefa
```

- `pull` traz o merge para sua `develop` local
- `branch -d` apaga a branch **local** (já integrada)

No GitHub, a branch remota costuma poder ser apagada na interface do PR.

---

## 11. Hotfix (só em emergência)

Use quando o bug **já está em produção (`main`)** e não pode esperar o ciclo normal.

```bash
git checkout main
git pull origin main
git checkout -b hotfix/descricao-curta
# corrija
git add .
git commit -m "fix: restore auth when token is missing"
git push -u origin hotfix/descricao-curta
```

- Abra PR para **`main`**
- Depois do merge, **integre a mesma correção em `develop`** (outro PR ou cherry-pick), para o bug não voltar

Detalhes extras: [GITFLOW.md](../GITFLOW.md).

---

## 12. Erros comuns e o que fazer

| Situação | O que fazer |
|----------|-------------|
| Começou a editar ainda na `develop` | Pare. Crie a branch agora (`git checkout -b feat/...`). Os arquivos modificados costumam “ir junto” para a branch nova se ainda não foram commitados |
| Commitou na `develop` / `main` por engano | Não continue. Avise o time; em geral cria-se uma branch a partir desse commit e abre-se PR — não force push nas branches protegidas |
| Esqueceu um arquivo no último commit (ainda não deu push, e o commit é seu) | Peça orientação do time antes de `commit --amend`; se não tiver certeza, faça um commit novo |
| Mensagem em português | Faça o próximo commit já em inglês no padrão semantic; se o time pedir, ajuste a mensagem antes do merge |
| Conflito assustador | Peça ajuda cedo; não delete arquivos “no chute” |
| Incluiu `.env` | Tire do stage (`git restore --staged .env`), confirme `.gitignore`, e se já foi commitado avise o time imediatamente |
| Branch muito atrasada | `git fetch` + `git merge origin/develop` antes do PR |
| PR enorme com várias features | Divida em branches/PRs menores |

---

## 13. Cheatsheet (cola rápida)

### Começar tarefa

```bash
git checkout develop
git pull origin develop
git checkout -b feat/nome-da-tarefa
```

### Commitar

```bash
git status
git add .
git commit -m "feat: add short description in english"
git push -u origin feat/nome-da-tarefa   # primeira vez
git push                                 # demais vezes
```

### Atualizar a branch com a develop

```bash
git checkout feat/nome-da-tarefa
git fetch origin
git merge origin/develop
git push
```

### Encerrar após merge do PR

```bash
git checkout develop
git pull origin develop
git branch -d feat/nome-da-tarefa
```

### Lembretes finais

1. Features nascem da **`develop`**
2. Commits: **`tipo: description in english`**
3. Destino do PR: **`develop`** (hotfix → `main`, e depois volta para `develop`)
4. Na dúvida, leia de novo o [GITFLOW.md](../GITFLOW.md) ou pergunte ao time **antes** de force push

---

## Resumo em uma frase

> Atualize a `develop` → crie `feat/sua-tarefa` → faça commits pequenos em inglês no padrão Conventional Commits → atualize com `origin/develop` se precisar → abra PR para `develop`.
