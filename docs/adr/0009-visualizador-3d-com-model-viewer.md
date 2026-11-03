# ADR-0009 — Visualizador 3D com `@google/model-viewer`, carregamento tardio e fallback em SVG

- **Status:** **Aceito** (2026-11-03, aprovado pelo dono: D22 = A, instalar agora, no bloco B da etapa 5). Antes, estava Proposto. A instalação e o registro dela (seção abaixo) são da tarefa 6 do plano.
- **Data:** 2026-11-03
- **Contexto da etapa:** 5 (ver `docs/PLANO.md`, [Etapa 5](../PLANO.md#etapa-5--visualizador-3d-com-fallback-svg)). Confirma a dependência que o ADR-0001 já previa.

## Contexto

A spec pede `@google/model-viewer` para os modelos `.glb` (§2, §11), com o SVG do Apêndice A como fallback e pré-visualização, carregado só no produto e no hero, "lazy, depois que a ilustração SVG já estiver visível". Os atributos esperados são `camera-controls`, `auto-rotate`, `rotation-per-second="36deg"`, `shadow-intensity="1"`, `exposure="0.9"`, `interaction-prompt="none"` e `ar` só no celular (§11). §7.5 define os textos "Preparando a peça…" e "Seu navegador não exibe o 3D. Veja as fotos abaixo.", e §10.3 pede uma volta a cada 10 s e respeito a `prefers-reduced-motion`.

Situação do repositório em 2026-11-03:

- `public/models/` só tem `.gitkeep`: **não existe nenhum GLB** (D21). O dono decidiu implementar a etapa com o fallback SVG e deixar o carregamento pronto para os GLB futuros; **Ver na mesa** (AR) fica oculto até haver GLB real (D23, P11).
- Next.js 16.4.3 (Turbopack) e React 19.3.0. O `CheeseViewer` já é Client Component e a interface `<CheeseViewer queijo={q} />` não pode mudar.
- O *First Load JS* compartilhado está em 182,74 kB gzip (medição final da etapa 4, ADR-0007). O projeto já trocou o Zod por um *type guard* para não pesar o layout; o mesmo cuidado vale aqui.
- Não há CSP configurada ainda; o ADR de CSP é da etapa 8.

### O que a documentação oficial diz (conferida em 2026-11-03)

**`@google/model-viewer`** (registro do npm, `package.json` do repositório `google/model-viewer` e `modelviewer.dev`, dados de `docs.json`):

| Item | Valor |
| --- | --- |
| Versão mais recente (`latest`) | **4.4.0**, publicada em **2026-10-09T20:10:31Z** (25 dias antes desta data) |
| Versões anteriores | 4.3.1 (2026-06-04), 4.3.0 (2026-06-01), 4.2.0 (2026-03-11), 4.1.0 (2025-04-08), 4.0.0 (2024-10-23) |
| Licença | Apache-2.0 |
| Dependências | `lit` ^3.2.1, `@monogrid/gainmap-js` ^3.1.0 |
| `peerDependencies` | `three` ^0.183.0 (no npm, `^0.x.y` só aceita a mesma versão menor: **0.183.x**) |
| Entradas | `module`: `lib/model-viewer.js` (importa o `three` do projeto); `main`: `dist/model-viewer.min.js` (com o `three` embutido); tipos em `lib/model-viewer.d.ts`; sem campo `exports` |
| Publicação | `_npmUser`: `google-wombot` (robô de publicação do Google); repositório `github.com/google/model-viewer`; `gitHead` `adc877c66f97e1498d8b19a8850976aee3d0197f` |
| Procedência | `dist.signatures` presente (assinatura do registro); **sem `dist.attestations`** (sem atestado de procedência SLSA) |
| `integrity` | `sha512-8z1SB5sPlzKoak5mdx/D31brBakPYm3Qi31EfAucHAUrtrHHCbabypkKvSwReYhUpPaxyJ46oT47uWE/hrs1Zw==` |
| Instalação recomendada pelo README | `npm install three` e `npm install @google/model-viewer`; "We strongly recommend you keep your three.js version locked to `<model-viewer>`'s." |
| Decodificadores | `dracoDecoderLocation` e `ktx2TranscoderLocation`: "By default, … will be loaded from a Google CDN". Meshopt: "not enabled" por padrão. `lottieLoaderLocation` aponta para o jsDelivr |
| Iluminação | Sem `environment-image`, "default neutral lighting will be applied" (sem rede) |
| Carregamento | `loading` (`auto`, `lazy`, `eager`), `reveal` (`auto`, `manual`), `poster`, método `dismissPoster()`, propriedade `loaded` |
| Eventos | `load` ("after the first render frame"), `error` (falha de carga **ou** contexto WebGL perdido), `progress`, `camera-change` (`detail.source === 'user-interaction'` quando a pessoa mexe) |
| Acessibilidade | `alt`; atributo `a11y` para traduzir os textos internos (padrão em inglês, por exemplo "Use mouse, touch or arrow keys to move") |
| Padrões a sobrescrever | `auto-rotate-delay` 3000 ms, `rotation-per-second` π/32 rad/s, `camera-orbit` `0deg 75deg 105%`, `touch-action` `pan-y` |
| Credenciais | "By default the file will be fetch without credentials" |

**`three`:** licença MIT. A versão mais recente é a 0.187.0, mas a faixa aceita pelo `model-viewer` 4.4.0 é 0.183.x, cuja última é **0.183.2**, publicada em **2026-02-28T09:33:22Z**.

**Next.js 16** (`node_modules/next/dist/docs/01-app/02-guides/lazy-loading.md` e `nextjs.org/docs/app/guides/lazy-loading`, atualizado em 2026-03-10): `next/dynamic` com `ssr: false` só funciona em Client Component ("is not supported in Server Components"); quando um Server Component importa dinamicamente um Client Component, "automatic code splitting is currently **not** supported"; bibliotecas podem ser carregadas sob demanda com `import()`.

### Impacto de pacote (números da documentação, antes de medir no nosso build)

| Fonte | Valor |
| --- | --- |
| Bundlephobia, `@google/model-viewer@4.4.0` (exclui o `three`, que é *peer*) | 236.979 bytes minificado, **73.409 bytes gzip** |
| `dist/model-viewer.min.js` (com o `three` embutido; jsDelivr) | 1.069.272 bytes minificado |
| `dist/model-viewer-module.min.js` (sem o `three`) | 475.465 bytes minificado |
| Tamanho instalado em `node_modules` (não vai para o navegador) | 43.139.204 bytes, 417 arquivos |

Estimativa do *chunk* tardio com o `three` (só para orientar o orçamento, **não medida**): da ordem de 250 a 320 kB gzip. O número que vale é o medido pela tarefa 6 do plano com `scripts/medir-pacote.mjs`.

## Decisão

1. **Adotar `@google/model-viewer` 4.4.0 e `three` 0.183.2**, versões exatas (sem `^`/`~`), ambas com pelo menos 14 dias de publicadas na data de instalação. Se o dono aprovar mais tarde e houver versão nova, vale a mais recente estável que cumpra os 14 dias **e** a faixa do `peerDependency`, registrada aqui.
2. **Importar do pacote npm, nunca de CDN.** Sem `<script>` de terceiros e sem `next/script` para isso. A importação é a entrada `module` (`@google/model-viewer`), que usa o `three` do projeto; não importar `dist/model-viewer.min.js` (traria um segundo `three`).
3. **Carregamento tardio em duas camadas**, fora do pacote compartilhado e do JavaScript inicial de qualquer rota:
   - `CheeseViewer` (Client) carrega `components/CamadaDoModelo.tsx` (que importa `ModeloDoQueijo.tsx`) com `React.lazy` + `Suspense`, dentro de uma fronteira de erro. **Ajuste da tarefa 7:** o plano previa `next/dynamic(…, { ssr: false })`, mas ele somava ~1,9 kB gzip ao JavaScript inicial do produto (estourava o orçamento); a documentação do Next 16 aceita `React.lazy` + `Suspense` como equivalente e a camada só é renderizada depois da montagem, nunca no servidor;
   - `ModeloDoQueijo` faz `await import('@google/model-viewer')` dentro de um efeito.
   - Gatilho: o queijo tem GLB no manifesto **e** o navegador tem WebGL **e** não pede economia de dados (`saveData`) **e** o palco está visível (`IntersectionObserver`, `rootMargin: '200px'`) **e** o navegador está ocioso (`requestIdleCallback`, com reserva em `setTimeout`). O SVG já foi pintado; o LCP não espera o 3D.
4. **O SVG é o poster.** Não usamos o atributo `poster` (imagem). O SVG do Apêndice A fica no HTML do servidor, o `<model-viewer>` entra por cima com a mesma proporção e invisível, e só substitui o SVG no evento `load`. Erro de carga, contexto perdido ou 20 s sem `load` → volta ao SVG, sem texto novo. Sem WebGL, com GLB → SVG + "Seu navegador não exibe o 3D. Veja as fotos abaixo." Durante a carga → SVG + "Preparando a peça…".
5. **Manifesto explícito de modelos** em `data/modelos3d.ts` (`MODELOS_3D: Partial<Record<SlugDoQueijo, { inteiro: true; cortado: boolean }>>`, vazio hoje) e convenção da §11: `/models/<slug>-inteiro.glb` e `/models/<slug>-cortado.glb`. O `src` só sai de `caminhoDoModelo()`; nunca de URL ou entrada do usuário. Sem entrada no manifesto, nenhum código de 3D é baixado.
6. **Decodificadores sem CDN.** Antes de qualquer `src`, `dracoDecoderLocation = '/decodificadores/draco/'` e `ktx2TranscoderLocation = '/decodificadores/basis/'`. **Correção da tarefa 7:** o construtor do `<model-viewer>` lê `self.ModelViewerElement` (objeto global) a cada instância e, se vazio, volta ao CDN do Google, mesmo que a classe exportada tenha sido configurada; por isso o objeto global é definido antes do `import()`, mesclando com o que já houver (`{ ...global.ModelViewerElement, ... }`) (conferido em `lib/features/loading.js` e por e2e, que lê o valor do elemento real). `lottieLoaderLocation` também é definido (`/decodificadores/lottie/LottieLoader.js`, arquivo que não existe e só seria lido com modelos Lottie, que não usamos), para que nenhum caminho tenha o jsDelivr como padrão. Um teste confere que draco, ktx2 e lottie locais já estão no global quando o `import()` ocorre, e uma regra de lint (`no-restricted-imports` e `no-restricted-syntax`) só permite importar o valor de `@google/model-viewer` e `three` em `components/ModeloDoQueijo.tsx`. Os arquivos (que vêm do próprio pacote `three`, em `examples/jsm/libs/`) só entram em `public/decodificadores/` com o primeiro GLB comprimido. O Meshopt continua desligado, e o Lottie não é usado.
7. **Validação na entrada dos GLB** por `scripts/validar-modelos.mjs` (sem dependência nova), no CI: convenção de nomes, paridade entre arquivos e manifesto, cabeçalho GLB, limite de bytes (P43), extensões permitidas, decodificador local obrigatório para Draco/KTX2 e texturas até 2048 px.
8. **Configuração do elemento:** atributos da §11 mais `auto-rotate-delay="0"` (a volta de 10 s começa já), `touch-action="pan-y"` (a página continua rolando no celular), `loading="eager"` (o atraso é nosso) e `alt` igual ao `aria-label` do SVG. **Sem `ar`** até haver GLB real (D23). Com movimento reduzido, sem `auto-rotate` inicial. Textos internos traduzidos pelo `a11y` se o dono aprovar (P42).
9. **Orçamento:** compartilhado +0,5 kB no máximo; JavaScript inicial do produto +4 kB gzip; Home e `/queijos` +0 kB sem GLB; *chunk* tardio até 350 kB gzip, nunca citado no HTML. Medição com o método do ADR-0007, versionado em `scripts/medir-pacote.mjs`.

## Alternativas consideradas

- **`three.js` direto, ou React Three Fiber + drei:** dá controle total da luz (~3200 K vinda da esquerda, §11), da ardósia e da sombra. Em troca, teríamos de escrever à mão os controles de órbita (mouse, toque, teclado), a sombra de contato, a acessibilidade, a perda de contexto, a realidade aumentada e a carga de GLB. R3F ainda acrescenta o próprio *reconciler* e o `drei`. A spec nomeia o `model-viewer`. **Rejeitada:** mais código e mais risco, sem ganho visível para queijos girando sobre um palco.
- **Só SVG (não instalar nada agora):** zero dependência e zero manutenção enquanto não houver GLB. Como hoje não há modelo, o visitante não perceberia diferença. Contraria o D21 ("deixar o carregamento pronto") e empurra para depois a integração, a validação dos GLB e a medição de pacote. **Rejeitada como decisão principal**, mas fica como opção B da pergunta D22 no plano (aprovar o ADR e instalar só com o primeiro GLB).
- **`model-viewer` por CDN (jsDelivr ou Google Hosted Libraries):** é o caminho mais curto da documentação, mas põe script de terceiro no site, exige `script-src` para outro domínio na CSP futura, tira o controle de versão e de integridade (`integrity` do *lockfile*) e cria uma requisição externa que o e2e passaria a ter de permitir. **Rejeitada.**
- **`dist/model-viewer.min.js` (com `three` embutido) importado do npm:** evita o *peer* `three`, mas impede a poda pelo bundler e duplicaria o `three` se outra parte do site usar a biblioteca. **Rejeitada.**
- **Descobrir o GLB em tempo de execução (`HEAD /models/…`) ou por `fs.existsSync` no servidor:** o primeiro gera uma requisição (e um 404) por página; o segundo falha onde a função do servidor não enxerga `public/` (`/queijos` é dinâmica). **Rejeitada** em favor do manifesto.
- **Atributo `poster` com imagem rasterizada:** exigiria gerar PNG/WebP de cada queijo, enquanto o SVG literal já existe, é nítido e já está no HTML. **Rejeitada.**
- **`<model-viewer loading="lazy">` sem o nosso gatilho:** o atraso da biblioteca só vale depois de ela estar carregada, então os ~300 kB viriam mesmo assim. **Rejeitada.**

## Consequências

- Segunda e terceira dependências de produção depois do Zod. O `auditor-de-seguranca` confere a instalação (tarefa 8 do plano).
- **Sem GLB (hoje), custo zero para o visitante:** o *chunk* do `ModeloDoQueijo` e a biblioteca nunca são pedidos; um e2e garante isso e que nenhuma requisição vai para outro domínio.
- O caminho com GLB fica coberto por testes de unidade com elemento falso e por um e2e pulado que se ativa sozinho com o primeiro GLB. A integração real só é provada com um GLB de verdade; até lá, verificação manual com um GLB de teste fora do repositório.
- `three` fica preso à faixa do `model-viewer`: as duas atualizações andam juntas (regra a registrar no Dependabot/Renovate da etapa 9).
- **Procedência:** o pacote tem assinatura do registro, mas **não tem atestado SLSA**. Mitigação: versão exata, `integrity` no *lockfile*, `resolved` em `registry.npmjs.org`, publicação pelo robô oficial do Google, regra dos 14 dias e `npm audit signatures` registrado aqui.
- **Licenças:** Apache-2.0 (`model-viewer`) exige manter os avisos de licença na distribuição; MIT (`three`, `@monogrid/gainmap-js`) e BSD-3-Clause (`lit`), a confirmar na instalação. Conferir se o build preserva os comentários `@license`; arquivo ou página de avisos de terceiros na etapa 9.
- **CSP (etapa 8):** com o pacote local, `script-src 'self'` basta para a biblioteca. O GLB pede `connect-src 'self'`. Com GLB comprimido (Draco/KTX2), os decodificadores rodam em *workers* criados a partir de `blob:` e usam WebAssembly: prever `worker-src blob:` e `'wasm-unsafe-eval'` em `script-src`; texturas podem usar `blob:` em `img-src`. Conferir com o GLB real.
- **AR (quando houver GLB):** o Scene Viewer do Android abre um aplicativo do Google com a URL do GLB; o Quick Look do iOS precisa de USDZ (o `ios-src` "is no longer necessary", segundo a documentação, mas a conversão automática deve ser testada). Exige revisão de privacidade e um ADR curto, ou atualização deste.
- Se algum dia a luz, a ardósia ou a sombra pedidas na §11 não forem alcançáveis com `model-viewer` (por exemplo, a luz quente lateral), a saída é um ambiente HDR próprio (`environment-image`, arquivo local) antes de pensar em trocar de biblioteca.

## Requisitos de instalação (para a tarefa 6 do plano)

- `npm i @google/model-viewer@<versão> three@<versão> --save-exact`; nenhuma versão publicada há menos de 14 dias.
- `package-lock.json` com `integrity` `sha512-…` e `resolved` em `registry.npmjs.org` para os dois pacotes e para `lit` e `@monogrid/gainmap-js`.
- Nenhum `import` de `@google/model-viewer` ou de `three` fora de `components/ModeloDoQueijo.tsx` (conferido por busca).
- Nenhuma URL de CDN no código (`gstatic`, `jsdelivr`, `unpkg`, `googleapis`), conferido por busca e pelo e2e.

## Registro da instalação

Preenchido pelo `especialista-3d-webgl` em 2026-11-03 (tarefa 6 do plano).

| Item | Valor |
| --- | --- |
| Versões instaladas | `@google/model-viewer` **4.4.0** e `three` **0.183.2**, exatas (sem `^`/`~`) em `package.json`. Dependências transitivas novas: 13 pacotes no total (inclui `lit` 3.3.3 e `@monogrid/gainmap-js` 3.7.2) |
| Datas de publicação | `model-viewer` 4.4.0: 2026-10-09 (25 dias); `three` 0.183.2: 2026-02-28 (mais de 14 dias, conferido no registro) |
| Licenças | `model-viewer` Apache-2.0; `three` MIT; `lit`, `lit-html`, `lit-element`, `@lit/reactive-element` e `@lit-labs/ssr-dom-shim` BSD-3-Clause; `@monogrid/gainmap-js`, `@types/trusted-types`, `lie`, `immediate` e `is-promise` MIT; `promise-worker-transferable` Apache-2.0 (campo `license` do `package-lock.json`) |
| `resolved` e `integrity` | Todos em `https://registry.npmjs.org/` com `sha512-…`. `model-viewer`: `sha512-8z1SB5sPlzKoak5mdx/D31brBakPYm3Qi31EfAucHAUrtrHHCbabypkKvSwReYhUpPaxyJ46oT47uWE/hrs1Zw==`; `three`: `sha512-di3BsL2FEQ1PA7Hcvn4fyJOlxRRgFYBpMTcyOgkwJIaDOdJMebEFPA+t98EvjuljDx4hNulAGwF6KIjtwI5jgQ==`; `lit`: `sha512-fycuvZg/hkpozL00lm1pEJH5nN/lr9ZXd6mJI2HSN4+Bzc+LDNdEApJ6HFbPkdFNHLvOplIIuJvxkS4XUxqirw==`; `@monogrid/gainmap-js`: `sha512-nwbyP5gskF1clzuEynSG8uqmLhZYDkQa0zZYBQmh30OoVVqaDaZOUy93NIDjdTJB34go3mqVAQgxJKBlStOnig==` |
| `npm audit signatures` | 450 pacotes com assinaturas do registro verificadas; 123 com atestados de procedência verificados (o `model-viewer`, como previsto, não tem atestado SLSA) |
| `npm audit --omit=dev` | 0 vulnerabilidades. (`npm audit` completo aponta 17 moderadas só em dependências de desenvolvimento, já existentes) |
| Importações | `@google/model-viewer` só em `components/ModeloDoQueijo.tsx`; `three` não é importado por nós (é *peer* do `model-viewer`). Nenhuma URL de CDN no código (busca por `gstatic`, `jsdelivr`, `unpkg`) |
| Linha de base (tarefa 1, 2026-11-03, `npm run medir:pacote`; kB = 1024 bytes, gzip) | Compartilhado **182,69 kB** (187.070 bytes, 8 arquivos; o fim da etapa 4 registrou 182,74 kB, diferença de 0,05 kB). JavaScript inicial: `/` 187,03 kB; `/queijos` 182,69 kB (dinâmica, só o compartilhado); `/queijos/canastra-curado` **189,88 kB**; `/checkout` 208,17 kB; `/sacola` 185,34 kB. Medido no commit `cdae7aa`, antes do bloco A |
| Depois do bloco A (sem biblioteca 3D) | Compartilhado **182,69 kB** (+0,00); `/` 187,03 kB (+0,00); `/queijos/canastra-curado` **190,50 kB** (+0,62 kB, limite +4 kB); `/queijos` e `/checkout` sem mudança |
| LCP e CLS do produto (bloco A; `npm run medir:pacote -- --web-vitals`, Chromium emulando Pixel 7, sem estrangulamento, 2 execuções) | `/queijos/canastra-curado`: LCP 176 e 228 ms, CLS 0,0000. `/`: LCP 224 e 188 ms, CLS 0,0000. Serve para comparar antes e depois; não é nota do Lighthouse |
| Depois do bloco B (`npm run medir:pacote`, manifesto vazio) | Compartilhado **182,69 kB** (+0,00, limite +0,5); `/` 187,03 kB (+0,00); `/queijos` 182,69 kB (+0,00); `/queijos/canastra-curado` **193,77 kB** (+3,89 kB sobre a linha de base de 189,88, limite +4: folga de 0,11 kB; +3,27 kB sobre o bloco A). **Chunk tardio** (`ModeloDoQueijo` + `model-viewer` + `three`): **293,41 kB gzip** em 2 arquivos (limite 350), fora do `<script>` e dos `preload` de todas as páginas; nenhum script inicial contém marcas do 3D. LCP/CLS (`--web-vitals`, Pixel 7): `/` 248 ms e 0,0000; produto 184 ms e 0,0000 (sem GLB, igual ao bloco A dentro do ruído) |
| Verificação com GLB sintético (manifesto alterado só localmente, revertido) | Chromium sem cabeça com WebGL por software: o modelo chega a `loaded` em ~4,5 a 5,2 s depois da navegação (sem estrangulamento, inclui o carregamento da página e a espera ociosa); CLS 0,0000 na troca SVG → 3D no desktop e no Pixel 7; nenhuma requisição fora de `localhost`; órbita muda 30° nos botões |

### Riscos monitorados e notas da verificação do bloco B (2026-11-03)

- **Transitivos sem manutenção:** quatro dependências indiretas (`lie`, `immediate`, `is-promise` e `promise-worker-transferable`, que vêm do `@monogrid/gainmap-js`/`three`) têm pouca ou nenhuma atividade recente. Risco aceito e monitorado: o `npm audit` continua limpo; reavaliar a cada atualização do `model-viewer` e antes de produção.
- **CSP (etapa 8), além do que já está anotado:** o Lit usa `adoptedStyleSheets` (ou `<style>` com `litNonce` quando não há suporte) e o `model-viewer` pode criar imagens `data:`; prever `img-src data: blob:` e, se a CSP exigir nonce de estilo, definir `litNonce`. Conferir com o GLB real.
- **Avisos de licença de terceiros:** a Apache-2.0 do `model-viewer` pede a manutenção dos avisos; o arquivo `public/licencas-de-terceiros.txt` fica para a etapa 9 (item no plano).
- **Monitoração futura:** quando houver monitoração de erros, o 3D registra **só um código de erro** (por exemplo `3d:load`, `3d:contexto`, `3d:tempo`, `3d:chunk`), nunca a URL, o `src` nem a mensagem da biblioteca.
- **Validador de GLB:** agora recusa `uri` (inclusive `data:`) em qualquer buffer e exige um único buffer (o pedaço BIN), para o GLB não puxar arquivo externo.
