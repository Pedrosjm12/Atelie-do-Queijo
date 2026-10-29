# ADR-0007 — Validação na borda com Zod (`zod/mini`)

- **Status:** Aceito (aprovado pelo dono em 2026-10-27). Versão instalada: `zod@4.6.7`; dados de procedência e medição do pacote em [Registro da instalação](#registro-da-instalação-tarefa-1-da-etapa-4).
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

Preenchido em 2026-10-27 pelo `engenheiro-de-ecommerce`.

| Item | Valor |
| --- | --- |
| Versão instalada | `4.6.7` (`npm view zod version` = `4.6.7`, a mais recente estável; instalada com `npm i zod@4.6.7 --save-exact`; `package.json`: `"zod": "4.6.7"`, sem `^`/`~`) |
| Data de publicação da versão no npm | 2026-10-12T16:29:37Z (15 dias antes da instalação; o mínimo exigido é 7) |
| Licença | MIT |
| Dependências do pacote | Nenhuma (`dependencies` e `peerDependencies` vazios no registro) |
| Procedência no `package-lock.json` | `resolved`: `https://registry.npmjs.org/zod/-/zod-4.6.7.tgz`; `integrity`: `sha512-g8W2D2kU6a8untc053fX1uVBKzM7yqAxW/3zwk83+6RyF2+SKOuV+c0wBDhUwzV1PaGapmZH+rmcUzPf+3CGwg==` |
| `npm audit signatures` | 437 pacotes com assinaturas do registro verificadas; 117 com atestados (*attestations*) verificados; nenhum inválido |
| `npm audit --omit=dev` | `found 0 vulnerabilities` |
| *First Load JS* compartilhado antes da etapa 4 (linha de base) | **180,05 kB gzip** (184.371 bytes): 8 arquivos `.js` comuns a todas as páginas pré-renderizadas, medidos depois de `npm run build` e **antes** de qualquer outra mudança. Método abaixo |
| *First Load JS* compartilhado depois do bloco B (limite: +8 kB gzip) | **182,27 kB gzip** (186.647 bytes; +2,3 kB sobre a linha de base, dentro do limite de 188,05 kB). Com o `SacolaProvider` e `lib/sacola.ts` usando `zod/mini` no layout, a medição intermediária foi de 202.358 bytes (+17,56 kB, acima do teto). A validação de `lerSacolaSalva` passou a ser um *type guard* escrito à mão (o plano B abaixo), mesmo comportamento e mesmos testes; o Zod ficou só em `lib/pedido.ts` e nas Server Actions |
| Medição final da etapa 4 (tarefa 17) | `[A REGISTRAR]` |

**Método da medição.** O Next 16.4.3 (Turbopack) não imprime a tabela *First Load JS* no `npm run build`. Por isso a medição é feita nos arquivos gerados: depois do `build`, lê-se cada HTML pré-renderizado em `.next/server/app` (exceto `_not-found` e `_global-error`), extraem-se os `<script src="/_next/static/…js">`, comprime-se cada arquivo com gzip (padrão do Node) e soma-se **a interseção** dos arquivos presentes em todas as páginas. Repetir exatamente o mesmo método nas medições seguintes (o script usado na linha de base ficou fora do repositório; se a equipe quiser, vale versioná-lo em `scripts/`). A rota `/queijos` é dinâmica e não tem HTML pré-renderizado; ela entra pelos mesmos arquivos do layout. Na linha de base as páginas individuais ficaram entre 184,27 kB (Home) e 185,19 kB (produto).

**Nota.** Ao fim da tarefa 3, `zod/mini` já é importado por `lib/sacola.ts` e `lib/pedido.ts`, mas nenhum componente importa esses módulos ainda; por isso o pacote compartilhado continuou em 180,05 kB. O custo real aparece quando o `SacolaProvider` (tarefa 5) importar `lib/sacola.ts` no layout.
