# ADR-0005 — Renderização e interatividade de Home, Catálogo, Produto e Atendimento

- **Status:** Aceito
- **Data:** 2026-10-26
- **Contexto da etapa:** 3 (ver `docs/PLANO.md`)

## Contexto

A etapa 3 constrói as quatro telas prototipadas (spec §5 a §8). Quatro pontos técnicos ainda não tinham decisão:

1. Como o filtro do catálogo (`?origem=brasil|mundo`, §6) chega ao HTML: no servidor ou no cliente.
2. Como as páginas de produto são geradas e como um slug inválido vira 404.
3. Como três gatilhos em lugares diferentes da árvore (botão flutuante no layout, "Fale conosco" no rodapé Server Component, "Pedir ajuda" no catálogo) abrem um único painel de atendimento (§8), e com qual primitiva de diálogo.
4. Como evitar colisão de `id` de gradientes quando o mesmo SVG literal do Apêndice A aparece mais de uma vez na página (por exemplo, a miniatura do Canastra na grade da Home e no resultado do quiz).

O ADR-0004 manteve o modelo de renderização padrão do App Router (`cacheComponents` desligado). O Next.js instalado é o 16.4.3 e o React o 19.3.0. Na documentação atual do `page.js`, `params` e `searchParams` são `Promise` e ler `searchParams` coloca a página em renderização dinâmica. Na documentação do `useId`, a única restrição citada é não usá-lo em Server Components **assíncronos**.

## Decisão

1. **Catálogo filtrado no servidor.** `app/queijos/page.tsx` é um Server Component que lê `searchParams`, valida `origem` com um *type guard* simples (valor inválido equivale a "Todos") e renderiza só os cartões filtrados. A página passa a ser dinâmica. Os chips são um Client Component pequeno (`FiltroOrigem`) com `<button aria-pressed>` (spec §4.4 e §6), que chama `router.replace('/queijos?origem=…', { scroll: false })` e marca o chip escolhido de imediato, sem esperar o servidor.
2. **Produto estático.** `app/queijos/[slug]/page.tsx` usa `generateStaticParams` com os 10 slugs de `data/cheeses.ts` e `export const dynamicParams = false`. Slugs fora da lista recebem 404 do próprio Next. A página também chama `notFound()` quando `obterQueijo(slug)` devolve `undefined`, o que estreita o tipo e protege contra uma mudança futura em `dynamicParams`. `generateMetadata` usa o mesmo `obterQueijo`.
3. **Atendimento por contexto + `<dialog>` nativo modal.**
   - `AtendimentoProvider` (Client Component) envolve o conteúdo do `<body>` no `app/layout.tsx`. Ele expõe `useAtendimento()` com `{ aberto, abrir(origem?), fechar(opcoes?) }` e renderiza o `SupportPanel` uma única vez.
   - Os gatilhos são o `SupportFab` e o componente client `BotaoAbrirAtendimento`, usado no rodapé e no catálogo. Ambos levam `aria-haspopup="dialog"`.
   - O painel é um `<dialog>` aberto com `showModal()`: ele já traz foco preso, tecla Esc, fundo inerte e devolução do foco ao gatilho, sem escrever essa lógica à mão. `fechar({ devolverFoco: false })` existe para o cartão de produto do chat, que navega: nesse caso o foco não volta ao gatilho e o `FocoNoConteudo` leva o foco ao conteúdo da nova página. É posicionado por CSS: ancorado no canto inferior direito no desktop e em tela cheia em ≤ 768 px.
4. **SVGs literais com ids prefixados por `useId()`.** Cada ilustração literal com `<defs>` (A.3, A.4, A.5, A.7) é um componente síncrono que gera um prefixo com `useId()` e o aplica a todos os `id` e `url(#…)`. Essa é a única alteração permitida em relação ao Apêndice A, além da conversão dos atributos para JSX. O gerador A.6 não tem gradientes nem ids: ele não precisa disso e é a única fonte das miniaturas do catálogo.
5. **Sem Zod na etapa 3.** As únicas entradas externas desta etapa são `origem` e `slug`, e um *type guard* contra os dados estáticos basta para validá-las. O Zod entra quando houver dados externos de verdade (sacola em `localStorage` e CEP na etapa 4), com ADR próprio.

## Alternativas consideradas

- **Catálogo estático com filtro no cliente (`useSearchParams`):** exige uma fronteira `<Suspense>` na página estática. O conteúdo filtrado de `/queijos?origem=brasil` não viria no HTML inicial (só o *fallback*), o que piora o SEO e causa um salto visual. Rejeitada.
- **Chips como `<Link>` com `aria-current`:** funcionariam sem JavaScript, mas a spec pede `aria-pressed` em chips de filtro (§4.4 e §13). Rejeitada.
- **`router.push` no filtro:** cada clique criaria uma entrada no histórico e o botão Voltar passaria a percorrer filtros. Escolhemos `replace`. Se o dono preferir o outro comportamento, a troca é de uma linha.
- **Painel como diálogo escrito à mão (`role="dialog"` + foco preso manual):** mais código e mais risco de acessibilidade, sem ganho. Rejeitada.
- **Painel não modal no desktop:** permite usar a página com o painel aberto, mas exige gerenciar foco e Esc manualmente e diverge do celular, onde o painel ocupa a tela inteira. Rejeitada por simplicidade. O `especialista-em-acessibilidade` valida a escolha na etapa 3.
- **Evento DOM global (`window.dispatchEvent`) para abrir o painel:** evita um contexto, mas cria um acoplamento invisível e é difícil de testar. Rejeitada.
- **Prefixo de id passado por prop:** funciona, mas transfere para quem chama a responsabilidade de garantir a unicidade. Fica só como plano B, se o `useId` em Server Component falhar no build.

## Consequências

- `/queijos` é renderizada a cada requisição. O custo é baixo, com 10 itens e dados em memória. O `performance-e-seo` reavalia na etapa 8, junto com um eventual ADR sobre `cacheComponents`.
- O HTML de `/queijos?origem=mundo` já vem filtrado, então os links "Conhecer os brasileiros/importados" da Home funcionam sem JavaScript. Os chips, porém, precisam de JavaScript.
- O contexto de atendimento passa a existir no layout. Na etapa 6, o roteiro do assistente e os links do WhatsApp entram dentro do `SupportPanel` sem mudar os gatilhos.
- Os SVGs continuam iguais ao Apêndice A, salvo pelo prefixo dos ids. Um teste e2e garante que não há `id` duplicado e que todo `url(#…)` aponta para um id existente.
- Nenhuma dependência nova.
