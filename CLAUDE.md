# Ateliê do Queijo — instruções para o Claude Code

Este repositório implementa o site **Ateliê do Queijo**, uma loja online de queijos finos com tema escuro, queijos em 3D, compra direta e atendimento por assistente e WhatsApp.

## Fonte da verdade

- **`ATELIE-DO-QUEIJO-SPEC.md`** descreve o produto com valores exatos (cores, tipografia, espaçamentos, textos, comportamento). Ele vence qualquer suposição. Lacunas entre colchetes, como `[PREÇO]`, devem continuar visíveis até o dono do projeto preenchê-las.
- **`docs/PLANO.md`** guarda o plano da etapa atual; **`docs/adr/`** guarda as decisões técnicas.

## Idioma

Converse, comente e documente em **português do Brasil**. Nomes de variáveis e funções podem ficar em português ou inglês, desde que consistentes dentro de cada arquivo.

## Equipe de agentes (`.claude/agents/`)

| Agente | Quando acionar |
| --- | --- |
| `arquiteto-de-software` | Início de cada etapa ou funcionalidade: plano, estrutura, contratos, ADRs, conflitos |
| `frontend-nextjs` | Implementar páginas, componentes, rotas e estado da interface |
| `guardiao-do-design` | Depois de cada tela ou componente: conferência de fidelidade com a spec |
| `especialista-3d-webgl` | Visualizador 3D, modelos GLB, realidade aumentada, fallback SVG |
| `engenheiro-de-ecommerce` | Preços, sacola, frete, Pix, checkout, gateways, webhooks, pedidos |
| `especialista-em-ia-conversacional` | Assistente do Ateliê, integração com IA, WhatsApp e horários |
| `especialista-em-acessibilidade` | Componentes interativos e antes de cada entrega (WCAG 2.2 AA) |
| `performance-e-seo` | Core Web Vitals, bundle, imagens, fontes, metadados, JSON-LD, sitemap |
| `testes-e-qualidade` | Depois de qualquer lógica ou fluxo: Vitest, Testing Library, Playwright, regressão visual |
| `revisor-de-codigo` | Ao fim de cada tarefa e antes de commit/PR (somente leitura) |
| `auditor-de-seguranca` | Checkout, pagamentos, formulários, IA, segredos, dependências e antes de produção (somente leitura) |
| `devops-e-deploy` | Ferramentas do repositório, CI no GitHub Actions, ambientes, monitoramento, publicação |
| `documentador-tecnico` | Fim de cada etapa: README, guia de conteúdo, variáveis de ambiente, changelog |

## Fluxo padrão de cada tarefa

