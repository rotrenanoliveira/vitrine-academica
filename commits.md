# Plano de commits

> Commits **não realizados**. Apenas a lista de arquivos e mensagens sugeridas.

---

## Commit 1

**Mensagem:**
```
fix: seed admin with active status and account consent
```

**Arquivos:**
- `apps/api/src/infra/database/seed/new-seed.ts`

**Motivo:** usuários seedados passam a nascer `ACTIVE` e o admin recebe registro em `accounts` (consentimento/confirmação), evitando falhas de autenticação no ambiente local.

---

## Commit 2

**Mensagem:**
```
feat: replace call skill checkboxes with searchable combobox
```

**Arquivos:**
- `apps/web/src/components/call/form-call.tsx`

**Motivo:** seleção de habilidades do chamado via Combobox com busca e chips, mantendo campos opcionais de descrição por tag selecionada.

---

## Commit 3

**Mensagem:**
```
feat: replace project tag checkboxes with searchable combobox
```

**Arquivos:**
- `apps/web/src/components/project/form-relate-project-tags.tsx`

**Motivo:** seleção de tags do projeto via Combobox com busca e chips, alinhado ao formulário de chamado.

---

## Commit 4

**Mensagem:**
```
fix: translate teacher rating labels to portuguese
```

**Arquivos:**
- `apps/web/src/app/(app)/projetos/[slug]/page.tsx`
- `apps/web/src/components/project/project-teacher-votes-table.tsx`

**Motivo:** troca de rótulos em inglês (`Overall docente` / `Overall`) por equivalentes em português (`Notas professores` / `Média`).
