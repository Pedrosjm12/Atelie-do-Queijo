# ADR-0011 — Páginas de conteúdo (Presentes, Aprenda, Produtores) e página 404

- **Status:** Aceito em 2026-11-05 (o dono aceitou a opção A, a recomendada, em todas as perguntas P53 a P67 do `docs/PLANO.md`; os itens 3 e 4 valem como escritos)
- **Data:** 2026-11-05
- **Contexto da etapa:** 7 (ver `docs/PLANO.md`)

## Contexto

A spec §12 descreve quatro páginas sem protótipo: `/presentes`, `/aprenda`, `/produtores` e a 404. Ela manda usar "os mesmos componentes, cabeçalhos de seção (sobretítulo + h2 + parágrafo) e espaçamentos da Home". O mapa do site (§1) também cita páginas de kit, de artigo e de produtor, mas a §10.5 e a §12 não definem as rotas delas.

Situação do repositório ao fim da etapa 6 (`2b2922d`):

- O menu principal (`components/navegacao.ts`), o rodapé (`components/Footer.tsx`) e a Home (`Hero`, `Presentes`, `Escola`) já apontam para `/presentes`, `/aprenda` e `/produtores`. As três rotas **não existem**: hoje respondem com a 404 padrão do Next, em inglês. O e2e ignora esses 404 de *prefetch* com um filtro provisório (`e2e/_apoio/console.ts`).
- Não existe `app/not-found.tsx`. `/queijos/[slug]` já chama `notFound()` para slugs desconhecidos (`dynamicParams = false`).
- Os kits ficam numa constante dentro de `app/_home/Presentes.tsx` (com `preco: null`, que mostra `R$ [PREÇO]`), e os três artigos da Escola numa constante de `app/_home/Escola.tsx`, todos com link para `/aprenda`.
- O único produtor conhecido é o do Canastra curado, com nome e ano fictícios (D29, `data/ficticio.ts`).

Versões instaladas: Next.js 16.4.3, React 19.3.0. Documentação conferida: `not-found.js` (atualizada em 2026-10-06).

## Decisão

1. **Conteúdo em `data/`, sem regra nova em `lib/`.** Três módulos estáticos e tipados: `data/kits.ts` (sai da Home), `data/artigos.ts` (sai da Home, com `corpo: null` e `queijosCitados: null` como lacunas) e `data/produtores.ts`. `null` significa lacuna, como o `preco` dos kits (etapa 3); nunca lista vazia nem `0`. Os textos são os literais da spec. O nome e o ano do produtor vêm de `data/ficticio.ts`, para que a trava de dados fictícios continue sendo o único lugar a trocar. Um teste confere que o nome de cada produtor é igual ao `detalhe.produtor` dos queijos dele.
2. **Páginas estáticas e só no servidor.** `/presentes`, `/aprenda` e `/produtores` são Server Components sem `searchParams`, pré-renderizadas no build. Nenhum arquivo novo com `'use client'`: as únicas ilhas interativas são as que já existem (`LinkDoWhatsApp` no bloco corporativo, `BotaoAdicionar` dentro do `ProductCard`). O JavaScript inicial dessas rotas fica igual ao pacote compartilhado.
3. **Artigos em rota dinâmica estática (se P59 = A).** `app/aprenda/[slug]/page.tsx` com `generateStaticParams` a partir de `ARTIGOS` e `dynamicParams = false`, o mesmo padrão do produto (ADR-0005). Slug desconhecido recebe 404. Não há páginas de kit nem de produtor nesta etapa (P55 e P63): não existe conteúdo para elas além do que o cartão já mostra.
4. **Sem filtros nesta etapa (se P54 = A).** Com três kits, todos com preço em lacuna e sem ocasião definida, um filtro não reduz nada. Os filtros da §12 entram quando houver dados, com o mesmo padrão do catálogo (`?parametro=` lido no servidor, ADR-0005). Desvio registrado no checklist da §14.
5. **404 com `app/not-found.tsx`, não `global-not-found.js`.** O projeto tem um layout raiz único, então o `not-found.tsx` da raiz atende URLs sem rota e as chamadas a `notFound()` e herda cabeçalho, rodapé, fontes e o botão de atendimento. O `global-not-found.js` é experimental e exigiria repetir fontes, estilos e provedores. O Next devolve 404 antes do *streaming* e injeta `<meta name="robots" content="noindex">` sozinho.
6. **Componentes de seção promovidos a `components/` só quando usados por mais de uma rota.** `CartaoDeKit` (Home e Presentes), `CartaoDeArtigo` (Home e Aprenda), `CabecalhoDePagina` (catálogo, as três páginas e a 404) e `Trilha` genérica (produto e artigo). O `CabecalhoDeSecao` da Home continua em `app/_home/` enquanto só a Home o usar.
7. **Botão com aparência de `Button` em link externo.** `components/Button.tsx` passa a exportar `classesDoBotao({ variante, tamanho })`, usada para dar a aparência de botão ao `<a>` do `LinkDoWhatsApp` (**Pedir orçamento**). O `Button` continua usando `next/link` só para rotas internas.
8. **Metadados agora, dados estruturados na etapa 8.** Cada página exporta `metadata` (ou `generateMetadata` nos artigos) com o template do layout (P13). JSON-LD fica para a etapa 8 (`performance-e-seo`), junto com o `Product` já previsto, porque hoje nenhum tipo teria dados verdadeiros: kits sem preço (sem `Offer`), artigos sem corpo (sem `Article`) e organização com CNPJ e endereço fictícios (sem `Organization`).
9. **Nenhuma dependência nova.** Nada de MDX, CMS ou biblioteca de conteúdo: são três artigos sem texto. Se o dono escrever artigos longos, um ADR próprio avalia MDX.

## Alternativas consideradas

- **MDX para os artigos** (`@next/mdx`): bom para textos longos com formatação, mas hoje não há texto nenhum, e o pacote soma configuração e dependências. Rejeitada por enquanto.
- **Filtros de Presentes implementados com dados `[A DEFINIR]`:** cumpriria a §12 ao pé da letra, mas os chips de ocasião e de preço devolveriam sempre zero kits ou todos os kits. Rejeitada (ver P54).
- **Páginas de kit e de produtor com lacunas:** mais páginas sem conteúdo próprio e mais rotas para o sitemap da etapa 8. Rejeitada; entram quando houver conteúdo.
- **`global-not-found.js`:** só compensa com vários layouts raiz. Rejeitada.
- **Deixar os kits e os artigos nos componentes da Home e duplicar em cada página:** duas fontes para o mesmo texto. Rejeitada.
- **JSON-LD já na etapa 7 com os dados disponíveis:** publicaria dados estruturados com lacunas ou valores fictícios. Rejeitada.

## Consequências

- As três rotas do menu e do rodapé deixam de dar 404; o filtro provisório de `e2e/_apoio/console.ts` sai.
- A Home passa a ler kits e artigos de `data/`, sem mudança visual (conferida pelo e2e da Home e pelo `guardiao-do-design`).
- As páginas novas não têm protótipo. A fidelidade é conferida contra os tokens e os padrões da Home e do catálogo; todo valor visual que não sai deles vira pergunta ao dono (P53 a P67).
- Os dados fictícios do produtor aparecem também em `/produtores`. Continuam sob a trava `DADOS_FICTICIOS_ATIVOS`, e os testes que citam esses valores entram na lista da etapa 9.
- A etapa 8 herda: JSON-LD por página, sitemap com as rotas novas (a 404 fora), `metadataBase` e URLs canônicas.
