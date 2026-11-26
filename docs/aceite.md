# Checklist de aceite da §14

Este documento responde, item por item, à pergunta: "a loja está como a spec pede?". Ele reúne o estado de cada item, a prova, os desvios aprovados pelo dono, os roteiros das conferências que só uma pessoa faz e o checklist da publicação real.

Atualizado em 2026-11-26 (tarefa 18 da etapa 9). Detalhe técnico das provas automáticas: [aceite-evidencias.md](aceite-evidencias.md).

Legenda de estado:

- ✅ conforme;
- ⚠️ conforme com desvio aprovado pelo dono (o desvio está nas [tabelas da seção 2](#2-desvios));
- ⚠️⏳ desvio a confirmar: o item depende de um desvio que ainda não tem decisão do dono (ver [2.4](#24-desvios-aguardando-decisão-do-dono));
- ⏳ depende do dono.

Legenda das provas: U = teste unitário ou de componente (Vitest); E = teste e2e (Playwright); A = axe (acessibilidade); V = regressão visual (só no Docker e no CI); G = conferência do `guardiao-do-design` (tarefa 15). Escopo: 4 telas do protótipo (Home, Catálogo, Produto do Canastra e painel de Atendimento, a 1440 e 390 px, com os textos lidos letra a letra); as demais telas ficam por asserções e2e.

## 1. Os 13 itens da §14

Veredito da tarefa 15 (`guardiao-do-design`): itens 1 a 9, 11 e 13 conformes ou com desvio (os desvios sem decisão do dono estão marcados ⚠️⏳). Os itens 10 e 12 não têm conferência visual e se apoiam nos testes. As capturas da regressão visual (`e2e/visual`) estão inalteradas no Git (`git status` limpo nelas); a conferência não foi rodada de novo no Docker nesta rodada.

| # | Item da §14 | Estado | Evidência | Observação |
| --- | --- | --- | --- | --- |
| 1 | Tokens de cor da §3.1 e nenhuma outra cor fora dos SVGs | ⚠️⏳ | U `lib/tokensDeCor.test.ts` (24 tokens iguais aos da spec, nenhuma cor literal nos 43 CSS, todo `var()` existe); G | Aprovado: P81 (borda dos campos em `--placeholder`, que é token). A confirmar: `color-mix` a 65% no estado desabilitado (desvio 11b; o D3 aprova só a opacidade) e as cores literais `#14110F` e `#C9A24B` de `app/opengraph-image.tsx`, que o teste não varre (ver [2.4](#24-desvios-aguardando-decisão-do-dono)) |
| 2 | Cormorant Garamond e Manrope com os pesos indicados | ✅ | E `e2e/aceite.spec.ts` "fontes e pesos da §3.2" (faces carregadas, peso, família e tamanho computados por papel); G | |
| 3 | Home com 9 seções na ordem e espaçamentos exatos (48/96, 112, 128) | ✅ | E `e2e/home.spec.ts` ("mostra as seções da §5 na ordem", "espaçamentos exatos da §5 a 1440 px"); V `home-1440` e `home-390`; G | As 9 seções são a §5.2 a §5.10: 8 `<section>` em `main` (§5.2 a §5.9) mais o rodapé (§5.10). A faixa de aviso é a §5.1 e não entra na contagem |
| 4 | Hero: h1 em 76 px com "escolhidos à mão." em itálico dourado; ilustração A.3; pílula "Arraste para girar"; etiqueta do Canastra no canto inferior direito | ✅ | E `e2e/home.spec.ts` e `e2e/aceite.spec.ts` (h1 76 px, `em` itálico 500, pílula, etiqueta colada ao canto, SVG A.3); U `components/ilustracoes/ilustracoes.test.tsx`; V; G | O 3D no hero depende do primeiro GLB real (R12) |
| 5 | Faixa de confiança com 4 itens e ícones dourados | ✅ | E `e2e/aceite.spec.ts` (região "Garantias", 4 títulos, cor `rgb(201, 162, 75)` nos ícones); U `components/icons.test.tsx`; V; G | |
| 6 | Catálogo com 10 queijos, filtro Todos (10) / Brasil (7) / Mundo (3), refletido na URL | ✅ | E `e2e/catalogo.spec.ts`; U `lib/catalogo.test.ts`, `FiltroOrigem.test.tsx`, `GradeDeQueijos.test.tsx`; V `catalogo-*`; A; G | |
| 7 | Produto: "Ver por dentro" (rótulo fixo, `aria-pressed`), indicador POR DENTRO / PEÇA INTEIRA, formatos mudam preço e Pix, abas funcionam | ⚠️ | U `CheeseViewer.test.tsx`, `PainelDeCompra.test.tsx`, `ProductTabs.test.tsx`; E `e2e/produto.spec.ts`, `produto-teclado.spec.ts`, `visualizador.spec.ts`; V `produto-canastra-*`; G | Desvios: P21/D6 (rótulo fixo), dica do palco sem "Arraste para girar", Girar no celular com GLB, textos do 3D. O modelo 3D real continua ⏳ (R12) |
| 8 | Mobile: barra fixa com preço e "Adicionar à sacola"; botão flutuante acima dela | ✅ | E `e2e/produto.spec.ts` (390 px: barra fixa e botão 100 px acima do fundo; barra não cobre o rodapé; 1440 px sem barra), `adicionar.spec.ts`; V `produto-canastra-390`; G | Teste em celular físico: sem roteiro (ver [pendência](#4-o-que-ficou-a-confirmar)); é recomendável, mas não é exigido pela spec |
| 9 | Painel de atendimento: duas abas, roteiro do assistente, horário, botão verde do WhatsApp com mensagem pré-preenchida | ⚠️⏳ | E `e2e/atendimento.spec.ts`, `e2e/whatsapp.spec.ts`; U `Atendimento*.test.tsx`, `SupportPanel.test.tsx`, `lib/whatsapp.test.ts`, `lib/roteiro.test.ts`; V `atendimento-*`; A; G | Aprovados: P80 e P84. A confirmar: resposta rápida de 36 px (desvio 37, ver [2.4](#24-desvios-aguardando-decisão-do-dono)). O número do WhatsApp é fictício (D26): abrir o link num WhatsApp real depende do número definitivo (R1). NVDA: ⏳ ([roteiro A](#a-nvda-leitor-de-tela-no-windows)) |
| 10 | Sacola com contador, barra de frete grátis (R$ 180) e desconto de 5% no Pix | ✅ | U `lib/commerce.test.ts` (R$ 180 exatos é grátis; 17999 mostra "Faltam R$ 0,01"; Pix), `lib/sacola.test.ts`, `SacolaProvider.test.tsx`, `ConteudoDaSacola.test.tsx`; E `adicionar.spec.ts`, `pagina-sacola.spec.ts`, `sacola.spec.ts`, `checkout-pagamento.spec.ts`; V `sacola-*` | Sem protótipo; conferência por tokens e padrões (PLANO). Frete, prazo e parcelas são simulados (D28), fora do escopo deste item |
| 11 | Textos idênticos aos da spec, incluindo as lacunas entre colchetes | ⚠️ | E asserções de texto em `home`, `catalogo`, `produto`, `layout-global`, `not-found`, `aprenda`, `presentes`, `produtores`; U `lib/lacunas.test.ts`, `data/*.test.ts`; V congela o texto renderizado; G (letra a letra) | Não há comparação automática spec × página; a prova é do guardião, só nas 4 telas do protótipo; as demais telas ficam por asserções e2e. Os desvios de texto estão na seção 2. As lacunas continuam visíveis (R2); os valores fictícios de D26 a D29 as substituem só nos dados de negócio |
| 12 | Sem rolagem horizontal de 360 a 1920 px | ✅ | E `e2e/aceite.spec.ts` (360, 390, 768, 1024, 1440 e 1920 px × todas as rotas do `sitemap.xml` + `/sacola`, `/checkout`, `/queijos?origem=mundo` e 404; sacola, checkout e painel abertos); antes: `layout-global`, `home`, `produto`, `atendimento`, `pagina-sacola` | Larguras entre as testadas e aparelhos reais não foram medidas |
| 13 | Comparação visual lado a lado com o protótipo a 1440 e 390 px, sem diferenças perceptíveis | ⚠️ | G (Home, Catálogo, Produto, painel); V `e2e/visual/telas.spec.ts` (22 capturas, `maxDiffPixelRatio: 0`) protege contra regressão, mas não compara com o protótipo | Desvio: A1 (borda do cabeçalho). O dono pode fazer a leitura final lado a lado com `design/Ateliê do Queijo — Telas.html` |

Resumo: 8 itens ✅ (2, 3, 4, 5, 6, 8, 10 e 12), 3 itens ⚠️ com desvio aprovado (7, 11 e 13) e 2 itens ⚠️⏳ com desvio a confirmar (1 e 9), total 13. O item 13 só depende do A1, já aprovado. Nenhum item da §14 fica só em ⏳; os ⏳ estão nas conferências humanas (seção 3) e na fase 2 (seção 5).

## 2. Desvios

As subseções 2.1 a 2.3 só trazem o que tem decisão do dono (número e data). O que não tem decisão registrada no `docs/PLANO.md` está na [2.4](#24-desvios-aguardando-decisão-do-dono); nenhuma referência foi inventada. A numeração dos desvios foi mantida, por isso há saltos (11b, 28, 35 e 37 estão na 2.4).

### 2.1 Desvios e textos novos aprovados

| # | Onde | Desvio ou acréscimo | Decisão do dono |
| --- | --- | --- | --- |
| 1 | §7.2, botão de corte do 3D | Rótulo fixo **Ver por dentro** com `aria-pressed` e `role="toolbar"`; o indicador POR DENTRO / PEÇA INTEIRA continua alternando (a spec pede rótulo alternado) | P21, 2026-10-27; confirmado no D6, 2026-11-03 |
| 2 | §7.2, giro sem GLB | **Girar** desabilitado sem GLB, com o texto só para leitor de tela "Giro disponível com o modelo 3D" | P39 = C, 2026-11-03 (etapa 5, bloco A) |
| 3 | §7.2, tela cheia | Sem a Fullscreen API, texto só para leitor de tela "Tela cheia indisponível neste navegador" | Etapa 5, 2026-11-03 |
| 4 | §7.2, dica do palco | Sem GLB a dica é só "Toque duas vezes para aproximar"; "Arraste para girar" só aparece com GLB | Etapa 5, 2026-11-03 |
| 5 | §7.5, legenda do 3D | 13 px, `--palha`, centralizada; textos "Preparando a peça…" e "Seu navegador não exibe o 3D. Veja as fotos abaixo." | P41 = A, 2026-11-03 |
| 6 | §7.6, botão Girar | **Girar** também no celular, só quando o queijo tem GLB; o giro automático para na primeira interação (WCAG 2.2.2) | Decisão (a) do bloco B, 2026-11-03 |
| 7 | §7.2, botões novos | **Girar à esquerda** e **Girar à direita** (passo de 30°, WCAG 2.5.7) e o texto "Disponível quando a peça estiver pronta" | Decisão (b) do bloco B; textos aprovados em 2026-11-03 |
| 8 | Textos do `model-viewer` | Rótulos traduzidos (P42) e anúncio "Peça pronta. Use Girar à esquerda ou à direita." | P42 = A, aprovado em 2026-11-03 |
| 9 | §10.2, confirmação | Mostra **Pedido nº AQ-…** acima do título | D4, 2026-11-03 (revoga o P36) |
| 10 | §10, tipografia do checkout | h2 28 px, resumo de erros 18 px, "Resumo do pedido" 22 px, legenda 12 px com `0,14em` | D5, 2026-11-03 |
| 11a | Estado desabilitado e pendente | Opacidade `.65` em vez de `.5` (só isso é do D3). A mistura `color-mix` está em 11b, a confirmar | D3, 2026-11-03 |
| 12 | Formatos só com peso | "Meia peça" (~500 g) e "Fração" (~250 g) | D12, 2026-11-03 |
| 13 | Indicador de etapas do checkout | `gap` de 16 px abaixo de 400 px | D13, 2026-11-03 |
| 14 | Mensagens do frete | Hífen e espaço sem quebra em "01310-100" e "e-mail" | D14, 2026-11-03 |
| 15 | §4.9, rodapé | "Entregas refrigeradas", "Trocas e devoluções" e "Perguntas frequentes" são texto sem link | D18, 2026-11-03 |
| 16 | §4.1, cabeçalho | **Buscar** e **Minha conta** removidos até existirem as funções | D19, 2026-11-03 |
| 17 | §7.2, AR | **Ver na mesa** oculto até haver GLB real | D23, 2026-11-03 |
| 18 | Textos novos | Textos visíveis do checkout (D7), textos só para leitor de tela (D8), "Nota fiscal sem valor visível ao presenteado." (D9), modelo de texto do quiz (D11) | D7 a D9 e D11, 2026-11-03 |
| 19 | §3.3, §5.9, §7.2 (CEP), §8.2 e checkout | Borda dos campos em `--placeholder` em vez de `--pedra-clara` | P81 = B, 2026-11-05 (revoga o D2) |
| 20 | Gatilho do painel de atendimento | Cursor de espera e `aria-busy` enquanto o painel baixa | P80 = A, 2026-11-05 |
| 21 | Trilha, alvo de toque | Zona de toque invisível de pelo menos 24 × 24 px, sem mudança visual (WCAG 2.5.8) | P82 = A, 2026-11-05 |
| 22 | Trilha, espaçamento | `gap: 4px 8px`; com a trilha em duas linhas (até ~390 px) o conteúdo desce 4 px | Dono, 2026-11-11 |
| 23 | Perfil sensorial | Seta `aria-hidden` e texto " a " só para leitor de tela ("suave a marcante"); nada muda visualmente | Dono, 2026-11-11 |
| 24 | Aviso de erro com o painel fechado | Fica 10 s; "Adicionado à sacola. Boa escolha." segue em 4 s (P26) | Dono, 2026-11-11 |
| 25 | Textos do P84 | `depoisDaAcao` do assistente, erro ao carregar o atendimento e aba Queijista sem número (textos 1.1, 2.1 e 3.1) | P84 (variante do C), 2026-11-05 |
| 26 | Imagem de compartilhamento e ícone | Gerados só com o A.2 e o A.1 e as cores da §3.1, sem texto (a spec não define) | P70 = A, 2026-11-05 |
| 27 | Descrição de `/produtores` | Só a primeira frase literal da §12 (metadado, nada visível muda) | P72 (a) = A, 2026-11-05 |
| 29 | §12, Presentes | Sem filtros (Ocasião, Faixa de preço, Tamanho) enquanto houver só três kits com R$ [PREÇO] | P54 = A, 2026-11-05 |
| 30 | §12, Presentes | Kits sem botão nem página própria (cartão igual ao da Home) | P55 = A, 2026-11-05 |
| 31 | §12, Produtores | Sem página de produtor; o link leva a `/queijos/<slug>` | P63 = A, 2026-11-05 |
| 32 | §7.4 | "Combina com este queijo", "Avaliações" e "Outros queijos da mesma região" continuam fora | P67 = A, 2026-11-05 |
| 33 | Regressão visual | Capturas de referência geradas no Linux (Docker, imagem do Playwright); no Windows diferem | P79 = A, 2026-11-05 |
| 34 | Lighthouse, TBT da Home | 296 ms de mediana, acima dos 200 ms do laboratório; Desempenho 94 (meta de 90). A pré-busca do painel fica | TBT A, 2026-11-17 |
| 36 | Lighthouse, Acessibilidade 96 | Só o contraste dos `[FOTO: …]` (4,47:1), exceção do axe | D34, 2026-11-03 |

### 2.2 Dados fictícios aprovados (trocar antes de publicar)

| # | Dado | Decisão do dono |
| --- | --- | --- |
| 38 | WhatsApp `5520900000000` (D26) | D26, 2026-11-03 |
| 39 | CNPJ e endereço do rodapé em vez das lacunas da §4.9 (D27) | D27, 2026-11-03; reafirmada em 2026-11-17 (item 1A: a D27 prevalece sobre a §4.9) |
| 40 | Frete, prazo e parcelas fictícios (D28) | D28, 2026-11-03 |
| 41 | `[NOME DO PRODUTOR]` e `[ANO]` do Canastra (D29) | D29, 2026-11-03 |
| 42 | Fotos `[FOTO: …]` com contraste de 4,47:1 (D34), a rever antes de publicar | D34, 2026-11-03 |

A trava `DADOS_FICTICIOS_ATIVOS` em `data/ficticio.ts` impede o build de produção com esses valores.

### 2.3 Desvio de leitura do protótipo

| # | Onde | Desvio | Decisão do dono |
| --- | --- | --- | --- |
| A1 | Cabeçalho | A borda inferior vai de ponta a ponta a 1440 px; o protótipo a limita ao contêiner de 1264 px. Mantida como está | P97, 2026-11-26 (registrada no PLANO) |

### 2.4 Desvios aguardando decisão do dono

Sem decisão registrada. Os itens 1 e 9 da seção 1 ficam ⚠️⏳ por causa deles. Cabe ao dono aprovar, mandar corrigir ou registrar a decisão no `docs/PLANO.md`.

| # | Onde | Desvio | Situação |
| --- | --- | --- | --- |
| 11b | Estado desabilitado e pendente | `color-mix` a 65% sobre tokens (`--creme`, `--pedra-clara` e `transparent`) em três regras de `CheeseViewer.module.css` e `QuantityStepper.module.css`: cores intermediárias que a spec não prevê. O teste de tokens permite | O D3 aprova só a opacidade `.65`; o `color-mix` não tem decisão. A confirmar |
| 28 | Imagem de compartilhamento | Ampliação 3× do símbolo A.2 em contêiner quadrado, porque a spec não fixa a largura | Aprovado só pelo `guardiao-do-design` (bloco A, etapa 8); sem decisão do dono |
| 35 | Lighthouse, SEO 63 a 66 | Só `is-crawlable`, que falha de propósito fora de produção (e na sacola e no checkout, sempre) | Decisão de projeto, sem número no PLANO; conferir SEO 100 em produção (R10). Sem decisão do dono |
| 37 | Assistente, respostas rápidas | 36 px de altura (WCAG 2.5.8 atendida, mais de 24 px); sem zona de 44 px porque o espaçamento de 6 px as sobreporia | O PLANO registra a exceção, sem número nem data de decisão. A confirmar |
| O1 | `app/opengraph-image.tsx` | Cores literais `#14110F` e `#C9A24B` (iguais a `--cave` e `--ouro`), fora do alcance do teste de tokens; se o token mudar, a imagem não acompanha | Achado da tarefa 14, sem decisão. A confirmar |

## 3. Conferências que só uma pessoa faz

Decisão P94 = A (2026-11-17): o dono faz as duas agora. Cada uma leva uns 10 minutos. Os resultados começam ⏳ e passam para ✅ quando a tabela de registro for preenchida sem erro. Se P94 mudar para B, elas viram pendência da fase 2 (R10).

### A. NVDA (leitor de tela no Windows)

Objetivo: ouvir o que o leitor de tela anuncia ao abrir o atendimento, com a internet lenta e com a internet caída.

**Preparar**

1. Baixe e instale o NVDA, gratuito, em nvaccess.org.
2. Abra com Ctrl+Alt+N.
3. Ctrl silencia a fala na hora. Insert+Q fecha o NVDA.
4. Abra o site no Chrome ou no Edge (a versão local ou o Preview).

**Parte 1: internet lenta**

1. Aperte F12 para abrir as ferramentas do navegador.
2. Aba **Rede** (Network), campo de velocidade: escolha **3G lento**.
3. Recarregue a página com Ctrl+Shift+R.
4. Aperte Tab até chegar ao botão de atendimento e aperte Enter.

Esperado:

- o NVDA diz "Abrindo o atendimento…" **uma vez**;
- o painel abre e o foco entra nele;
- Esc fecha o painel e o foco volta ao botão de atendimento.

**Parte 2: falha ao carregar**

1. Com o 3G lento ainda marcado, recarregue a página.
2. Assim que a página aparecer, marque **Offline** (mesmo campo de velocidade).
3. Aperte Tab até o botão de atendimento e aperte Enter.
4. Escute por 10 segundos.

Esperado:

- o NVDA diz "Não conseguimos abrir o atendimento agora. Confira sua conexão e tente de novo em instantes.";
- o painel não fica aberto;
- o foco continua no botão;
- ao desmarcar **Offline** e apertar Enter de novo, o painel abre normalmente.

Se o painel abrir normalmente (o arquivo já tinha sido baixado, porque o site o carrega em segundo plano quando fica ocioso), repita mais depressa: marque **Offline** logo que a página aparecer. Se mesmo assim não reproduzir, anote "não reproduzido". Esse caso já é coberto por `components/Atendimento.falha.test.tsx` e `components/Atendimento.foco.test.tsx`.

**Registro**

| Data | Quem fez | Navegador e versão do NVDA | Parte 1 (ok ou o que ouviu) | Parte 2 (ok, falha ou "não reproduzido") |
| --- | --- | --- | --- | --- |
| | | | | |

Estado: ⏳

### B. Teste de pesquisa aprimorada do Google

Objetivo: conferir se os dados estruturados (JSON-LD) das duas páginas são lidos pelo Google sem erro. Você cola o código, sem publicar nada.

**Gerar o HTML local**

1. Na pasta do projeto, rode `npm ci`.
2. Rode o build com a permissão para dados fictícios (o `next.config.ts` exige `PERMITIR_DADOS_FICTICIOS=1` em todo build):
   - PowerShell: `$env:PERMITIR_DADOS_FICTICIOS="1"; npm run build`
   - Git Bash: `PERMITIR_DADOS_FICTICIOS=1 npm run build`
3. Os dois arquivos ficam em:
   - `.next\server\app\index.html` (Home);
   - `.next\server\app\queijos\canastra-curado.html` (Canastra curado).

**Testar**

1. Abra search.google.com/test/rich-results.
2. Escolha a aba **Código** (não "URL").
3. Abra o arquivo da Home no Bloco de Notas, copie **o texto inteiro** e cole no campo.
4. Clique em **Testar código**. Não abra o **Preview**.
5. Repita com o arquivo do Canastra.

Esperado:

- **Home:** itens `Organization` e `WebSite`, sem erros;
- **Canastra:** itens `Product` (com ofertas) e `BreadcrumbList`, sem erros;
- avisos são aceitáveis enquanto CNPJ, endereço, logotipo e imagem forem fictícios ou estiverem ausentes: anote o texto de cada um;
- se aparecer um erro em vermelho, copie a mensagem e leve ao `performance-e-seo`.

**Registro**

| Data | Quem fez | Página | Itens detectados | Erros | Avisos |
| --- | --- | --- | --- | --- | --- |
| | | `/` | | | |
| | | `/queijos/canastra-curado` | | | |

Estado: ⏳

## 4. O que ficou a confirmar

Os desvios sem decisão (11b, 28, 35, 37 e o O1) estão na [seção 2.4](#24-desvios-aguardando-decisão-do-dono). Demais pontos em que a referência ou a decisão do dono não consta no `docs/PLANO.md`:

1. **Desvios 6 e 7 (Girar no celular, botões de giro):** o PLANO os registra como "decisão (a)" e "decisão (b)" do bloco B, dentro da seção de 2026-11-03. A data foi tomada do cabeçalho do bloco.
2. **Pontos abertos do bloco B, ainda sem decisão do dono:** "Veja as fotos abaixo" não aponta para fotos no celular (miniaturas ocultas); com economia de dados não há como pedir o 3D à mão; +4 px de respiro entre o SVG e a barra com GLB.
3. **Teste em celular físico (item 8):** a evidência de testes citava o "roteiro da tarefa 16", mas o roteiro da tarefa 16 cobre só o NVDA e o validador do Google. Falta decidir se haverá um roteiro de celular.
4. **P94:** confirmado como A em 2026-11-17 (PLANO). Os resultados das duas conferências seguem ⏳ até o dono preencher as tabelas.
5. **Calibração do Lighthouse (tarefa 9), as 4 conferências do painel da Vercel (tarefa 11), a LGPL do libvips e a validação do aviso de privacidade:** pendentes, listadas abaixo.

## 5. Checklist de publicação (fase 2)

Conforme a fase 2 da etapa 9 do `docs/PLANO.md` (R1 a R12), mais os pendentes da fase 1. Nada daqui começa sem o dado e a aprovação do dono. Ordem recomendada.

### 5.1 Pendências da fase 1 (antes de tudo)

- [ ] **Tarefa 11, painel da Vercel (dono, ~5 min).** Passo a passo em [ambiente.md](ambiente.md#o-que-conferir-no-painel-da-vercel-ação-do-dono-5-min). Avisar o resultado de cada um:
  - [ ] Deployment Protection ligada em Preview.
  - [ ] Toolbar desligada em Preview.
  - [ ] `PERMITIR_DADOS_FICTICIOS` só em Preview (e `WHATSAPP_NUMBER` sem o número fictício).
  - [ ] Node 24 no log de build do Preview.
- [ ] **Tarefa 9, calibração do Lighthouse.** Depois de 5 execuções manuais no CI, comparar com as medianas locais e decidir entre `error` e meta com margem. A meta do projeto (desempenho 90 ou mais) não muda. Os resultados ficam em tabela no PLANO e no `lighthouserc.json`.
- [ ] **Conferências humanas** da seção 3 (NVDA e Google), se ainda abertas.
- [ ] **Timeout do job e2e do CI:** hoje `timeout-minutes: 8` (`.github/workflows/ci.yml`). Recalibrar medindo uma execução com o spec novo (`e2e/aceite.spec.ts`): a medir no próximo CI.

### 5.2 Fase 2

- [ ] **R1. Dados reais:** número real do WhatsApp, CNPJ, endereço, produtor e ano. **Remover** os valores de `data/ficticio.ts` (não substituí-los ali) e atualizar os testes que os citam.
- [ ] **R2. Lacunas:** `[A DEFINIR …]` (9 fichas, artigos, categoria, queijos citados), `[TEXTO DO ARTIGO]`, `R$ [PREÇO]` dos kits, `[n]`, `[N]`, `[SELO E NÚMERO]`, `[DATA]` e fotos reais (`[FOTO: …]`, D34: ao entrar as fotos, o contraste de 4,47:1 deixa de ser exceção).
- [ ] **GLB real** do Canastra: giro, luz de ~3200 K e ambiente HDR da §11, medida de LCP e CLS do produto, e o 3D no hero e no cartão (R12). Quando **Ver na mesa** (AR) voltar (D23), revisar a `Permissions-Policy` e a CSP.
- [ ] **R3. Texto de saúde** do assistente validado por profissional.
- [ ] **R4. Gateway (D32, Mercado Pago):** ADR, tokenização, webhooks assinados, idempotência, segredos `server-only`, revisão da CSP (ADR-0015), limite de taxa (P75), parcelas validadas no servidor e remoção de `recusa@exemplo.com`. Webhooks (R4):
  - [ ] proteção contra replay (janela do `ts`);
  - [ ] conferência do valor e do pedido contra o total recalculado no servidor;
  - [ ] número de pedido único no banco;
  - [ ] o `AQ-…` de exibição nunca vale como prova de posse do pedido.
- [ ] **R5. Frete real** (transportadora, tabela, prazo, área) no lugar do D28, com limite de taxa e segredos do serviço de frete só no servidor.
- [ ] **R6. LGPD:** rascunho [privacidade-rascunho.md](privacidade-rascunho.md) validado por profissional de direito (as perguntas estão no fim do arquivo); página do aviso e **link visível antes de "Confirmar pedido"**, com texto aprovado; decisão sobre o telefone obrigatório e sobre os dados do presenteado. Ver também os itens de R6 abaixo.
- [ ] **Newsletter real ou retirada, sem exceção (bloqueia a publicação).** A tela diz "Você vai receber os próximos lotes raros" e nada é gravado (D25): a promessa é falsa hoje.
- [ ] **R6, detalhes:**
  - [ ] preencher as lacunas do aviso de privacidade;
  - [ ] canal do titular ativo e testado;
  - [ ] DPA e região da Vercel conferidos;
  - [ ] link do aviso no rodapé e no formulário da newsletter;
  - [ ] roteiro de incidente (Res. CD/ANPD nº 15/2024);
  - [ ] registro das operações de tratamento (art. 37 da LGPD).
- [ ] **Dependências e segredos:**
  - [ ] `npm audit --omit=dev` e `npm audit signatures` sem alta ou crítica;
  - [ ] resolver os PRs do Dependabot #2, #4 e #6;
  - [ ] varrer segredos no histórico do Git (o repositório é público);
  - [ ] `.env*` no `.gitignore`;
  - [ ] nenhuma `NEXT_PUBLIC_` com segredo.
- [ ] **Cabeçalhos no domínio final:** CSP, HSTS (decidir `includeSubDomains` e `preload`), `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy` e `X-Frame-Options`.
- [ ] **Server Actions atrás do domínio final:** conferir `serverActions.allowedOrigins` se houver proxy.
- [ ] **LGPL do libvips** (`@img/sharp-libvips-*`, LGPL-3.0): se o `sharp` chegar ao bundle do servidor, incluir o texto da LGPL-3.0 e validar com profissional de direito. Decisão do dono antes de publicar.
- [ ] **R7. Remover as travas** de dados fictícios (seção "Para liberar a publicação" em [ambiente.md](ambiente.md)) e `PERMITIR_DADOS_FICTICIOS` da Vercel, da CI e do Playwright.
- [ ] **R8. Vercel:** plano **Pro** (o Hobby só vale para uso pessoal ou não comercial; uma loja é uso comercial; custo e decisão do dono), domínio próprio, `NEXT_PUBLIC_SITE_URL` final e `WHATSAPP_NUMBER` em Production.
- [ ] **R9. Dados de visitantes** (P95) e monitoramento de erros, se o dono quiser, com ADR e depois do aviso de privacidade.
- [ ] **R10. Aceite em produção:** Lighthouse com SEO 100 nas páginas públicas (sacola e checkout ficam em 63 por projeto), validador do Google no endereço público, Search Console (conta do dono) e NVDA se ficou para cá.
- [ ] **R11. PR `main` para `producao`** aberto e **aprovado pelo dono**. No primeiro deploy, conferir `VERCEL_ENV=production`, `robots.txt` liberado, sitemap e ausência de dado fictício.
- [ ] **Releitura deste documento:** trocar os estados ⚠️ e ⏳ que mudarem (por exemplo, o item 9 com o WhatsApp real) e remover da tabela de desvios o que deixar de existir (por exemplo, os dados fictícios).
