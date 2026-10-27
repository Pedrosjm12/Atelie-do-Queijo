# ADR-0007 — Validação na borda com Zod (`zod/mini`)

- **Status:** Aceito (aprovado pelo dono em 2026-10-27). A versão instalada, os dados de procedência e a medição do pacote são registrados na tarefa 1 da etapa 4, na seção [Registro da instalação](#registro-da-instalação-tarefa-1-da-etapa-4).
- **Data:** 2026-10-27
- **Contexto da etapa:** 4 (ver `docs/PLANO.md`)

## Contexto

O ADR-0003 prevê validar a sacola lida do `localStorage` "com Zod, quando adotado". O ADR-0005 adiou o Zod até existirem dados externos de verdade. A etapa 4 traz as primeiras entradas que não controlamos:

1. O conteúdo do `localStorage`: pode estar corrompido, ser de uma versão antiga do site ou ter sido editado à mão.
2. O CEP digitado na calculadora de frete e no checkout.
3. Os dados do cliente e do presente no checkout (nome, e-mail, telefone, endereço, mensagem de até 200 caracteres, data de entrega).
4. A entrada dos Server Actions `consultarFrete` e `confirmarPedido`. Esses endpoints são públicos: qualquer pessoa pode enviar um POST sem passar pela interface (documentação do Next 16.4.3, `guides/server-actions.md`, seção *Security*).

As mesmas regras valem no navegador (mensagens de erro imediatas) e no servidor (a validação que conta). O projeto tem o princípio "dados externos sempre validados com Zod na borda".

O provider da sacola fica no `app/layout.tsx`. Tudo o que ele importa entra no pacote JavaScript de todas as páginas. O projeto já se preocupa com isso: na etapa 3, o painel de atendimento deixou de importar `data/cheeses`.

## Decisão

- Adotar o **Zod 4** (pacote `zod`, licença MIT), importado **sempre por `zod/mini`** (API funcional, que o bundler consegue podar). Segundo a documentação oficial, o `zod/mini` fica entre ~2 e 4 kB gzip para esquemas pequenos, contra ~6 a 13 kB do `zod` clássico.
- Usar uma API só, a do `zod/mini`, no cliente e no servidor. Não misturar com o `zod` clássico.
- Os esquemas ficam em `lib/` e são compartilhados entre o cliente e os Server Actions:
  - `lib/sacola.ts`: esquema da sacola salva (`v`, `itens`, `presente`).
  - `lib/commerce.ts`: CEP (8 dígitos depois de tirar a máscara).
  - `lib/pedido.ts`: cliente, endereço, presente, forma de pagamento e a entrada completa do pedido.
- O servidor **sempre** valida de novo, mesmo que o cliente já tenha validado. A validação do cliente só serve para a experiência de uso.
- O Zod confere só o **formato** da entrada. A referência ao catálogo (`slug`/`formatoId` existentes, queijo não esgotado) é uma regra à parte, conferida contra os dados confiáveis.
- **Versão:** quem instala roda `npm view zod version`, instala a versão estável exata (sem `^`, como o `next`) e registra o número neste ADR. A API usada é conferida na documentação de `zod.dev` daquela versão.
- **Orçamento de pacote:** medir o *First Load JS* compartilhado no `npm run build` antes e depois da etapa 4. A sacola inteira no layout (provider, aviso, contador e esquema) pode acrescentar **no máximo 8 kB gzip**. Se passar disso, o esquema da sacola salva vira um *type guard* escrito à mão e testado, e o Zod fica só nas rotas `/checkout`, `/queijos/[slug]` e nos Server Actions. Essa troca não precisa de outro ADR.

## Alternativas consideradas

- **`zod` clássico (API encadeada):** é mais conhecido e tem mensagens melhores, mas o pacote é ~3 vezes maior e pesaria no layout global. Rejeitado.
- **Valibot (~1,4 kB):** é menor, mas a equipe e os agentes conhecem menos a API, e o ganho de ~2 kB não compensa. Rejeitado.
- **Só *type guards* à mão:** não adiciona dependência e serve bem para a sacola salva, que é simples. Com os ~12 campos do checkout, porém, as regras ficariam duplicadas e as mensagens de erro seriam montadas à mão em dois lugares. Fica só como plano B para a sacola salva (ver o orçamento acima).
- **Validar só no servidor:** daria mensagens de erro lentas e um ciclo de ida e volta por campo. Rejeitado.

## Consequências

- Primeira dependência de produção além de `next`, `react` e `react-dom`. O `auditor-de-seguranca` confere a versão e o `npm audit`.
- Os esquemas servem de documentação viva dos contratos. Os tipos saem de `z.infer` (`zod/mini` também exporta `infer`).
- Mensagens de erro: o Zod devolve códigos, e as mensagens em português ficam em `lib/pedido.ts`, num mapa por campo. Não usamos as mensagens padrão da biblioteca, que vêm em inglês.
- Quando houver gateway real, os mesmos esquemas validam as respostas externas (webhooks) na borda.

## Requisitos de instalação (auditoria de segurança, 2026-10-27)

- Versão exata no `package.json`, sem `^` nem `~`.
- `package-lock.json` com `integrity` `sha512-…` e `resolved` em `registry.npmjs.org`.
- Não instalar versão publicada há menos de 7 dias.
- Importar sempre de `zod/mini`: nenhum `from 'zod'` no código.

## Registro da instalação (tarefa 1 da etapa 4)

A preencher por quem instalar:

| Item | Valor |
| --- | --- |
| Versão instalada | `[A REGISTRAR]` |
| Data de publicação da versão no npm | `[A REGISTRAR]` |
| Licença | `[A REGISTRAR]` (esperado: MIT) |
| Dependências do pacote | `[A REGISTRAR]` (esperado: nenhuma) |
| `npm audit signatures` | `[A REGISTRAR]` |
| `npm audit --omit=dev` | `[A REGISTRAR]` |
| *First Load JS* compartilhado antes da etapa 4 (linha de base) | `[A REGISTRAR]` |
| *First Load JS* compartilhado depois do bloco B (limite: +8 kB gzip) | `[A REGISTRAR]` |
| Medição final da etapa 4 (tarefa 17) | `[A REGISTRAR]` |
