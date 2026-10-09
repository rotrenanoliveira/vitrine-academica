## 1. Identificação

- **Aluno(s):** [Nome completo - RA] (um por linha, se for grupo)
- **Projeto (PFC):** [Nome do projeto]
- **Branch:** feat/testes-automatizados

## 2. Resumo da entrega

Os testes unitários e de integração da API **já haviam sido implementados durante o desenvolvimento das funcionalidades** do PFC (Vitrine Acadêmica), foi realizada apenas modificação em 3 testes para que esteja dentro dos requisitos solicitados. Os testes cobrem identity, institutions, projects, tags, storage e audit tanto em casos de uso (com testes `.spec.ts`) quanto rotas (`.test.ts`).

## 3. Cenários de testes unitários implementados


| #   | Classe testada                     | Método / regra | Cenário                                                                        | Tipo     | Arquivo de teste                       | Método de teste                                                                        |
| --- | ---------------------------------- | -------------- | ------------------------------------------------------------------------------ | -------- | -------------------------------------- | -------------------------------------------------------------------------------------- |
| 1   | DeleteUserAccountUseCase           | execute()      | Anonimiza usuário e marca conta como deletada                                  | Feliz    | delete-user-account.spec.ts            | should anonymize the user and mark the account as deleted                              |
| 2   | DeleteUserAccountUseCase           | execute()      | Bloqueia exclusão quando usuário é o único gerente com outros membros          | Violação | delete-user-account.spec.ts            | should not be able to delete when user is the only manager and there are other members |
| 3   | DeleteUserAccountUseCase           | execute()      | Não tenta apagar avatar quando a conta não tem avatar (`not.toHaveBeenCalled`) | Limite   | delete-user-account.spec.ts            | should not try to delete an avatar when the account has none                           |
| 4   | DeleteUserAccountUseCase           | execute()      | Apaga arquivo de avatar e limpa da conta (`toHaveBeenCalledWith`)              | Feliz    | delete-user-account.spec.ts            | should delete the avatar file and clear it from the account                            |
| 5   | ScheduleProjectUseCase             | execute()      | Agenda publicação de projeto rascunho                                          | Feliz    | schedule-project.spec.ts               | should able to schedule a project                                                      |
| 6   | ScheduleProjectUseCase             | execute()      | Bloqueia agendamento por não-autor (tipo + mensagem)                           | Violação | schedule-project.spec.ts               | should not be able to schedule a project as non-owner                                  |
| 7   | ScheduleProjectUseCase             | execute()      | Bloqueia agendamento de projeto já agendado                                    | Limite   | schedule-project.spec.ts               | should not be able to schedule a project that is already scheduled                     |
| 8   | UpdateInstitutionMemberRoleUseCase | execute()      | Promove membro a gerente                                                       | Feliz    | update-institution-member-role.spec.ts | should be able to promote a member to manager                                          |
| 9   | UpdateInstitutionMemberRoleUseCase | execute()      | Impede rebaixar o único gerente ativo                                          | Violação | update-institution-member-role.spec.ts | should not be able to demote the only active manager of the institution                |
| 10  | UpdateInstitutionMemberRoleUseCase | execute()      | Gerente inativo não conta como gerente ativo na demoção                        | Limite   | update-institution-member-role.spec.ts | should not count an inactive manager as an active manager when demoting                |
| 11  | LogoutUseCase                      | execute()      | Revoga a sessão com sucesso                                                    | Feliz    | logout.spec.ts                         | should be able to logout by revoking the session                                       |
| 12  | LogoutUseCase                      | execute()      | Sessão inexistente (tipo + mensagem)                                           | Violação | logout.spec.ts                         | should not be able to logout when session does not exist                               |
| 13  | LogoutUseCase                      | execute()      | Sessão já revogada (tipo + mensagem)                                           | Limite   | logout.spec.ts                         | should not be able to logout when session is already revoked                           |
| 14  | UploadAttachmentUseCase            | execute()      | Salva anexo e retorna URL assinada                                             | Feliz    | upload-attachment.spec.ts              | should be able to save an attachment and return the signed url                         |
| 15  | UploadAttachmentUseCase            | execute()      | Rejeita size 0 / size > 5MB / MIME gif (`it.each`, tipo + mensagem)            | Violação | upload-attachment.spec.ts              | should not be able to save an attachment with $scenario                                |
| 16  | UploadAttachmentUseCase            | execute()      | Normaliza nome do arquivo na chave de storage                                  | Limite   | upload-attachment.spec.ts              | should be able to normalize attachment name                                            |
| 17  | SearchExternalProjectsUseCase      | execute()      | Pesquisa projetos externos (spy `toHaveBeenCalledWith`)                        | Feliz    | search-external-projects.spec.ts       | Pesquisa por projetos externos                                                         |
| 18  | RegisterUserUseCase                | execute()      | Cadastra usuário novo                                                          | Feliz    | register-user.spec.ts                  | should be able to register a new user                                                  |
| 19  | RegisterUserUseCase                | execute()      | E-mail já existente                                                            | Violação | register-user.spec.ts                  | should not be able to register a new user with same email                              |
| 20  | AuthenticateWithAccessCodeUseCase  | execute()      | Autentica com código válido                                                    | Feliz    | authenticate-with-access-code.spec.ts  | should be able to authenticate with a valid access code and create a session           |


