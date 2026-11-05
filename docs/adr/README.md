# Registros de decisão de arquitetura (ADRs)

Cada decisão técnica relevante do Ateliê do Queijo fica registrada aqui, em `NNNN-titulo.md`, no formato curto: **Contexto, Decisão, Alternativas consideradas, Consequências**.

- Status possíveis: Proposto, Aceito, Substituído (indicar por qual ADR), Descontinuado.
- Um ADR aceito não é editado para mudar a decisão: cria-se um novo que o substitui.
- Toda nova dependência precisa de um ADR (ou de uma linha num ADR existente) com o motivo, o peso e a licença.
- A spec (`ATELIE-DO-QUEIJO-SPEC.md`) vence qualquer ADR em cores, textos, medidas e preços.

## Índice

| Nº | Título | Status | Data |
| --- | --- | --- | --- |
| [0001](0001-stack.md) | Stack: Next.js App Router, React, TypeScript e CSS Modules | Aceito | 2026-10-26 |
| [0002](0002-ferramentas-de-qualidade.md) | Ferramentas de qualidade e gerenciador de pacotes | Aceito | 2026-10-26 |
| [0003](0003-estado-da-sacola.md) | Estado da sacola: contexto React + localStorage | Aceito | 2026-10-26 |
| [0004](0004-ajustes-de-ferramentas-da-etapa-1.md) | Ajustes de ferramentas da etapa 1 | Aceito | 2026-10-26 |
| [0005](0005-renderizacao-e-interatividade-da-etapa-3.md) | Renderização e interatividade de Home, Catálogo, Produto e Atendimento | Aceito | 2026-10-26 |
| [0006](0006-typecheck-com-next-typegen.md) | Typecheck com `next typegen` | Aceito | 2026-10-26 |
| [0007](0007-validacao-com-zod-mini.md) | Validação na borda com Zod (`zod/mini`) | Aceito | 2026-10-27 |
| [0008](0008-sacola-frete-e-checkout-simulados.md) | Sacola persistida, frete e checkout simulados: fronteiras e persistência | Aceito | 2026-10-27 |
| [0009](0009-visualizador-3d-com-model-viewer.md) | Visualizador 3D com `@google/model-viewer`, carregamento tardio e fallback em SVG | Aceito (aprovado pelo dono em 2026-11-03) | 2026-11-03 |
| [0010](0010-assistente-deterministico-e-whatsapp.md) | Assistente com roteiro determinístico, horário e links do WhatsApp | Aceito | 2026-11-03 |
| [0011](0011-paginas-de-conteudo-e-404.md) | Páginas de conteúdo (Presentes, Aprenda, Produtores) e página 404 | Proposto | 2026-11-05 |
