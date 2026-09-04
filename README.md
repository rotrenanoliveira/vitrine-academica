# Vitrine Acadêmica

Checklist de implementação.

## Passo 0 — Fundação

- [ ] - Deve ser persistida a entidade `Usuario` com papéis `USUARIO`, `ALUNO`, `PROFESSOR`, `SECRETARIA` e `ADMINISTRADOR`
- [ ] - Deve ser persistida a entidade `CodigoAcesso` com hash, expiração e consumo único
- [ ] - Deve ser persistida a entidade `Tag` com nome, slug e status ativo
- [ ] - Deve ser persistida a entidade `Arquivo` com metadados no Cloudflare R2
- [ ] - Deve ser persistida a entidade `LogAuditoria` de forma imutável
- [ ] - Deve ser possível cadastrar um usuário (inicia como `USUARIO`)
- [ ] - Deve ser possível solicitar um código de acesso por e-mail
- [ ] - Deve ser possível autenticar com código e emitir JWT
- [ ] - Deve ser possível registrar o consentimento LGPD
- [ ] - Deve ser possível consultar o próprio perfil
- [ ] - Deve ser possível atualizar o próprio perfil
- [ ] - Deve ser possível enviar um arquivo para o R2
- [ ] - Deve ser possível definir a foto de perfil
- [ ] - Deve ser possível cadastrar uma tag (administrador)
- [ ] - Deve ser possível ativar ou desativar uma tag (administrador)
- [ ] - Deve ser possível listar as tags ativas
- [ ] - Deve ser possível registrar log de auditoria em mutações e jobs