Tipo: Feliz | Violação | Limite
**Total de cenários unitários:** 165 (amostra acima evidencia os mínimos do enunciado; a suíte completa está nos 48 arquivos `*.spec.ts` da seção 5)

## 4. Cenários de testes de integração implementados


| #   | Camadas envolvidas         | Cenário                                                              | Arquivo de teste                      | Método de teste                                                     | Recurso usado                  |
| --- | -------------------------- | -------------------------------------------------------------------- | ------------------------------------- | ------------------------------------------------------------------- | ------------------------------ |
| 1   | Route + UseCase + Postgres | POST /api/v1/users retorna 201 e corpo do usuário                    | register-user.test.ts                 | should be able to register a new user                               | Supertest + Fastify + Postgres |
| 2   | Route + UseCase + Postgres | POST /api/v1/auth/sessions retorna 201 com token                     | authenticate-with-access-code.test.ts | should be able to authenticate with a valid access code             | Supertest + Fastify + Postgres |
| 3   | Route + UseCase + Postgres | POST /api/v1/auth/sessions com código inválido retorna 400 + message | authenticate-with-access-code.test.ts | should not be able to authenticate with an invalid access code      | Supertest + Fastify + Postgres |
| 4   | Route + UseCase + Postgres | POST /api/v1/auth/sessions usuário inexistente retorna 404 + message | authenticate-with-access-code.test.ts | should not be able to authenticate when user does not exist         | Supertest + Fastify + Postgres |
| 5   | Route + UseCase + Postgres | Fluxo: autentica, cria projeto e consulta por id (rascunho do dono)  | get-project-by-id.test.ts             | deve permitir o dono ver um rascunho                                | Supertest + Fastify + Postgres |
| 6   | Route + UseCase + Postgres | DELETE conta autenticada (anonimização persistida)                   | delete-user-account.test.ts           | should be able to delete (anonymize) the authenticated user account | Supertest + Fastify + Postgres |
| 7   | Route + UseCase + Postgres | DELETE conta sem autenticação retorna 401                            | delete-user-account.test.ts           | should not be able to delete the account without authentication     | Supertest + Fastify + Postgres |
| 8   | Route + UseCase + Postgres | Persistência: registra projeto autenticado e valida resposta         | register-project.test.ts              | deve ser possivel registrar um projeto autenticado                  | Supertest + Fastify + Postgres |


**Total de cenários de integração:** 114 (amostra acima cobre feliz, 4xx, persistência e fluxo completo; a suíte completa está nos 43 arquivos `*.test.ts` da seção 5)

## 5. Arquivos de teste criados ou alterados