1. **Planejar** com o `arquiteto-de-software` (tarefas pequenas, responsável e critério de pronto em `docs/PLANO.md`).
2. **Implementar** com o agente da área (`frontend-nextjs`, `engenheiro-de-ecommerce`, `especialista-3d-webgl`, `especialista-em-ia-conversacional`, `devops-e-deploy`).
3. **Verificar em paralelo**, quando fizer sentido: `testes-e-qualidade`, `guardiao-do-design`, `especialista-em-acessibilidade` e, se a tarefa tocar em dados sensíveis, `auditor-de-seguranca`.
4. **Corrigir** o que for apontado, com o agente que implementou.
5. **Revisar** o diff final com o `revisor-de-codigo`. Só seguir com veredito ✅ ou ⚠️ resolvido.
6. **Documentar** com o `documentador-tecnico` ao fechar a etapa.
7. **Commit e push** automáticos ao concluir uma grande alteração, seguindo a seção [Commits](#commits).

Subagentes não chamam outros subagentes: é a sessão principal que encadeia as etapas acima e repassa a cada agente o contexto de que ele precisa (tarefa, arquivos, trechos relevantes da spec).

## Ordem das etapas do projeto

Segue a seção 0 da spec:
1. Base do projeto e ferramentas (`devops-e-deploy` + `arquiteto-de-software`).
2. Tokens de design e componentes globais (`frontend-nextjs` + `guardiao-do-design`).
3. Home → Catálogo → Produto → painel de Atendimento.
4. Sacola, frete simulado e checkout simulado (`engenheiro-de-ecommerce`).
5. Visualizador 3D com fallback SVG (`especialista-3d-webgl`).
6. Assistente com roteiro determinístico e links do WhatsApp (`especialista-em-ia-conversacional`).
7. Páginas restantes (Presentes, Aprenda, Produtores, 404).
8. Rodada de qualidade: testes, acessibilidade, performance e SEO, segurança.
9. CI completo, ambientes e checklist de aceite da seção 14 da spec.

## Commits

Repositório remoto: **https://github.com/Pedrosjm12/Atelie-do-Queijo.git** (remoto `origin`).

### Quando commitar

Faça commit e push **automaticamente, sem esperar pedido**, sempre que uma grande alteração for concluída, por exemplo:
- fim de uma etapa da seção "Ordem das etapas do projeto";
- uma página, funcionalidade ou fluxo completo implementado;
- refatoração ampla, mudança de dependências ou de configuração do projeto;
- novo ADR ou atualização relevante de documentação.

Não commite alterações pequenas e soltas isoladamente: agrupe-as no próximo commit significativo.

### Antes de commitar

1. O passo **Revisar** do fluxo padrão deve ter veredito ✅ ou ⚠️ resolvido.
2. Lint, typecheck, testes e build devem estar passando. Se algo falhar, corrija antes; nunca commite código quebrado.
3. Confira com `git status` e `git diff --staged` que nenhum segredo (`.env`, chaves, tokens) ou arquivo gerado (`node_modules`, `.next`, builds) está sendo incluído.
4. Se o remoto `origin` não existir, configure-o com `git remote add origin https://github.com/Pedrosjm12/Atelie-do-Queijo.git`.

### Formato da mensagem

- Padrão **Conventional Commits**: `tipo(escopo): descrição`. Tipos: `feat`, `fix`, `refactor`, `style`, `test`, `docs`, `chore`, `build`, `ci`, `perf`.
- Descrição curta, no imperativo e em **português do Brasil** (ex.: `feat(catalogo): adiciona filtros por tipo de leite`).
- Quando útil, inclua um corpo explicando o **porquê** da mudança.

### Autoria (obrigatório)

- O único autor e colaborador visível no GitHub deve ser o dono do projeto (**Pedrosjm12**), usando o `user.name` e `user.email` já configurados no Git. Não altere a configuração do Git.
- **Nunca** adicione a linha `Co-Authored-By: Claude ...` nem qualquer outro trailer de coautoria.
- **Nunca** inclua menções como "🤖 Generated with Claude Code" ou links para o Claude Code em mensagens de commit, descrições de PR ou comentários.

### Push

- Após o commit, faça `git push origin <branch-atual>`.
- Nunca use `git push --force`, não reescreva histórico já publicado e não apague branches remotas sem aprovação explícita.
- Se o push falhar (conflito, autenticação, branch protegida), pare e avise o dono do projeto em vez de tentar contornar.

## Regras gerais

- Antes de declarar uma tarefa pronta: lint, typecheck, testes e build passando.
- Não altere cores, textos, medidas ou preços da spec sem aprovação do dono do projeto.
- Não adicione dependências sem justificativa registrada em ADR.
- Não crie contas, não configure cobranças reais e não publique em produção sem aprovação explícita.
- Ao usar uma API ou biblioteca, confira a documentação oficial da versão instalada em vez de confiar na memória.

## Skills

Instale as skills recomendadas em `SKILLS-ATELIE-DO-QUEIJO.md` (comandos e mapa por agente). Regras:

- **Use as skills sempre que fizer sentido.** Antes de começar qualquer tarefa, verifique se alguma skill instalada se aplica a ela (consulte o mapa por agente em `SKILLS-ATELIE-DO-QUEIJO.md`) e, se sim, carregue e siga suas instruções. Isso vale tanto para a sessão principal quanto para cada subagente, sem esperar pedido do dono do projeto.
- As skills de design e de boas práticas ajudam na qualidade da execução, mas a `ATELIE-DO-QUEIJO-SPEC.md` vence qualquer sugestão de skill sobre cores, fontes, textos, medidas e preços.
- Se uma skill sugerir algo que contraria a spec, registre a divergência e pergunte ao dono do projeto.
- Skills de terceiros: leia o `SKILL.md` antes de instalar; não instale skills fora da lista sem aprovação do dono do projeto.