| Arquivo (caminho completo)                                                                                                          | Criado / Alterado | Qtd. de testes |
| ----------------------------------------------------------------------------------------------------------------------------------- | ----------------- | -------------- |
| apps/api/src/core/entities/unique-entity-id.spec.ts                                                                                 | Criado            | 1              |
| apps/api/src/domain/audit/application/use-cases/audit/fetch-logs-by-actor-id.spec.ts                                                | Criado            | 2              |
| apps/api/src/domain/audit/application/use-cases/audit/fetch-logs-by-resource.spec.ts                                                | Criado            | 2              |
| apps/api/src/domain/audit/application/use-cases/audit/fetch-logs-by-session-id.spec.ts                                              | Criado            | 2              |
| apps/api/src/domain/audit/application/use-cases/audit/fetch-logs.spec.ts                                                            | Criado            | 2              |
| apps/api/src/domain/audit/application/use-cases/audit/register-log.spec.ts                                                          | Criado            | 1              |
| apps/api/src/domain/identity/application/use-cases/auth/authenticate-with-access-code.spec.ts                                       | Criado            | 7              |
| apps/api/src/domain/identity/application/use-cases/auth/logout.spec.ts                                                              | Alterado          | 4              |
| apps/api/src/domain/identity/application/use-cases/auth/request-access-code.spec.ts                                                 | Criado            | 6              |
| apps/api/src/domain/identity/application/use-cases/user/delete-user-account.spec.ts                                                 | Criado            | 12             |
| apps/api/src/domain/identity/application/use-cases/user/export-user-data.spec.ts                                                    | Criado            | 3              |
| apps/api/src/domain/identity/application/use-cases/user/find-user-by-id.spec.ts                                                     | Criado            | 3              |
| apps/api/src/domain/identity/application/use-cases/user/register-user.spec.ts                                                       | Criado            | 5              |
| apps/api/src/domain/institution/application/use-cases/institution/edit-institution.spec.ts                                          | Criado            | 4              |
| apps/api/src/domain/institution/application/use-cases/institution/fetch-institutions.spec.ts                                        | Criado            | 2              |
| apps/api/src/domain/institution/application/use-cases/institution/get-institution-by-id.spec.ts                                     | Criado            | 2              |
| apps/api/src/domain/institution/application/use-cases/institution/get-institution-by-slug.spec.ts                                   | Criado            | 2              |
| apps/api/src/domain/institution/application/use-cases/institution/register-institution.spec.ts                                      | Criado            | 3              |
| apps/api/src/domain/institution/application/use-cases/institution/update-institution-status.spec.ts                                 | Criado            | 4              |
| apps/api/src/domain/institution/application/use-cases/institution-member/create-institution-member.spec.ts                          | Criado            | 5              |
| apps/api/src/domain/institution/application/use-cases/institution-member/fetch-institution-members.spec.ts                          | Criado            | 3              |
| apps/api/src/domain/institution/application/use-cases/institution-member/fetch-my-institution-memberships.spec.ts                   | Criado            | 2              |
| apps/api/src/domain/institution/application/use-cases/institution-member/get-institution-member-by-id.spec.ts                       | Criado            | 3              |
| apps/api/src/domain/institution/application/use-cases/institution-member/update-institution-member-role.spec.ts                     | Criado            | 7              |
| apps/api/src/domain/institution/application/use-cases/institution-member/update-institution-member-status.spec.ts                   | Criado            | 4              |
| apps/api/src/domain/institution/application/use-cases/institution-membership-request/approve-institution-membership-request.spec.ts | Criado            | 4              |
| apps/api/src/domain/institution/application/use-cases/institution-membership-request/fetch-institution-membership-requests.spec.ts  | Criado            | 3              |
| apps/api/src/domain/institution/application/use-cases/institution-membership-request/reject-institution-membership-request.spec.ts  | Criado            | 4              |
| apps/api/src/domain/institution/application/use-cases/institution-membership-request/request-institution-membership.spec.ts         | Criado            | 7              |
| apps/api/src/domain/project/application/use-cases/fetch-published-projects-today.spec.ts                                            | Criado            | 1              |
| apps/api/src/domain/project/application/use-cases/fetch-published-projects.spec.ts                                                  | Criado            | 1              |
| apps/api/src/domain/project/application/use-cases/project/fetch-my-projects.spec.ts                                                 | Criado            | 2              |
| apps/api/src/domain/project/application/use-cases/project/get-project-by-id.spec.ts                                                 | Criado            | 4              |
| apps/api/src/domain/project/application/use-cases/project/register-project.spec.ts                                                  | Criado            | 2              |
| apps/api/src/domain/project/application/use-cases/project/search-external-projects.spec.ts                                          | Criado            | 3              |
| apps/api/src/domain/project/application/use-cases/project/update-project.spec.ts                                                    | Criado            | 6              |
| apps/api/src/domain/project/application/use-cases/project-tag/fetch-projects-by-tag.spec.ts                                         | Criado            | 2              |
| apps/api/src/domain/project/application/use-cases/project-tag/fetch-projects-of-interest.spec.ts                                    | Criado            | 3              |
| apps/api/src/domain/project/application/use-cases/project-tag/register-project-tag.spec.ts                                          | Criado            | 5              |
| apps/api/src/domain/project/application/use-cases/scheduled-project/publish-scheduled-projects.spec.ts                              | Criado            | 1              |
| apps/api/src/domain/project/application/use-cases/scheduled-project/schedule-project.spec.ts                                        | Alterado          | 6              |
| apps/api/src/domain/storage/application/use-cases/delete-attachment.spec.ts                                                         | Criado            | 2              |
| apps/api/src/domain/storage/application/use-cases/get-attachment.spec.ts                                                            | Criado            | 2              |
| apps/api/src/domain/storage/application/use-cases/upload-attachment.spec.ts                                                         | Alterado          | 5              |
| apps/api/src/domain/tag/application/use-cases/preference-tag/fetch-user-preference-tags.spec.ts                                     | Criado            | 2              |
| apps/api/src/domain/tag/application/use-cases/preference-tag/register-preference-tag.spec.ts                                        | Criado            | 5              |
| apps/api/src/domain/tag/application/use-cases/tag/fetch-tags.spec.ts                                                                | Criado            | 2              |
| apps/api/src/domain/tag/application/use-cases/tag/register-tag.spec.ts                                                              | Criado            | 2              |
| apps/api/src/infra/http/routes/attachments/delete-attachment.test.ts                                                                | Criado            | 1              |
| apps/api/src/infra/http/routes/attachments/get-attachment.test.ts                                                                   | Criado            | 1              |
| apps/api/src/infra/http/routes/attachments/upload-attachment.test.ts                                                                | Criado            | 1              |
| apps/api/src/infra/http/routes/auth/authenticate-with-access-code.test.ts                                                           | Criado            | 4              |
| apps/api/src/infra/http/routes/auth/get-me.test.ts                                                                                  | Criado            | 3              |
| apps/api/src/infra/http/routes/auth/logout.test.ts                                                                                  | Criado            | 3              |
| apps/api/src/infra/http/routes/auth/request-access-code.test.ts                                                                     | Criado            | 3              |
| apps/api/src/infra/http/routes/institutions/edit-institution.test.ts                                                                | Criado            | 3              |
| apps/api/src/infra/http/routes/institutions/fetch-institutions.test.ts                                                              | Criado            | 2              |
| apps/api/src/infra/http/routes/institutions/get-institution-by-id.test.ts                                                           | Criado            | 2              |
| apps/api/src/infra/http/routes/institutions/get-institution-by-slug.test.ts                                                         | Criado            | 2              |
| apps/api/src/infra/http/routes/institutions/register-institution.test.ts                                                            | Criado            | 3              |
| apps/api/src/infra/http/routes/institutions/update-institution-status.test.ts                                                       | Criado            | 3              |
| apps/api/src/infra/http/routes/institutions-membership/approve-institution-membership-request.test.ts                               | Criado            | 3              |
| apps/api/src/infra/http/routes/institutions-membership/create-institution-member.test.ts                                            | Criado            | 4              |
| apps/api/src/infra/http/routes/institutions-membership/fetch-institution-members.test.ts                                            | Criado            | 2              |
| apps/api/src/infra/http/routes/institutions-membership/fetch-institution-membership-requests.test.ts                                | Criado            | 2              |
| apps/api/src/infra/http/routes/institutions-membership/fetch-my-institution-memberships.test.ts                                     | Criado            | 3              |
| apps/api/src/infra/http/routes/institutions-membership/get-institution-member-by-id.test.ts                                         | Criado            | 3              |
| apps/api/src/infra/http/routes/institutions-membership/reject-institution-membership-request.test.ts                                | Criado            | 2              |
| apps/api/src/infra/http/routes/institutions-membership/request-institution-membership.test.ts                                       | Criado            | 5              |
| apps/api/src/infra/http/routes/institutions-membership/update-institution-member-role.test.ts                                       | Alterado          | 5              |
| apps/api/src/infra/http/routes/institutions-membership/update-institution-member-status.test.ts                                     | Criado            | 3              |
| apps/api/src/infra/http/routes/preference-tags/fetch-user-preference-tags.test.ts                                                   | Criado            | 2              |
| apps/api/src/infra/http/routes/preference-tags/register-preference-tag.test.ts                                                      | Criado            | 4              |
| apps/api/src/infra/http/routes/projects/fetch-my-projects.test.ts                                                                   | Criado            | 2              |
| apps/api/src/infra/http/routes/projects/fetch-projects-of-interest.test.ts                                                          | Criado            | 2              |
| apps/api/src/infra/http/routes/projects/fetch-published-projects-today.test.ts                                                      | Criado            | 1              |
| apps/api/src/infra/http/routes/projects/fetch-published-projects.test.ts                                                            | Criado            | 1              |
| apps/api/src/infra/http/routes/projects/get-project-by-id.test.ts                                                                   | Criado            | 4              |
| apps/api/src/infra/http/routes/projects/publish-scheduled-projects.test.ts                                                          | Criado            | 1              |
| apps/api/src/infra/http/routes/projects/register-project-tag.test.ts                                                                | Criado            | 4              |
| apps/api/src/infra/http/routes/projects/register-project.test.ts                                                                    | Criado            | 2              |
| apps/api/src/infra/http/routes/projects/schedule-project.test.ts                                                                    | Criado            | 5              |
| apps/api/src/infra/http/routes/projects/search-external-projects.test.ts                                                            | Criado            | 5              |
| apps/api/src/infra/http/routes/projects/update-project.test.ts                                                                      | Criado            | 4              |
| apps/api/src/infra/http/routes/tags/fetch-projects-by-tag.test.ts                                                                   | Criado            | 2              |
| apps/api/src/infra/http/routes/tags/fetch-tags.test.ts                                                                              | Criado            | 1              |
| apps/api/src/infra/http/routes/tags/register-tag.test.ts                                                                            | Criado            | 2              |
| apps/api/src/infra/http/routes/users/delete-user-account.test.ts                                                                    | Criado            | 5              |
| apps/api/src/infra/http/routes/users/export-user-data.test.ts                                                                       | Criado            | 2              |
| apps/api/src/infra/http/routes/users/find-user-by-id.test.ts                                                                        | Criado            | 1              |
| apps/api/src/infra/http/routes/users/register-user.test.ts                                                                          | Criado            | 1              |




**Total de arquivos de teste:** 91  |  **Total de testes:** 279

## 6. Como executar os testes

```
docker compose up -d

cd apps/api

pnpm test:unit:run
pnpm test:e2e:run
```



## 7. Evidências

- **Resultado da execução:** UNIT
```bash
   Test Files  49 passed (49)
   Tests  167 passed (167)
   Start at  20:16:53
   Duration  23.14s (import 90%, transform 7%, tests 2%, worker 1%)
```
- **Resultado da execução:** E2E
```bash
   Test Files  43 passed (43)
   Tests  114 passed (114)
   Start at  20:23:59
   Duration  89.70s (import 54%, tests 44%, transform 1%)
```
- **Link do CI (se houver):** NA



## 8. Decisões e dificuldades

- **O que foi mockado e por quê:** O serviço de teste unitário e a API OpenAlex foi mockada para que os testes sejam feitos ponta a ponta de forma confiável, sem depender de conexão com internet, indisponibilidade de serviços de terceiros ou chave de API.
- **Bugs encontrados pelos testes (se houver):** Bug de conexão/tratamento de falha na API, identificado e corrigido durante a execução da suíte de testes de integração, a estrutura de erro com left foi colocada no Caso de Uso, mas havia sido esquecida em um dos arquivos e a URL da API externa não estava correta ou padronizada em todas as chamadas necessárias.
- **Dificuldades:** Resolver avisos e erros de tipo que apareceram ao ligar o servidor de testes do MSW e garantir a separação das camadas do sistema, fazendo a regra de negócio usar uma interface simples em vez de chamar direto a classe da OpenAlex



## 9. Checklist de entrega

- [X] Todos os testes passam localmente com o comando da seção 6
- [X] Cada cenário listado nas seções 3 e 4 existe no código
- [X] Cada arquivo de teste alterado ou criado está listado na seção 5
- [X] Mínimos do exercício atendidos (10 unitários em 3 classes; 4 de integração)
- [X] Nenhum teste com @Disabled, sem asserção ou com Thread.sleep
- [ ] Professor adicionado como reviewer