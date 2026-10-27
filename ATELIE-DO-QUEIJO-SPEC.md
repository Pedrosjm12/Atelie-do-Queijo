# Ateliê do Queijo — Especificação de implementação

> **Para o Claude Code.** Este documento descreve, com valores exatos, o protótipo aprovado do site **Ateliê do Queijo**: uma loja online de queijos finos brasileiros e importados, com tema escuro ("a cave"), queijos exibidos como objetos 3D giráveis, compra direta e atendimento por assistente virtual e WhatsApp.
>
> Seu trabalho é **reproduzir o protótipo com fidelidade de pixel**: cores, tipografia, espaçamentos, raios, textos e comportamento descritos aqui são decisões tomadas, não sugestões. Quando este documento disser um valor (ex.: `padding: 48px 32px 96px`), use exatamente esse valor. Quando algo não estiver especificado, siga o padrão mais próximo já definido aqui em vez de inventar um estilo novo. Textos entre colchetes, como `[PREÇO]` ou `[NOME DO PRODUTOR]`, são lacunas que o dono do site ainda vai preencher: mantenha-os visíveis exatamente assim.

---

## 0. Como trabalhar com este documento

**Ordem de construção recomendada**

1. Criar o projeto (seção 2) e os tokens de design (seção 3).
2. Construir os componentes globais (seção 4).
3. Construir as páginas na ordem: Home → Catálogo → Produto → painel de Atendimento (seções 5 a 8).
4. Ligar dados e estado (seções 9 e 10).
5. Implementar as páginas ainda não prototipadas usando os textos da seção 12 e os mesmos componentes.
6. Passar pelo checklist de aceite (seção 14).

**Regras de fidelidade**

- Todas as medidas em `px` referem-se a um viewport de desktop de **1440 px** de largura. O conteúdo fica num contêiner de no máximo **1200 px**, centralizado, com **32 px** de respiro lateral.
- Não adicione gradientes de fundo, sombras em cartões, emojis, cantos diferentes dos especificados ou cores fora da paleta.
- As ilustrações dos queijos são SVGs fornecidos no **Apêndice A**. Copie-os literalmente. Eles funcionam como *fallback* e pré-visualização até existirem os modelos 3D reais (seção 11).
- O idioma do site é **português do Brasil** (`<html lang="pt-BR">`). Preços no formato `R$ 136,00` (vírgula decimal, espaço depois de `R$`).

---

## 1. Visão geral

| Item | Definição |
| --- | --- |
| Nome | Ateliê do Queijo |
| Assinatura | Queijos de autor, escolhidos à mão. |
| Conceito visual | "A cave": sala escura de maturação, luz quente e dourada caindo só sobre o queijo. O 3D é o protagonista. |
| Público | Apreciadores, presenteadores e iniciantes curiosos |
| Entrega | Brasil inteiro, refrigerada |
| Frete grátis | Pedidos acima de **R$ 180** |
| Desconto | **5% no Pix** |
| Atendimento humano (WhatsApp) | Segunda a sexta, 9h às 18h · sábado, 9h às 15h · sem atendimento aos domingos |
| Assistente virtual | 24 horas |

**Mapa do site**

```
Home (landing page)
├── Queijos (catálogo "A cave")  → Produto (3D, corte, frete)
├── Presentes                     → Kit (cartão, data)
├── Aprenda ("Escola do Ateliê")  → Artigo (queijos citados)
├── Nossos produtores / Sobre     → Produtor (seus queijos)
├── Conta (pedidos, dados)
└── Sacola → Checkout → Confirmação

Em todas as páginas: botão flutuante de atendimento (Assistente do Ateliê + WhatsApp)
```

---

## 2. Stack e estrutura

Use esta stack, salvo se o repositório já tiver outra definida:

- **Next.js** (App Router) + **TypeScript** + **React**.
- **CSS com variáveis** (`app/globals.css` com os tokens da seção 3) e **CSS Modules** por componente. Não use frameworks de UI prontos: o visual é todo próprio.
- **Fontes** via `next/font/google`: `Cormorant_Garamond` (pesos 500 e 600, estilos normal e itálico) e `Manrope` (pesos 400, 500, 600, 700).
- **3D**: `@google/model-viewer` para os modelos `.glb` (seção 11), com o SVG do Apêndice A como fallback.
- **Estado da sacola**: contexto React (ou Zustand) persistido em `localStorage`.
- **Pagamento e frete**: deixar uma camada de serviço (`lib/commerce.ts`) com funções simuladas (`calcularFrete(cep)`, `criarPedido(sacola)`). A integração real (Shopify Storefront API, Mercado Pago ou Pagar.me, com Pix) é um passo posterior; não implemente cobranças reais.

**Estrutura sugerida**

```
app/
  layout.tsx            # fontes, <html lang="pt-BR">, AnnouncementBar, Header, Footer, SupportFab
  globals.css           # tokens + reset
  page.tsx              # Home
  queijos/page.tsx      # Catálogo
  queijos/[slug]/page.tsx  # Produto
  presentes/page.tsx
  aprenda/page.tsx
  produtores/page.tsx
  sacola/page.tsx
  checkout/page.tsx
components/
  Logo.tsx  Header.tsx  AnnouncementBar.tsx  Footer.tsx  SupportFab.tsx  SupportPanel.tsx
  Button.tsx  Seal.tsx  Overline.tsx  ProductCard.tsx  CheeseIllustration.tsx
  CheeseViewer.tsx  FormatPicker.tsx  QuantityStepper.tsx  ShippingCalculator.tsx
  SensoryProfile.tsx  ProductTabs.tsx  Quiz.tsx  PhotoPlaceholder.tsx  icons.tsx
data/
  cheeses.ts            # os 10 queijos (seção 9)
lib/
  commerce.ts  whatsapp.ts  format.ts
public/models/          # .glb futuros
```

---

## 3. Design tokens

### 3.1 Cores

Copie para `:root` em `globals.css`:

```css
:root {
  /* Fundos */
  --cave: #14110F;            /* fundo principal */
  --carvao: #1E1A17;          /* cartões, painéis, barra fixa */
  --cave-funda: #191512;      /* palco do 3D, placeholders de foto */
  --cave-quiz: #1A1613;       /* caixa do quiz, faixas de destaque */
  --rodape: #110E0C;          /* fundo do rodapé */
  --ardosia: #241F1B;         /* base de ardósia sob o queijo */

  /* Linhas */
  --pedra: #2E2823;           /* bordas e divisórias padrão */
  --pedra-clara: #4A4038;     /* borda de botões secundários e campos */
  --pedra-ardosia: #3A322C;   /* contorno da ardósia e de amostras escuras */

  /* Texto */
  --creme: #F3EAD8;           /* texto principal e títulos */
  --palha: #B8A98F;           /* texto secundário, rótulos */
  --creme-suave: #D9CDB6;     /* parágrafos de descrição de produto */
  --placeholder: #8C8070;     /* texto de placeholders de foto, letras miúdas do rodapé */

  /* Acentos */
  --ouro: #C9A24B;            /* ACENTO ÚNICO: botão principal, preços, linhas de destaque */
  --casca: #A8642A;           /* selos de maturação */
  --casca-texto: #D9A06B;     /* texto de selos de maturação / cerveja */
  --mofo: #7E8B6A;            /* selos de origem e sobretítulos de seção "origem" */
  --mofo-texto: #B9C4A4;      /* texto de selos de origem, confirmações (frete, "responde na hora") */
  --vinho: #7A2E3B;           /* harmonização */
  --vinho-texto: #D98E9C;     /* rótulo "VINHO" na harmonização */
  --ouro-vidro: rgba(201, 162, 75, 0.12); /* fundo de opção selecionada */
  --vidro-escuro: rgba(20, 17, 15, 0.7);  /* pílula "Arraste para girar" sobre o 3D */

  /* WhatsApp (só no botão/ícone do WhatsApp, nunca como cor da marca) */
  --whatsapp: #25D366;
  --whatsapp-texto: #0B2A15;
}
```

**Regras de uso**

- O dourado `--ouro` aparece pouco: no máximo **um botão principal por bloco**, preços, sublinhados de links e bordas de destaque.
- Texto sobre fundo escuro é sempre `--creme` ou `--palha`. Texto sobre dourado é sempre `--cave`.
- O verde do WhatsApp só aparece no ícone e no botão "Falar com um queijista".
- `body { background: var(--cave); color: var(--creme); }`.

### 3.2 Tipografia

| Papel | Fonte | Peso | Tamanho / altura de linha | Extras |
| --- | --- | --- | --- | --- |
| Título da home (h1) | Cormorant Garamond | 500 | 76 px / 1.02 | `letter-spacing: -0.01em` |
| Título de página (catálogo h1) | Cormorant Garamond | 500 | 64 px / 1.05 | |
| Nome do queijo na página de produto (h1) | Cormorant Garamond | 500 | 56 px / 1.05 | |
| Título de seção (h2) | Cormorant Garamond | 500 | 48 px / 1.1 | newsletter: 44 px |
| Subtítulo de bloco (h2 do perfil sensorial) | Cormorant Garamond | 500 | 36 px | |
| Título de cartão grande | Cormorant Garamond | 600 | 34 px / 1.15 | |
| Nome do queijo em cartão, kit | Cormorant Garamond | 600 | 28 px / 1.1 | |
| Título de artigo | Cormorant Garamond | 600 | 26 px / 1.2 | |
| Preço grande (produto) | Cormorant Garamond | 600 | 40 px | cor `--ouro` |
| Corpo | Manrope | 400 | 16 px / 1.6 | |
| Texto de apoio do hero e subtítulos | Manrope | 400 | 18 px | cor `--palha` |
| Texto de cartão | Manrope | 400 | 14 px | cor `--palha` |
| Botões | Manrope | 600 | 15–16 px | |
| Sobretítulo (overline) | Manrope | 600 | 12 px | MAIÚSCULAS, `letter-spacing: 0.18em`, cor `--palha` |
| Sobretítulo pequeno (cartões) | Manrope | 600 | 11 px | MAIÚSCULAS, `letter-spacing: 0.18em` (0.16em no catálogo) |

- **Ênfase em itálico**: palavras de destaque nos títulos usam `<em>` em Cormorant itálico 500, na cor `--ouro`. Exemplos: "Queijos de autor, *escolhidos à mão.*", "Duas tradições, *uma mesma exigência.*", "Presentes que se abrem *como um ritual.*"
- Pilha de fallback: `'Cormorant Garamond', serif` e `'Manrope', system-ui, sans-serif`.

### 3.3 Espaço, raios e linhas

| Token | Valor |
| --- | --- |
| Largura máxima do conteúdo | 1200 px, `margin: 0 auto`, `padding-inline: 32px` |
| Espaço entre seções da home | 112 px antes de "Na cave esta semana"; 128 px antes de cada seção seguinte |
| Raio de cartão | 12 px |
| Raio do palco 3D e da caixa do quiz | 16 px |
| Raio de miniatura | 10 px |
| Raio de botões e selos | 999 px (pílula) |
| Raio de campo de CEP e botão "Calcular" | 10 px |
| Borda padrão | `1px solid var(--pedra)` |
| Borda de botão secundário / campo | `1px solid var(--pedra-clara)` |
| Borda de destaque | `1px solid var(--ouro)` |
| Alvo de toque mínimo | 44 × 44 px |
| Sombras | Nenhuma em cartões. Sombras só existem dentro das ilustrações SVG. |

### 3.4 Responsividade

O protótipo de desktop é fluido: os layouts usam `flex-wrap` e `grid` com `auto-fit`, então as colunas quebram sozinhas. Regras adicionais:

- **≤ 768 px**: o menu principal vira um botão "Menu" (ícone de três linhas, 44 px) à esquerda; o logotipo fica centralizado; a sacola à direita (layout da tela "Produto no celular", seção 7.6). Títulos com cerca de 60% do tamanho de desktop (h1 da home ≈ 46 px, h2 ≈ 32 px, h1 de produto 38 px).
- **≤ 768 px na página de produto**: preço e botão "Adicionar à sacola" ficam numa barra fixa no rodapé da tela (seção 7.6).
- Nunca deve haver rolagem horizontal da página.

---

## 4. Componentes globais

### 4.1 Logotipo

- **Símbolo**: uma cunha de queijo que forma a letra "A", em traço dourado, com três olhaduras. Código exato no Apêndice A.1. Tamanhos usados: 34 px (cabeçalho desktop), 24 px (cabeçalho mobile), 96 px (página de marca).
- **Nome**: "Ateliê **do** Queijo" em Cormorant Garamond 600, 27 px no cabeçalho (`letter-spacing: 0.01em`), com a palavra "do" em `<em>` itálico 500, **22 px**, cor `--ouro`. Proporção do "do": ~81% do tamanho do nome (21 px mobile → 17 px; rodapé 26 px → 21 px).
- Símbolo e nome lado a lado, `gap: 12px` (8 px no mobile), alinhados ao centro. O conjunto é um link para a Home.
- Variações do símbolo (Apêndice A.2): sobre dourado (traço `--cave`), sobre creme (traço `--cave`, olhaduras `--casca`), selo circular (círculo de 72 px com borda dourada e símbolo de 36 px dentro).

### 4.2 Faixa de aviso (AnnouncementBar)

- Acima do cabeçalho, em todas as páginas da loja.
- `border-bottom: 1px solid var(--pedra)`, `padding: 10px 16px`, texto centralizado, 12 px, `letter-spacing: 0.08em`, cor `--palha`.
- Texto: **Entrega refrigerada para todo o Brasil · Frete grátis acima de R$ 180 · 5% de desconto no Pix**

### 4.3 Cabeçalho (Header)

- Contêiner: `max-width: 1200px; margin: 0 auto; padding: 22px 32px; display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 20px;`
- Esquerda: logotipo (4.1).
- Centro: `<nav aria-label="Principal">` com os links **Queijos · Presentes · Aprenda · Nossos produtores**, 15 px, `gap: 32px`, sem sublinhado, cor `--creme`; hover `--ouro`. O link da seção atual fica em `--ouro`.
- Direita (`gap: 8px`):
  - Botão "Buscar" (ícone lupa 20 px, `aria-label="Buscar"`), 44 × 44, sem borda, fundo transparente.
  - Botão "Minha conta" (ícone usuário 20 px), 44 × 44.
  - Botão da sacola: altura 44, `padding: 0 16px`, borda `--pedra`, pílula, fonte 14 px, ícone sacola 18 px + texto "Sacola" + contador. O contador é uma pílula com fundo `--ouro`, texto `--cave`, 12 px, 600, `padding: 0 7px`. `aria-label="Sacola, N itens"`.
- **Home**: sem borda inferior no cabeçalho. **Catálogo e Produto**: `border-bottom: 1px solid var(--pedra)` e, no protótipo, só o botão da sacola à direita (mantenha também busca e conta se for simples; o essencial é a sacola).

### 4.4 Botões

| Variante | Estilo |
| --- | --- |
| Principal | Fundo `--ouro`, texto `--cave`, 600, pílula, sem borda. Altura mínima 52 px, `padding: 0 30px` (hero) / `0 32px` (quiz) / `0 28px` (newsletter). Pode ter seta → (18 px, traço 1.75) à direita, `gap: 10px`. |
| Secundário | Fundo transparente, borda `--pedra-clara`, texto `--creme`, 500, pílula, altura mínima 52 px (48 px em contextos menores). |
| Contorno dourado ("Adicionar" nos cartões) | Fundo transparente, borda `--ouro`, texto `--creme`, 600, pílula, altura mínima 44 px, `padding: 0 18px`. |
| Link com sublinhado | Texto `--creme` 500 ou 600, sem `text-decoration`, `border-bottom: 1px solid var(--ouro)`, `padding-bottom: 2px`. Termina com " →" quando leva a uma listagem. |
| Opção (chip de quiz/filtro) | Pílula, altura mínima 44–48 px, borda `--pedra-clara`, fundo transparente. **Selecionada**: borda `--ouro`, fundo `--ouro-vidro`. Use `aria-pressed`. |

Hover geral: links ficam `--ouro`; botões principais podem escurecer levemente (ex.: `filter: brightness(0.95)`). Foco visível: `outline: 2px solid var(--ouro); outline-offset: 2px;`.

### 4.5 Selos (Seal)

Pílula com borda colorida e texto colorido, sem fundo. 12 px, 600, `padding: 4px 12px` (11 px e `3px 10px` no mobile).

| Tipo | Borda | Texto | Exemplos |
| --- | --- | --- | --- |
| Origem/certificação | `--mofo` | `--mofo-texto` | Selo Arte |
| Maturação/leite | `--casca` | `--casca-texto` | Leite cru · 60 dias de cura |

### 4.6 Cartão de produto (ProductCard)

- `background: var(--carvao); border: 1px solid var(--pedra); border-radius: 12px; padding: 20px; display: flex; flex-direction: column; gap: 12px;` (gap 10 px no catálogo).
- Conteúdo em ordem:
  1. Ilustração do queijo (SVG, `width: 100%`, `viewBox="0 0 300 190"`).
  2. Sobretítulo pequeno (origem), ex.: `BRASIL · CANASTRA, MG`.
  3. Nome, Cormorant 28/600, `line-height: 1.1`. No catálogo é um link para a página do produto.
  4. Nota sensorial, 14 px, `--palha`.
  5. Rodapé (`margin-top: auto; padding-top: 8px; display: flex; justify-content: space-between; align-items: center; gap: 8px`): à esquerda, linha pequena 12 px `--palha` ("a partir de" ou o peso, ex.: "~300 g") e o preço em 600 `--ouro`; à direita, botão "Adicionar" (contorno dourado).
- Comportamento: no desktop, ao passar o mouse sobre a ilustração, ela pode girar lentamente (rotação do modelo 3D quando disponível).

### 4.7 Placeholder de foto

Caixa com fundo `--cave-funda` (ou `--carvao` nos artigos), texto centralizado `[FOTO: descrição]`, 13 px, cor `--placeholder`, `letter-spacing: 0.06em`. Alturas usadas: 240 px (Brasil/Mundo), 220 px (kits), 200 px (artigos, com raio 12 e borda `--pedra`). Substituir por `<Image>` quando houver fotos.

### 4.8 Botão flutuante de atendimento (SupportFab)

- `position: fixed; right: 28px; bottom: 28px;` (mobile: `right: 16px; bottom: 100px` na página de produto, acima da barra fixa), `display: flex; align-items: center; gap: 12px`.
- Bolha de texto (só desktop, aparece **20 s** após o primeiro acesso, uma vez por sessão): fundo `--creme`, texto `--cave`, 14 px, 500, `padding: 10px 16px`, `border-radius: 14px 14px 4px 14px`. Texto: **Posso ajudar a escolher?**
- Círculo: 60 × 60 (54 no mobile), fundo `--ouro`, ícone de balão de conversa 26 px (24 no mobile), traço 1.75, cor `--cave`. `aria-label="Abrir atendimento"`.
- Clique abre o painel de Atendimento (seção 8).

### 4.9 Rodapé (Footer)

- `border-top: 1px solid var(--pedra); background: var(--rodape);`
- Parte de cima: contêiner 1200, `padding: 64px 32px 40px`, `display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 32px;`
  - Coluna 1: nome "Ateliê *do* Queijo" (Cormorant 26/600, "do" 21 px itálico dourado) e, abaixo (`margin-top: 8px`), "Queijos de autor, escolhidos à mão." em 14 px `--palha`.
  - Coluna **LOJA**: Queijos · Presentes · Presentes corporativos
  - Coluna **ATELIÊ**: Sobre · Nossos produtores · Escola do Ateliê
  - Coluna **AJUDA**: Entregas refrigeradas · Trocas e devoluções · Perguntas frequentes · Fale conosco (abre o painel de atendimento)
  - Títulos de coluna: sobretítulo 11 px `0.18em` `--palha`, `margin-bottom: 4px`. Links 14 px, empilhados com `gap: 8px`.
- Parte de baixo: contêiner 1200, `padding: 20px 32px 32px; border-top: 1px solid var(--pedra);` 12 px, cor `--placeholder`, `display: flex; flex-wrap: wrap; justify-content: space-between; gap: 12px;`
  - Esquerda: `Ateliê do Queijo · CNPJ [00.000.000/0000-00] · [Endereço]`
  - Direita: `Produtos de origem animal com inspeção sanitária · Pix · Cartões`

### 4.10 Ícones

Ícones de traço, `viewBox="0 0 24 24"`, `fill="none"`, `stroke="currentColor"`, `stroke-linecap="round"`, `stroke-linejoin="round"` quando houver cantos, `stroke-width` 1.5 (1.75 em botões cheios, 1.8 no WhatsApp). Decorativos levam `aria-hidden="true"`. Paths exatos:

| Nome | Paths |
| --- | --- |
| buscar | `<circle cx="11" cy="11" r="7"/>` `<path d="M20 20l-4-4"/>` |
| conta | `<circle cx="12" cy="8" r="4"/>` `<path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/>` |
| sacola | `<path d="M5 8h14l-1 12H6Z"/>` `<path d="M9 8V6a3 3 0 0 1 6 0v2"/>` |
| seta-direita | `<path d="M5 12h14M13 6l6 6-6 6"/>` |
| girar | `<path d="M3 12a9 9 0 0 1 15.5-6.2L21 8"/>` `<path d="M21 3v5h-5"/>` `<path d="M21 12a9 9 0 0 1-15.5 6.2L3 16"/>` `<path d="M3 21v-5h5"/>` (versão curta, nos botões: só os dois primeiros) |
| frio (entrega refrigerada) | `<path d="M12 2v20M4 6l16 12M20 6L4 18"/>` `<path d="M9 3l3 2 3-2M9 21l3-2 3 2"/>` |
| selo-certificado | `<circle cx="12" cy="9" r="6"/>` `<path d="M8.5 14l-1.5 8 5-3 5 3-1.5-8"/>` `<path d="M9.5 9l1.8 1.8L14.5 7.5"/>` |
| pix | `<path d="M12 2l10 10-10 10L2 12Z"/>` `<path d="M12 7l5 5-5 5-5-5Z"/>` |
| conversa | `<path d="M21 12a8 8 0 0 1-11.8 7L4 20l1.1-4.6A8 8 0 1 1 21 12Z"/>` |
| ver-por-dentro | `<path d="M3 15L19 9L21 13L5 19Z"/>` `<path d="M3 15V9l16-6v6"/>` |
| aproximar | `<circle cx="11" cy="11" r="7"/>` `<path d="M20 20l-4-4M11 8v6M8 11h6"/>` |
| tela-cheia | `<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>` |
| presente | `<rect x="3" y="9" width="18" height="12" rx="1"/>` `<path d="M3 13h18M12 9v12M12 9c-2-4-6-4-6-1.5S10 9 12 9c2 0 6-0.5 6-2.5S14 5 12 9Z"/>` |
| menu | `<path d="M4 7h16M4 12h16M4 17h10"/>` |
| fechar | `<path d="M6 6l12 12M18 6L6 18"/>` |
| enviar | `<path d="M4 12l16-8-6 16-2-6Z"/>` |

---

## 5. Home (`/`)

Fundo `--cave`. Seções em ordem, de cima para baixo. Altura total do protótipo a 1440 px: ~3900 px.

### 5.1 Faixa de aviso + cabeçalho
Seções 4.2 e 4.3.

### 5.2 Hero

- Contêiner: `max-width: 1200px; margin: 0 auto; padding: 48px 32px 96px; display: flex; flex-wrap: wrap; align-items: center; gap: 48px;`
- **Coluna de texto** (`flex: 1 1 440px; min-width: 0`):
  - Sobretítulo: **CURADORIA DE QUEIJOS FINOS** (`margin-bottom: 24px`).
  - `<h1>`: **Queijos de autor, *escolhidos à mão.*** — Cormorant 500, 76 px, `line-height: 1.02`, `letter-spacing: -0.01em`, `margin: 0`. "escolhidos à mão." em `<em>` dourado.
  - Parágrafo (`margin-top: 28px`, 18 px, `--palha`, `max-width: 480px`): **Do Serro à Borgonha, selecionamos queijos artesanais brasileiros e importados no ponto certo de maturação, e levamos até você em embalagem refrigerada.**
  - Botões (`display: flex; flex-wrap: wrap; gap: 14px; margin-top: 40px`):
    - Principal com seta: **Explorar a cave** → `/queijos`
    - Secundário: **Montar um presente** → `/presentes`
  - Linha de origens (`margin-top: 48px`, 12 px, `letter-spacing: 0.18em`, `--palha`): **BRASIL · FRANÇA · ITÁLIA · SUÍÇA · ESPANHA · PORTUGAL**
- **Coluna do 3D** (`flex: 1 1 520px; min-width: 0; position: relative`):
  - Ilustração do hero (Apêndice A.3), `width: 100%; height: auto; display: block`. Quando o GLB existir, trocar pelo `model-viewer` com rotação automática lenta (seção 11), mantendo halo, ardósia e sombra.
  - Pílula "Arraste para girar" no canto superior esquerdo (`position: absolute; left: 0; top: 8px`): ícone girar 16 px + texto, 13 px, `--palha`, fundo `--vidro-escuro`, borda `--pedra`, pílula, `padding: 6px 14px`, `gap: 8px`.
  - Etiqueta da peça no canto inferior direito (`position: absolute; right: 0; bottom: 0`): fundo `--carvao`, borda `--pedra`, raio 12, `padding: 14px 18px`, `max-width: 260px`.
    - Sobretítulo 11 px: **BRASIL · SERRA DA CANASTRA, MG**
    - Nome Cormorant 24/600, `line-height: 1.2`, `margin-top: 4px`: **Canastra curado**
    - 13 px `--palha`: **Leite cru · 60 dias de cura**

### 5.3 Faixa de confiança

- `<section aria-label="Garantias">` com `border-top` e `border-bottom` `1px solid var(--pedra)`.
- Contêiner 1200, `padding: 32px`, `display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 28px;`
- Cada item: `display: flex; gap: 14px; align-items: flex-start;` ícone 28 px em traço `--ouro` 1.5, título 600, descrição 14 px `--palha`.

| Ícone | Título | Descrição |
| --- | --- | --- |
| frio | Entrega refrigerada | Caixa térmica do Ateliê até a sua porta. |
| selo-certificado | Produtores certificados | Todos com SIF, SISBI ou Selo Arte. |
| pix | 5% de desconto no Pix | Aprovação imediata. |
| conversa | Fale com um queijista | Atendimento humano pelo WhatsApp. |

### 5.4 Na cave esta semana

- `<section>` contêiner 1200, `padding: 112px 32px 0`.
- Cabeçalho da seção (`display: flex; flex-wrap: wrap; justify-content: space-between; align-items: flex-end; gap: 16px; margin-bottom: 40px`):
  - Sobretítulo (`margin-bottom: 12px`): **PEÇAS DA SEMANA**
  - h2: **Na cave esta semana**
  - Parágrafo (`margin-top: 12px`, `--palha`, `max-width: 520px`): **Queijos que chegaram ao ponto ideal. Gire, olhe por dentro e escolha o seu.**
  - À direita: link sublinhado **Ver todos os queijos →** → `/queijos`
- Grade: `display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 20px;` com 4 cartões (4.6), ilustrações do Apêndice A.4:

| Ilustração | Sobretítulo | Nome | Nota | Linha pequena | Preço |
| --- | --- | --- | --- | --- | --- |
| A.4.1 | BRASIL · CANASTRA, MG | Canastra curado | Intenso, amanteigado, final picante. | a partir de | R$ 49,00 |
| A.4.2 | FRANÇA · IMPORTADO | Brie francês | Cremoso, notas de cogumelo e nozes. | a partir de | R$ 122,48 |
| A.4.3 | BRASIL · SERRA DAS ANTAS, MG | Gorgonzola Dolce | Macio, levemente adocicado, veios suaves. | ~300 g | R$ 76,00 |
| A.4.4 | BRASIL · LEITE DE CABRA | Cabra com cinzas | Fresco, cítrico, casca aveludada. | a partir de | R$ 74,00 |

> Em produção, esta seção lista os produtos marcados como "destaque da semana" em `data/cheeses.ts`, mantendo exatamente este layout.

### 5.5 Do Brasil e do mundo

- Contêiner 1200, `padding: 128px 32px 0`.
- h2 centralizado (`margin: 0 0 40px`): **Duas tradições, *uma mesma exigência.***
- Grade `repeat(auto-fit, minmax(320px, 1fr))`, `gap: 24px`, dois cartões (`--carvao`, borda `--pedra`, raio 12, `overflow: hidden`):
  - Topo: placeholder de foto com 240 px de altura e `border-bottom: 1px solid var(--pedra)`.
  - Corpo (`padding: 32px`): sobretítulo 12 px em `--mofo`; h3 Cormorant 34/600 `line-height: 1.15`, `margin: 8px 0 12px`; parágrafo `--palha` `margin: 0 0 20px`; link sublinhado 600.

| Foto | Sobretítulo | Título | Texto | Link |
| --- | --- | --- | --- | --- |
| [FOTO: produtor na câmara de maturação, Serra da Canastra] | QUEIJOS DO BRASIL | A nova geração de queijeiros | Canastra, Serro, Mantiqueira, Campo das Vertentes, Cuesta Paulista. Produtores brasileiros que vêm conquistando medalhas pelo mundo. | Conhecer os brasileiros → (`/queijos?origem=brasil`) |
| [FOTO: cave de maturação europeia, prateleiras de madeira] | QUEIJOS DO MUNDO | Os clássicos de origem | França, Itália, Suíça, Espanha, Portugal. Queijos de denominação de origem, importados com toda a documentação. | Conhecer os importados → (`/queijos?origem=mundo`) |

### 5.6 Encontre seu queijo (quiz)

- Contêiner 1200, `padding: 128px 32px 0`.
- Caixa: `border: 1px solid var(--ouro); border-radius: 16px; padding: 56px 40px; text-align: center; background: var(--cave-quiz);`
  - Sobretítulo: **ENCONTRE SEU QUEIJO · PERGUNTA 1 DE 3** (o número muda a cada passo)
  - h2 (`margin: 16px 0 12px`): **Não sabe por onde começar?**
  - Parágrafo (`--palha`, `max-width: 520px`, centralizado, `margin-bottom: 32px`): **Responda três perguntas e o Ateliê indica o queijo certo para você.**
  - Pergunta em Cormorant 20/600 (`margin-bottom: 20px`).
  - Opções: chips (4.4), altura mínima 48, `padding: 0 24px`, 15 px, `gap: 12px`, centralizados com quebra.
  - Botão principal (`margin-top: 32px`): **Próxima pergunta** (na última: **Ver meu queijo**).
- Perguntas:
  1. **Você prefere sabores…** — Suaves e amanteigados · Equilibrados · Intensos e marcantes
  2. **Vai servir como…** — Tábua para receber · Presente · Para mim, com calma
  3. **Vai acompanhar com…** — Vinho tinto · Vinho branco ou espumante · Cerveja · Café ou mel
- No protótipo, "Equilibrados" aparece selecionado para mostrar o estado.
- Resultado (mesma caixa): sobretítulo **SEU QUEIJO É**, h2 com o nome do queijo, ilustração/3D da peça, parágrafo "Por que combina com você" (gerado das respostas) e botão principal **Adicionar à sacola** + link **Refazer o teste**. A lógica de recomendação está na seção 10.4.

### 5.7 Presentes

- Contêiner 1200, `padding: 128px 32px 0`. Cabeçalho igual ao 5.4:
  - Sobretítulo: **PRESENTES**
  - h2: **Presentes que se abrem *como um ritual.***
  - Parágrafo (`max-width: 560px`): **Kits montados pelo nosso queijista, com tábua, acompanhamentos e cartão escrito à mão.**
  - Link: **Ver todos os presentes →** → `/presentes`
- Grade `repeat(auto-fit, minmax(280px, 1fr))`, `gap: 20px`, cartões `--carvao` com `overflow: hidden`: placeholder `[FOTO DO KIT]` com 220 px e borda inferior; corpo `padding: 24px`: h3 Cormorant 28/600 (`margin: 0 0 6px`), texto 14 px `--palha` (`margin: 0 0 16px`), preço 600 `--ouro`.

| Kit | Descrição | Preço |
| --- | --- | --- |
| Primeira Degustação | 3 queijos suaves, mel de flores e guia de degustação. | R$ [PREÇO] |
| Volta ao Mundo | 5 queijos de 5 países, com mapa de origem. | R$ [PREÇO] |
| Grande Cave | 7 queijos, tábua de madeira maciça e faca de queijo. | R$ [PREÇO] |

### 5.8 Escola do Ateliê

- Contêiner 1200, `padding: 128px 32px 0`.
- Sobretítulo: **ESCOLA DO ATELIÊ**; h2 (`margin: 0 0 40px`): **O jeito certo de servir, guardar e harmonizar.**
- Grade `repeat(auto-fit, minmax(280px, 1fr))`, `gap: 32px`. Cada item é um link inteiro: placeholder 200 px (raio 12, `--carvao`, borda `--pedra`), sobretítulo 11 px `--mofo` (`margin-top: 16px`), título Cormorant 26/600 `line-height: 1.2` `--creme` (`margin-top: 6px`).

| Foto | Categoria | Título |
| --- | --- | --- |
| [FOTO: tábua montada] | PRIMEIROS PASSOS | Como montar uma tábua de queijos |
| [FOTO: queijo e taça de vinho] | HARMONIZAÇÃO | Queijo e vinho: um guia sem regras chatas |
| [FOTO: queijo embrulhado em papel] | SERVIR E GUARDAR | Como guardar queijo na geladeira |

### 5.9 Newsletter

- Contêiner 1200, `padding: 128px 32px` (128 px também embaixo, antes do rodapé).
- Bloco com `border-top: 1px solid var(--ouro); padding-top: 48px; display: flex; flex-wrap: wrap; gap: 32px; justify-content: space-between; align-items: flex-end;`
  - Esquerda (`flex: 1 1 420px`): h2 44 px **Receba primeiro os lotes raros.**; parágrafo (`margin-top: 12px`, `--palha`, `max-width: 480px`): **Algumas peças chegam em poucas unidades. Avisamos você antes de todo mundo.**
  - Direita (`<form>`, `flex: 1 1 420px; display: flex; flex-wrap: wrap; gap: 12px; align-items: flex-end`):
    - Campo (`flex: 1 1 240px`, coluna com `gap: 6px`): `<label>` **Seu e-mail** (13 px `--palha`) e `<input type="email" placeholder="voce@email.com">` com altura mínima 52, `padding: 0 18px`, pílula, borda `--pedra-clara`, fundo `--carvao`, texto `--creme`, 15 px.
    - Botão principal **Quero receber** (`padding: 0 28px`, 15 px).
  - Sucesso: substituir o formulário por "Pronto! Você vai receber os próximos lotes raros." em `--mofo-texto`.

### 5.10 Rodapé + botão flutuante
Seções 4.9 e 4.8.

---

## 6. Catálogo (`/queijos`)

- Faixa de aviso + cabeçalho (com borda inferior; "Queijos" ativo em dourado).
- `<main>`: contêiner 1200, `padding: 64px 32px 112px`.
  - Sobretítulo (`margin-bottom: 12px`): **CATÁLOGO DE LANÇAMENTO**
  - h1 Cormorant 500, 64 px, `line-height: 1.05`: **A cave**
  - Parágrafo (`margin-top: 16px`, 18 px, `--palha`, `max-width: 560px`): **10 queijos escolhidos um a um. Filtre por origem ou deixe o queijista sugerir.** (o número vem da quantidade de produtos)
  - Barra de filtros: `display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 16px; margin: 40px 0 32px; padding: 14px 0; border-top: 1px solid var(--pedra); border-bottom: 1px solid var(--pedra);`
    - Grupo `role="group" aria-label="Filtrar por origem"` com chips (altura 44, `padding: 0 20px`, 14 px, 600, `gap: 10px`): **Todos (10)** · **Brasil (7)** · **Mundo (3)**. Selecionado: borda `--ouro`, fundo `--ouro-vidro`. Padrão: Todos. Sincronizar com `?origem=brasil|mundo` na URL.
    - À direita, 14 px `--palha`: **Frete grátis acima de R$ 180 · 5% off no Pix**
  - Grade: `display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 20px;` com um ProductCard (4.6, `gap: 10px`, sobretítulo com `letter-spacing: 0.16em`) por queijo, ilustração gerada pelo algoritmo do Apêndice A.6 a partir dos dados da seção 9.
  - Caixa de ajuda (`margin-top: 56px; padding: 28px 32px; border: 1px solid var(--pedra); border-radius: 12px; background: var(--cave-quiz); display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 16px;`):
    - Título Cormorant 26/600: **Não sabe qual escolher?**
    - Texto 15 px `--palha`: **Responda três perguntas ou fale com um queijista, de segunda a sábado.**
    - Botão principal (altura 48, `padding: 0 26px`): **Pedir ajuda** → abre o painel de atendimento.
- Filtros adicionais previstos para quando o catálogo crescer (não exibir agora): Leite (vaca, cabra, ovelha, búfala) · Massa (fresca, macia, semidura, dura, azul) · Intensidade · Faixa de preço · Ordenar por (Destaques, Mais recentes, Menor preço, Maior preço).
- Nenhum resultado: **Nenhum queijo com esses filtros por enquanto. Que tal ampliar a busca ou pedir uma sugestão ao queijista?**

---

## 7. Página de produto (`/queijos/[slug]`)

Exemplo do protótipo: **Canastra curado**. Altura do protótipo a 1440 px: ~1640 px.

### 7.1 Topo
- Faixa de aviso + cabeçalho com borda inferior ("Queijos" ativo).
- Trilha de navegação `<nav aria-label="Você está em">`: contêiner 1200, `padding: 20px 32px 0`, 13 px `--palha`: `Início / Queijos / Brasil / Canastra curado` (os três primeiros são links `--palha` sem sublinhado; o último em `--creme`).

### 7.2 Corpo principal
`<main>`: contêiner 1200, `padding: 24px 32px 0; display: flex; flex-wrap: wrap; gap: 56px; align-items: flex-start;`

**Coluna esquerda — visualizador** (`flex: 1 1 560px; min-width: 0`)

- Palco: `position: relative; background: var(--cave-funda); border: 1px solid var(--pedra); border-radius: 16px; padding: 32px 24px 24px;`
  - Dica no canto superior esquerdo (`position: absolute; left: 20px; top: 18px`), ícone girar 16 px + texto, 13 px `--palha`, `gap: 8px`: **Arraste para girar · Toque duas vezes para aproximar**. Some após a primeira interação.
  - Indicador no canto superior direito (`position: absolute; right: 20px; top: 16px`): 11 px, `letter-spacing: 0.18em`, `--ouro`, 600, borda `--pedra-clara`, pílula, `padding: 4px 12px`. Texto **POR DENTRO** quando cortado, **PEÇA INTEIRA** quando inteiro.
  - Ilustração (`margin-top: 16px; width: 100%`): Apêndice A.5.1 (cortado) ou A.5.2 (inteiro). Com GLB, usar o `model-viewer` (seção 11).
  - Barra de controles `role="toolbar" aria-label="Controles do 3D"` (`display: flex; flex-wrap: wrap; justify-content: center; gap: 10px; margin-top: 12px`). Botões pílula com altura mínima 44, 14 px, ícone 16 px + texto, `gap: 8px`:
    - **Girar** (borda `--pedra-clara`, transparente): liga/desliga a rotação automática. Ativo (`aria-pressed="true"`): borda `--ouro` e fundo `--ouro-vidro` (decisão do dono, 2026-10-27, P23).
    - **Alternador de corte** (borda `--ouro`, 600, `padding: 0 18px`, `aria-pressed`):
      - Cortado (estado padrão): fundo `--ouro`, texto `--cave`, rótulo **Ver peça inteira** (rótulo substituído por P21, abaixo).
      - Inteiro: fundo transparente, texto `--creme`, rótulo **Ver por dentro** (rótulo substituído por P21, abaixo).
      - **Decisão do dono (2026-10-27, P21):** o rótulo é fixo, **Ver por dentro**, com `aria-pressed="true"` quando cortado (o padrão ARIA não combina rótulo alternado com `aria-pressed`). O indicador **POR DENTRO** / **PEÇA INTEIRA** continua alternando. A barra de controles tem navegação por setas, Home e End.
    - **Aproximar** (borda `--pedra-clara`): alterna o zoom. Ativo: igual ao **Girar** (P23).
    - **Tela cheia** (somente ícone, 44 × 44, `aria-label="Tela cheia"`).
- Miniaturas: `display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; margin-top: 12px;` cada uma `aspect-ratio: 1; border-radius: 10px; background: var(--carvao);` 12 px centralizado. A primeira (**3D**, ativa) tem borda `--ouro` e texto `--palha`; as outras têm borda `--pedra` e texto `--placeholder`: **[FOTO: na tábua]**, **[FOTO: produtor]**, **[FOTO: fazenda]**.

**Coluna direita — informações** (`flex: 1 1 420px; min-width: 0`)

1. Sobretítulo 12 px: **BRASIL · SERRA DA CANASTRA, MG**
2. h1 Cormorant 500, 56 px, `line-height: 1.05`, `margin: 8px 0 4px`: **Canastra curado**
3. 14 px `--palha`: **Queijaria [NOME DO PRODUTOR]**
4. Selos (`margin-top: 16px`, `gap: 8px`): **Selo Arte** (origem) · **Leite cru** (maturação) · **60 dias de cura** (maturação)
5. Descrição (`margin-top: 20px`, 17 px, `--creme-suave`): **Casca firme e dourada, massa amarelada e levemente esfarelada. Sabor intenso, com notas de manteiga tostada e um final picante que fica na boca.**
6. Formato — `<fieldset>` sem borda (`margin-top: 28px`), `<legend>` sobretítulo **FORMATO** (`margin-bottom: 10px`). Botões (`display: flex; flex-wrap: wrap; gap: 10px`), cada um com altura mínima 56, `padding: 6px 18px`, raio 12, texto à esquerda em duas linhas: nome (600, 14 px) e "peso · preço" (12 px `--palha`). Selecionado: borda `--ouro`, fundo `--ouro-vidro`; não selecionado: borda `--pedra-clara`, transparente. Implementado como `<input type="radio">` visualmente oculto com `<label>` estilizado, mantendo este visual (decisão do dono, 2026-10-27, P22; substitui o `aria-pressed`).

   | Formato | Linha 2 | Preço | Pix (−5%) |
   | --- | --- | --- | --- |
   | Peça inteira (padrão) | ~1 kg · R$ 136,00 | R$ 136,00 | R$ 129,20 |
   | Meia peça | ~500 g · R$ 78,00 | R$ 78,00 | R$ 74,10 |
   | Fração | ~250 g · R$ 49,00 | R$ 49,00 | R$ 46,55 |

7. Preço (`margin-top: 28px; display: flex; align-items: baseline; gap: 14px; flex-wrap: wrap`): valor do formato escolhido em Cormorant 40/600 `--ouro` e, ao lado, 14 px `--palha`: **ou R$ 129,20 no Pix (5% off)**.
8. Compra (`display: flex; flex-wrap: wrap; gap: 12px; margin-top: 16px`):
   - Seletor de quantidade: borda `--pedra-clara`, pílula, altura 52; botões **−** e **+** de 48 × 52 (20 px, `aria-label` "Diminuir quantidade"/"Aumentar quantidade") e o número no meio (600, `min-width: 24px`). Mínimo 1.
   - Botão principal **Adicionar à sacola** (`flex: 1 1 220px`, altura 52, 16 px).
9. Botão secundário de largura total (`margin-top: 12px`, altura 48, 15 px) com ícone presente 16 px: **Embalar para presente**.
10. Calculadora de frete (`margin-top: 24px; padding: 18px; border-radius: 12px; background: var(--carvao); border: 1px solid var(--pedra);`):
    - `<label for="cep">` 14 px 600 (`margin-bottom: 10px`): **Calcule o frete e o prazo**
    - Linha (`display: flex; gap: 10px; flex-wrap: wrap`): `<input id="cep" inputmode="numeric" placeholder="00000-000">` (`flex: 1 1 140px`, altura 46, `padding: 0 14px`, raio 10, borda `--pedra-clara`, fundo `--cave`, 15 px) e botão **Calcular** (altura 46, `padding: 0 20px`, raio 10, borda `--ouro`, transparente, 600). Máscara de CEP automática.
    - Resultado (`margin-top: 10px`, 13 px, `--mofo-texto`, ícone frio 16 px, `gap: 8px`): **Chega refrigerado em até [N] dias úteis.** CEP fora de área: **Ainda não chegamos ao seu CEP com segurança refrigerada. Deixe seu e-mail e avisamos.**
11. Link para WhatsApp (`margin-top: 16px`, 14 px `--palha`, ícone conversa 16 px com traço `--whatsapp`): **Dúvidas sobre este queijo?** seguido de **Fale com um queijista** em `--creme` com sublinhado dourado. Abre o WhatsApp com a mensagem da seção 8.3 preenchida com o nome do queijo.

### 7.3 Perfil sensorial e detalhes
Contêiner 1200, `padding: 80px 32px 96px; display: flex; flex-wrap: wrap; gap: 56px;`

**Perfil sensorial** (`flex: 1 1 360px`): h2 Cormorant 500, 36 px, `margin: 0 0 24px`: **Perfil sensorial**. Quatro linhas (`gap: 18px`). Cada linha: em cima, nome (600, 14 px) à esquerda e escala (14 px `--palha`) à direita; embaixo, 5 barras em `grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 6px;` de 6 px de altura e raio 3, preenchidas com `--ouro` até o valor e `--pedra` no restante. Cada grupo de barras tem `role="img" aria-label="Intensidade: 4 de 5"`.

| Atributo | Escala | Valor (Canastra curado) |
| --- | --- | --- |
| Intensidade | suave → marcante | 4 |
| Cremosidade | firme → derrete | 2 |
| Salinidade | delicado → salgado | 3 |
| Aroma | leve → pungente | 4 |

**Abas** (`flex: 1.4 1 480px; min-width: 0`):
- `role="tablist" aria-label="Detalhes do queijo"`, `display: flex; flex-wrap: wrap; gap: 4px; border-bottom: 1px solid var(--pedra);`
- Abas: altura mínima 44, `padding: 0 14px`, 14 px, 600, sem fundo, `border-bottom: 2px solid` dourado na ativa (transparente nas outras), texto `--creme` na ativa e `--palha` nas outras. Navegação por setas do teclado.
- Painel (`padding-top: 24px`, cor `--creme-suave`):

| Aba | Conteúdo |
| --- | --- |
| A história (padrão) | Parágrafo 1: **Na Serra da Canastra, o queijo é feito com leite cru da ordenha do dia e o pingo, o fermento natural recolhido do soro da fornada anterior. [NOME DO PRODUTOR] mantém o método da família desde [ANO].** Parágrafo 2: **Depois de prensado à mão, cada queijo matura 60 dias em prateleiras de madeira, virado diariamente, até a casca ficar firme e dourada.** |
| Harmonização | Grade `repeat(auto-fit, minmax(160px, 1fr))`, `gap: 12px`, três caixas (`padding: 16px`, raio 12, borda `--pedra`, fundo `--carvao`), cada uma com rótulo 11 px `0.18em` 600 e texto (`margin-top: 6px`): **VINHO** (`--vinho-texto`) "[Sugestão de tinto encorpado]" · **CERVEJA** (`--casca-texto`) "[Sugestão de cerveja]" · **ACOMPANHAMENTOS** (`--mofo-texto`) "Goiabada cascão, mel de laranjeira, castanhas" |
| Como servir | **Tire da geladeira 40 minutos antes de servir. Corte em lascas finas, do centro para a casca, para que cada pedaço tenha um pouco de tudo.** |
| Como guardar | **Embrulhe em papel manteiga e depois em filme ou pote com tampa. Guarde na gaveta de legumes e consuma em até [N] dias após aberto.** |
| Ficha técnica | **Leite: vaca, cru · Massa: semidura · Maturação: 60 dias · Peso: ~1 kg · Registro: [SELO E NÚMERO] · Contém leite e derivados · Validade: [DATA]** |

### 7.4 Abaixo da dobra (a implementar com os mesmos componentes)
- **Combina com este queijo**: 3 cartões (outro queijo, mel, tábua).
- **Avaliações** de quem comprou (somente reais).
- **Outros queijos da mesma região**.

### 7.5 Estados
- Carregando o 3D: mostrar a ilustração SVG com a legenda **Preparando a peça…**
- Navegador sem WebGL: **Seu navegador não exibe o 3D. Veja as fotos abaixo.**
- Últimas unidades: **Restam [n] peças deste lote.**
- Esgotado: **Esgotado neste lote. Avise-me quando voltar.** (botão principal vira "Avise-me")
- Item adicionado: toast **Adicionado à sacola. Boa escolha.**

### 7.6 Produto no celular (≤ 768 px) — tela de 390 × 844

- Cabeçalho compacto: `display: flex; align-items: center; justify-content: space-between; padding: 8px; border-bottom: 1px solid var(--pedra);` botão Menu (44 × 44, ícone 22) · logotipo (símbolo 24 + nome 21 px, "do" 17 px) · sacola (44 × 44, ícone 22, contador absoluto em `top: 6px; right: 4px`, 10 px, 700, `padding: 0 5px`).
- Palco 3D: `position: relative; padding: 8px 12px 0; background: var(--cave-funda); border-bottom: 1px solid var(--pedra);`
  - Dica `position: absolute; left: 16px; top: 12px` (ícone 14 + **Arraste para girar**, 12 px `--palha`).
  - Ilustração A.5.3.
  - Botões centralizados (`gap: 8px; padding: 4px 0 14px`), altura 44, 13 px: **Ver peça inteira** (ativo: fundo `--ouro`, texto `--cave`, 600) · **Aproximar** · **Ver na mesa** (realidade aumentada do `model-viewer`; `aria-label="Ver na mesa, em realidade aumentada"`).
- Informações (`padding: 20px 20px 0`): sobretítulo 11 px; h1 Cormorant 500, 38 px, `line-height: 1.05`, `margin: 4px 0 2px`; selos (11 px, `padding: 3px 10px`, `gap: 6px`, `margin-top: 10px`): Selo Arte · Leite cru · 60 dias; descrição curta (`margin-top: 14px`, 15 px, `--creme-suave`): **Casca firme e dourada, massa levemente esfarelada. Intenso, com notas de manteiga tostada e final picante.**
- Formatos em três colunas iguais (`display: flex; gap: 8px; margin-top: 16px`), cada um com altura mínima 52, raio 12, 13 px 600 + peso em 11 px `--palha`: **Inteira ~1 kg** (selecionado) · **Meia ~500 g** · **Fração ~250 g**.
- Botão flutuante de atendimento: `right: 16px; bottom: 100px`, 54 × 54.
- Barra fixa inferior (`position: fixed; left: 0; right: 0; bottom: 0; background: var(--carvao); border-top: 1px solid var(--pedra); padding: 14px 16px 22px; display: flex; align-items: center; gap: 14px;`): à esquerda, preço em Cormorant 24/600 `--ouro` (**R$ 136,00**) e, abaixo, **5% off no Pix** (11 px `--palha`); à direita, botão principal **Adicionar à sacola** (`flex: 1`, altura 52, 15 px).
- O restante da página (frete, perfil sensorial, abas) segue abaixo, em coluna única, com `padding: 0 20px`.

---

## 8. Painel de atendimento (Assistente + WhatsApp)

Abre a partir do botão flutuante. **Desktop**: painel ancorado no canto inferior direito, 390 × 640 px, raio 16, borda `--pedra`, acima do botão. **Mobile**: tela cheia (390 × 844 no protótipo). Estrutura em coluna (`display: flex; flex-direction: column`), fundo `--cave`, 15 px, `line-height: 1.5`.

### 8.1 Cabeçalho
- `padding: 12px 12px 14px 16px; border-bottom: 1px solid var(--pedra); background: var(--carvao);`
- Linha (`gap: 12px`): avatar circular de 40 px com borda `--ouro` e o símbolo (22 px, só o "A" com a olhadura de cima) · bloco com **Assistente do Ateliê** (Cormorant 21/600) e **Responde na hora, 24 horas** (12 px `--mofo-texto`) · botão fechar (44 × 44, ícone 20, `aria-label="Fechar atendimento"`).
- Alternador `role="tablist" aria-label="Como prefere conversar?"` (`margin-top: 12px; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 4px; background: var(--cave); border-radius: 999px; padding: 4px;`). Abas de altura 40, pílula, 13 px:
  - **Assistente** — ativa: fundo `--ouro`, texto `--cave`, 600.
  - **Queijista (WhatsApp)** — com ícone conversa 14 px em traço `--whatsapp`; inativa: transparente, `--creme`, 500. Ao selecionar, mostra o horário de atendimento e o botão que abre o WhatsApp (8.3).

### 8.2 Conversa com o assistente
- Área de mensagens (`flex: 1; padding: 16px; display: flex; flex-direction: column; gap: 12px; overflow-y: auto`).
- Mensagem do assistente: alinhada à esquerda, `max-width: 300px`, fundo `--carvao`, borda `--pedra`, `border-radius: 4px 16px 16px 16px`, `padding: 12px 14px`, 14 px.
- Mensagem do cliente: alinhada à direita, `max-width: 280px`, fundo `--ouro`, texto `--cave`, 500, `border-radius: 16px 4px 16px 16px`, `padding: 10px 14px`, 14 px.
- Respostas rápidas: chips altura 36, `padding: 0 12px`, 12 px, borda `--pedra-clara` (a sugerida tem borda `--ouro` e 600), `gap: 6px`.
- Cartão de produto no chat: largura 300, fundo `--carvao`, borda `--ouro`, raio 14, `padding: 12px`, `display: flex; gap: 12px; align-items: center;` miniatura 84 px (Apêndice A.7) · sobretítulo 10 px `0.16em` · nome Cormorant 20/600 · preço 13 px 600 `--ouro` (ex.: "a partir de R$ 49,00") · botão circular 44 px dourado com seta (`aria-label="Ver Canastra curado em 3D"`) que leva à página do produto.

**Roteiro mostrado no protótipo**

1. Assistente: **Olá! Sou o assistente do Ateliê do Queijo. Posso sugerir um queijo, montar uma tábua, indicar uma harmonização ou ver o status do seu pedido. Por onde começamos?**
2. Respostas rápidas: **Sugira um queijo** · **Montar uma tábua** · **Onde está meu pedido?**
3. Cliente: **Quero presentear alguém que adora vinho tinto.**
4. Assistente: **Ótima ocasião! Com tinto, um queijo curado e intenso costuma brilhar. Minha sugestão:**
5. Cartão: Canastra curado · BRASIL · CANASTRA, MG · a partir de R$ 49,00
6. Assistente: **Quer que eu inclua embalagem de presente e um cartão com mensagem?**
7. Respostas rápidas: **Sim, com cartão** (sugerida) · **Ver outras opções**

- Faixa de passagem para humano (`padding: 12px 16px; border-top: 1px solid var(--pedra); background: var(--cave-quiz); display: flex; align-items: center; gap: 10px;`):
  - Texto (13 px `--palha`, `line-height: 1.35`): **Prefere falar com uma pessoa?** e, na linha de baixo em 11 px, **Seg a sex, 9h às 18h · sáb, 9h às 15h**
  - Botão (altura 40, `padding: 0 14px`, pílula, fundo `--whatsapp`, texto `--whatsapp-texto`, 13 px 600, ícone conversa 16 px): **Falar com um queijista**
- Campo de mensagem (`<form>`, `padding: 10px 12px 22px; display: flex; gap: 8px; background: var(--carvao); border-top: 1px solid var(--pedra);`): `<label>` visualmente oculto **Escreva sua mensagem**; input pílula altura 46, `padding: 0 16px`, borda `--pedra-clara`, fundo `--cave`, 14 px, placeholder **Escreva sua mensagem…**; botão enviar circular 46 × 46 dourado (`aria-label="Enviar"`, ícone enviar 18).

**Regras do assistente** (para quando for ligado a uma IA)
- Faz: recomenda produtos do catálogo e mostra o cartão do produto dentro do chat; adiciona à sacola; consulta pedido pelo número; responde dúvidas de entrega, conservação e troca.
- Passa para humano quando o cliente pede, em reclamação, pedido corporativo ou problema com entrega. Mensagem: **Vou chamar um queijista da nossa equipe. Continue pelo WhatsApp, já com o resumo desta conversa.**
- Nunca inventa queijos fora do catálogo, nunca promete prazo sem consultar o CEP, nunca dá orientação de saúde (ex.: gravidez e leite cru) além de recomendar consultar um médico.
- Nesta primeira versão, implemente o roteiro com respostas pré-definidas (árvore de opções) e um ponto de integração `lib/assistant.ts` para a IA futura.

### 8.3 WhatsApp
- Número em variável de ambiente `NEXT_PUBLIC_WHATSAPP_NUMBER` (formato internacional, só dígitos). Links no formato `https://wa.me/<numero>?text=<mensagem codificada>`.
- Mensagens pré-preenchidas:
  - Geral: **Olá! Vim pelo site do Ateliê do Queijo e queria ajuda para escolher.**
  - Produto: **Olá! Tenho uma dúvida sobre o [nome do queijo].**
  - Pedido: **Olá! Quero falar sobre o pedido nº [número].**
  - Corporativo: **Olá! Quero um orçamento de presentes para empresa.**
- Horário: segunda a sexta 9h–18h, sábado 9h–15h, fuso `America/Sao_Paulo`. Fora do horário, a aba "Queijista (WhatsApp)" mostra: **Nossa cave está fechada agora. Atendemos de segunda a sexta, das 9h às 18h, e aos sábados, das 9h às 15h. Se preferir, o Assistente do Ateliê responde na hora pelo site.** (o botão do WhatsApp continua disponível).
- Mensagens automáticas a configurar no WhatsApp Business (não é código): boas-vindas **Olá! Aqui é o Ateliê do Queijo. Um queijista já vai te responder. Enquanto isso, conta pra gente: é para você ou para presente?**

---

## 9. Dados: catálogo de lançamento

Crie `data/cheeses.ts` com o tipo abaixo e os 10 queijos. Os preços já incluem o acréscimo de R$ 20 por item definido pelo dono; são valores de lançamento a confirmar com fornecedores, mas devem aparecer exatamente assim.

```ts
export type Origem = 'brasil' | 'mundo';
export type Shape = 'wide' | 'tall' | 'flat' | 'small';

export interface Formato { id: string; nome: string; peso: string; preco: number; }

export interface Cheese {
  slug: string;
  nome: string;
  origem: Origem;
  tag: string;            // sobretítulo do cartão, MAIÚSCULAS
  nota: string;           // linha sensorial curta
  formatos: Formato[];    // o primeiro é o padrão na página de produto
  ilustracao: { shape: Shape; side: string; top: string }; // Apêndice A.6
  destaqueSemana?: boolean;
}
```

| # | slug | Nome | Origem | Tag | Nota | Formatos (peso → preço) | Ilustração (shape · side · top) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | canastra-curado | Canastra curado | brasil | BRASIL · SERRA DA CANASTRA, MG | Intenso, amanteigado, final picante. | Peça inteira ~1 kg → 136,00 · Meia peça ~500 g → 78,00 · Fração ~250 g → 49,00 | wide · #A8642A · #D9A752 |
| 2 | canastra-meia-cura-premiado | Canastra meia cura premiado | brasil | BRASIL · SERRA DA CANASTRA, MG | Macio, lácteo e delicado. | Peça inteira ~1 kg → 214,99 · Meia peça ~500 g → 117,50 | wide · #B98436 · #E8CB86 |
| 3 | creme-do-marajo | Creme do Marajó | brasil | BRASIL · ILHA DE MARAJÓ, PA | Leite de búfala, cremoso e suave. | Fração 200 g → 64,90 | small · #CDBFA0 · #F3EAD8 |
| 4 | penadinho-de-bufala | Penadinho de búfala | brasil | BRASIL · FAZENDA SANTA HELENA | Amanteigado, de leite de búfala. | Peça ~420 g → 119,00 | wide · #C9B98C · #EADFB9 |
| 5 | cabra-com-cinzas | Cabra com cinzas | brasil | BRASIL · SERRA DA MANTIQUEIRA, SP | Fresco, cítrico, casca aveludada. | Peça ~160 g → 74,00 | small · #3A3935 · #6E6C65 |
| 6 | gorgonzola-dolce | Gorgonzola Dolce | brasil | BRASIL · SERRA DAS ANTAS, MG | Macio, adocicado, veios suaves. | Fração ~300 g → 76,00 | wide · #9C8F6E · #E6DBB8 |
| 7 | tipo-gruyere | Tipo Gruyère | brasil | BRASIL · CRUZÍLIA, MG | Firme, com notas de nozes. | Meia peça ~500 g → 91,45 · Fração ~250 g → 55,73 | tall · #A07A3C · #D9B766 |
| 8 | brie-frances | Brie francês | mundo | FRANÇA · IMPORTADO | Cremoso, notas de cogumelo. | ~500 g → 224,95 · ~250 g → 122,48 | flat · #CFC6B2 · #F5EFE2 |
| 9 | parmigiano-reggiano | Parmigiano Reggiano DOP | mundo | ITÁLIA · IMPORTADO | Granuloso, salgado, umami. | ~500 g → 230,00 · ~250 g → 125,00 | tall · #B88F3F · #E2C27A |
| 10 | manchego | Manchego DOP | mundo | ESPANHA · IMPORTADO | Leite de ovelha, firme e curado. | ~500 g → 239,98 · ~250 g → 129,99 | wide · #8C6A3A · #D8B878 |

- Destaques da semana (Home 5.4): canastra-curado, brie-frances, gorgonzola-dolce, cabra-com-cinzas. Na Home, use as ilustrações detalhadas do Apêndice A.4 para esses quatro; no catálogo, use o gerador A.6 para todos.
- **Preço exibido no cartão**: se o queijo tem mais de um formato, mostre "a partir de" + o menor preço; se tem um só, mostre o peso (ex.: "~300 g", "200 g") + o preço.
- **Formatação**: `Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })`. Pix = preço × 0,95, arredondado a 2 casas.
- O detalhe completo (selos, descrição, perfil sensorial, abas) existe apenas para o Canastra curado (seção 7). Para os demais, crie os campos e preencha com `[A DEFINIR]`, sem inventar características.

---

## 10. Estado e interações

### 10.1 Sacola
- Itens: `{ slug, formatoId, quantidade }`. Contador no cabeçalho = soma das quantidades.
- Página `/sacola`: lista de itens, subtotal, barra de frete grátis: **Faltam R$ [valor] para o frete grátis.** → ao atingir R$ 180: **Frete grátis garantido.** Sacola vazia: **Sua tábua ainda está vazia.** + botão **Explorar a cave**.

### 10.2 Checkout (`/checkout`)
- Etapas: **1. Entrega · 2. Pagamento · 3. Confirmação**.
- Aviso de envio: **Enviamos de segunda a quarta, para que seu queijo nunca passe o fim de semana em trânsito.**
- Pagamento: **Pix (5% de desconto)** · **Cartão em até [n]x sem juros**.
- Erro de pagamento: **Não conseguimos confirmar o pagamento. Nada foi cobrado. Tente outra forma ou fale com a gente.**
- Confirmação: título **Seu queijo já está sendo preparado.** e texto **Enviamos os detalhes para [e-mail]. Você vai receber o código de rastreio assim que a caixa sair da cave.**
- Embalar para presente: cartão com mensagem (até 200 caracteres), data de entrega escolhida, nota fiscal sem valor visível ao presenteado.

### 10.3 Visualizador 3D
- Estado `{ cortado: boolean (padrão true), girando: boolean (padrão true), zoom: boolean }`.
- Rotação automática: uma volta a cada **10 s** até o primeiro toque; depois, giro livre com dedo/mouse.
- Respeitar `prefers-reduced-motion`: sem rotação automática.

### 10.4 Quiz
- Três respostas → pontuação simples por queijo:
  - Sabor: suaves → Creme do Marajó, Penadinho, Brie; equilibrados → Gorgonzola Dolce, Tipo Gruyère, Canastra meia cura; intensos → Canastra curado, Parmigiano, Manchego, Cabra com cinzas.
  - Uso: presente → priorizar formatos maiores/kits; tábua → queijos de casca bonita (Brie, Canastra, Cabra); para mim → qualquer.
  - Acompanhamento: tinto → curados (Canastra curado, Manchego, Parmigiano); branco/espumante → Brie, Cabra com cinzas; cerveja → Tipo Gruyère, Gorgonzola; café/mel → Gorgonzola Dolce, Canastra meia cura.
- Mostra o queijo com mais pontos (desempate pela ordem do catálogo).

### 10.5 Rotas e links
| Elemento | Destino |
| --- | --- |
| Logotipo | `/` |
| Explorar a cave, Ver todos os queijos, menu "Queijos" | `/queijos` |
| Montar um presente, Ver todos os presentes, menu "Presentes" | `/presentes` |
| Nome do queijo nos cartões | `/queijos/[slug]` |
| Botão flutuante, "Fale conosco", "Pedir ajuda" | abre o painel de atendimento |
| Fale com um queijista (produto) | WhatsApp com mensagem do produto |

---

## 11. Modelos 3D

- Formato **GLB**, até ~3 MB cada, texturas 2K comprimidas, em `public/models/<slug>-inteiro.glb` e `public/models/<slug>-cortado.glb`. Ainda não existem: até lá, use os SVGs do Apêndice A.
- Componente `CheeseViewer`:
  - Se existir o GLB, renderiza `<model-viewer>` com `camera-controls`, `auto-rotate`, `rotation-per-second="36deg"` (uma volta em 10 s), `shadow-intensity="1"`, `exposure="0.9"`, `interaction-prompt="none"`, `ar` (só no mobile, para "Ver na mesa") e fundo transparente sobre o palco `--cave-funda`.
  - Iluminação desejada: luz quente (~3200 K) vinda da esquerda; peça apoiada sobre ardósia; sombra de contato suave.
  - O alternador de corte troca entre o GLB inteiro e o cortado.
  - Carregar o 3D somente na página de produto e no hero (lazy, depois que a ilustração SVG já estiver visível).
  - Sem GLB ou sem WebGL: mostrar o SVG correspondente.

---

## 12. Textos das páginas ainda não prototipadas

Use os mesmos componentes, cabeçalhos de seção (sobretítulo + h2 + parágrafo) e espaçamentos da Home.

**Presentes (`/presentes`)**
- Título: **Para quem merece uma boa tábua.**
- Filtros: Ocasião (aniversário, agradecimento, corporativo, fim de ano) · Faixa de preço · Tamanho (2 a 7 queijos).
- Em todo kit: embalagem de presente, cartão com mensagem (até 200 caracteres), data de entrega escolhida, nota fiscal sem valor visível ao presenteado.
- Bloco corporativo: **Presentes para equipes e clientes. Pedidos a partir de [n] kits com personalização.** Botão: **Pedir orçamento** (WhatsApp, mensagem corporativa).

**Aprenda (`/aprenda`)**
- Título: **Escola do Ateliê**
- Categorias: Primeiros passos · Harmonização · Servir e guardar · Regiões e produtores.
- Cada artigo termina com os queijos citados, prontos para comprar (ProductCard).

**Nossos produtores / Sobre (`/produtores`)**
- Título: **Quem faz o queijo importa.**
- Texto: **O Ateliê nasceu da vontade de levar até você queijos que só se encontravam na porta da fazenda ou nas melhores queijarias da Europa. Conhecemos cada produtor, provamos cada lote e só vendemos o que serviríamos em casa.**
- Grade de produtores: foto, nome, região, "desde [ano]", link para os queijos dele.

**Página 404**
- **Esta página foi maturar em outro lugar.** + botão **Volta para a cave** (→ `/`).

---

## 13. Acessibilidade e qualidade

- Contrastes aprovados: creme sobre cave ≈ 16:1; palha sobre cave ≈ 8:1; cave sobre dourado ≈ 8:1. Não use `--placeholder` (#8C8070) para textos importantes.
- Use elementos reais: `<button>`, `<a href>`, `<input>` com `<label>`. Botões só com ícone têm `aria-label`.
- SVGs decorativos: `aria-hidden="true"`. Ilustrações de queijo: `role="img"` + `aria-label` descritivo.
- Alvos de toque ≥ 44 px. Foco visível em dourado.
- Abas com padrão WAI-ARIA (`role="tab"`, `aria-selected`, setas do teclado). Botões de alternância com `aria-pressed`.
- Desempenho: fontes com `display: swap`; 3D carregado sob demanda; imagens com `next/image`.
- SEO: `<title>` por página (ex.: "Canastra curado — Ateliê do Queijo"), meta description com a nota sensorial, dados estruturados `Product` com preço em BRL.

---

## 14. Checklist de aceite

- [ ] Tokens de cor da seção 3.1 definidos e nenhuma outra cor usada fora dos SVGs.
- [ ] Cormorant Garamond e Manrope carregadas com os pesos indicados.
- [ ] Home com as 9 seções na ordem e com os espaçamentos exatos (48/96 no hero, 112 e 128 entre seções).
- [ ] Hero: título em 76 px com "escolhidos à mão." em itálico dourado; ilustração A.3; pílula "Arraste para girar"; etiqueta do Canastra no canto inferior direito.
- [ ] Faixa de confiança com 4 itens e ícones dourados.
- [ ] Catálogo com 10 queijos, filtro Todos (10) / Brasil (7) / Mundo (3) funcionando e refletido na URL.
- [ ] Página de produto: alternador "Ver por dentro" (rótulo fixo, `aria-pressed`; P21) troca a ilustração e o indicador POR DENTRO / PEÇA INTEIRA; formatos mudam preço e valor no Pix; abas funcionam.
- [ ] Mobile: barra fixa com preço e "Adicionar à sacola"; botão flutuante acima dela.
- [ ] Painel de atendimento com as duas abas, roteiro do assistente, horário e botão verde do WhatsApp com mensagem pré-preenchida.
- [ ] Sacola com contador, barra de frete grátis (R$ 180) e desconto de 5% no Pix.
- [ ] Textos idênticos aos deste documento, incluindo as lacunas entre colchetes.
- [ ] Sem rolagem horizontal de 360 px a 1920 px de largura.
- [ ] Comparação visual lado a lado com o protótipo a 1440 px e 390 px sem diferenças perceptíveis.

---

## Apêndice A — Ilustrações SVG exatas

Copie literalmente (convertendo atributos para JSX quando necessário: `stroke-width` → `strokeWidth`, `stop-color` → `stopColor`, `fill-opacity` → `fillOpacity` etc.). **Os `id` de gradientes precisam ser únicos na página**: ao reutilizar um SVG mais de uma vez, gere ids com `useId()`.

### A.1 Símbolo do logotipo (cabeçalho, 34 px)

```html
<svg width="34" height="34" viewBox="0 0 34 34" aria-hidden="true">
<path d="M17 3L31 30H3Z" fill="none" stroke="#C9A24B" stroke-width="1.5" stroke-linejoin="round">
</path>
<path d="M9.5 21H24.5" stroke="#C9A24B" stroke-width="1.5">
</path>
<circle cx="17" cy="13.5" r="1.8" fill="#C9A24B">
</circle>
<circle cx="13" cy="25.5" r="1.5" fill="#C9A24B">
</circle>
<circle cx="21.5" cy="25.8" r="1.2" fill="#C9A24B">
</circle>
</svg>
```

Versão mobile (24 px, traço 1.8, olhaduras um pouco maiores):

```html
<svg width="24" height="24" viewBox="0 0 34 34" aria-hidden="true">
<path d="M17 3L31 30H3Z" fill="none" stroke="#C9A24B" stroke-width="1.8" stroke-linejoin="round">
</path>
<path d="M9.5 21H24.5" stroke="#C9A24B" stroke-width="1.8">
</path>
<circle cx="17" cy="13.5" r="2" fill="#C9A24B">
</circle>
<circle cx="13" cy="25.5" r="1.7" fill="#C9A24B">
</circle>
<circle cx="21.5" cy="25.8" r="1.4" fill="#C9A24B">
</circle>
</svg>
```

Versão grande (página de marca, 96 px, traço 1.1):

```html
<svg width="96" height="96" viewBox="0 0 34 34" aria-hidden="true">
<path d="M17 3L31 30H3Z" fill="none" stroke="#C9A24B" stroke-width="1.1" stroke-linejoin="round">
</path>
<path d="M9.5 21H24.5" stroke="#C9A24B" stroke-width="1.1">
</path>
<circle cx="17" cy="13.5" r="1.8" fill="#C9A24B">
</circle>
<circle cx="13" cy="25.5" r="1.5" fill="#C9A24B">
</circle>
<circle cx="21.5" cy="25.8" r="1.2" fill="#C9A24B">
</circle>
</svg>
```

### A.2 Variações do símbolo

Sobre dourado (container 120 px de altura, fundo `--ouro`, raio 16):

```html
<svg width="56" height="56" viewBox="0 0 34 34" role="img" aria-label="Símbolo sobre dourado">
<path d="M17 3L31 30H3Z" fill="none" stroke="#14110F" stroke-width="1.4" stroke-linejoin="round">
</path>
<path d="M9.5 21H24.5" stroke="#14110F" stroke-width="1.4">
</path>
<circle cx="17" cy="13.5" r="1.8" fill="#14110F">
</circle>
<circle cx="13" cy="25.5" r="1.5" fill="#14110F">
</circle>
<circle cx="21.5" cy="25.8" r="1.2" fill="#14110F">
</circle>
</svg>
```

Sobre creme (fundo `--creme`):

```html
<svg width="56" height="56" viewBox="0 0 34 34" role="img" aria-label="Símbolo sobre creme">
<path d="M17 3L31 30H3Z" fill="none" stroke="#14110F" stroke-width="1.4" stroke-linejoin="round">
</path>
<path d="M9.5 21H24.5" stroke="#14110F" stroke-width="1.4">
</path>
<circle cx="17" cy="13.5" r="1.8" fill="#A8642A">
</circle>
<circle cx="13" cy="25.5" r="1.5" fill="#A8642A">
</circle>
<circle cx="21.5" cy="25.8" r="1.2" fill="#A8642A">
</circle>
</svg>
```

Selo circular (dentro de um círculo de 72 px com borda `1px solid var(--ouro)`):

```html
<svg width="36" height="36" viewBox="0 0 34 34" role="img" aria-label="Selo para caixa e etiquetas">
<path d="M17 3L31 30H3Z" fill="none" stroke="#C9A24B" stroke-width="1.4" stroke-linejoin="round">
</path>
<path d="M9.5 21H24.5" stroke="#C9A24B" stroke-width="1.4">
</path>
<circle cx="17" cy="13.5" r="1.8" fill="#C9A24B">
</circle>
</svg>
```

Avatar do assistente (dentro de um círculo de 40 px com borda dourada):

```html
<svg width="22" height="22" viewBox="0 0 34 34" aria-hidden="true">
<path d="M17 3L31 30H3Z" fill="none" stroke="#C9A24B" stroke-width="1.8" stroke-linejoin="round">
</path>
<path d="M9.5 21H24.5" stroke="#C9A24B" stroke-width="1.8">
</path>
<circle cx="17" cy="13.5" r="2" fill="#C9A24B">
</circle>
</svg>
```

### A.3 Queijo do hero (Home)

Canastra com uma fatia cortada à frente, sobre ardósia, com halo dourado. `style="width: 100%; height: auto; display: block"`.

```html
<svg viewBox="0 0 460 340" style="width: 100%; height: auto; display: block" role="img" aria-label="Queijo curado em 3D, com uma fatia cortada à frente, sobre ardósia">
<defs>
<radialGradient id="hh" cx="50%" cy="46%" r="50%">
<stop offset="0" stop-color="#C9A24B" stop-opacity="0.30">
</stop>
<stop offset="0.6" stop-color="#C9A24B" stop-opacity="0.08">
</stop>
<stop offset="1" stop-color="#C9A24B" stop-opacity="0">
</stop>
</radialGradient>
<linearGradient id="hr" x1="0" x2="1" y1="0" y2="0">
<stop offset="0" stop-color="#6E3D17">
</stop>
<stop offset="0.38" stop-color="#C98B3E">
</stop>
<stop offset="1" stop-color="#5A3112">
</stop>
</linearGradient>
<linearGradient id="ht" x1="0" x2="0" y1="0" y2="1">
<stop offset="0" stop-color="#E6BE6E">
</stop>
<stop offset="1" stop-color="#B98436">
</stop>
</linearGradient>
</defs>
<ellipse cx="230" cy="160" rx="230" ry="160" fill="url(#hh)">
</ellipse>
<ellipse cx="215" cy="268" rx="205" ry="42" fill="#241F1B" stroke="#3A322C">
</ellipse>
<ellipse cx="195" cy="258" rx="160" ry="22" fill="#000" fill-opacity="0.55">
</ellipse>
<path d="M40 150V214A150 46 0 0 0 340 214V150Z" fill="url(#hr)">
</path>
<ellipse cx="190" cy="150" rx="150" ry="46" fill="url(#ht)">
</ellipse>
<ellipse cx="190" cy="150" rx="118" ry="35" fill="none" stroke="#8A5A22" stroke-opacity="0.35">
</ellipse>
<ellipse cx="190" cy="150" rx="78" ry="23" fill="none" stroke="#8A5A22" stroke-opacity="0.25">
</ellipse>
<ellipse cx="362" cy="288" rx="62" ry="9" fill="#000" fill-opacity="0.5">
</ellipse>
<path d="M296 206L414 220L384 250Z" fill="#DDB262">
</path>
<path d="M296 206L384 250L384 286L296 242Z" fill="#F0CF84">
</path>
<path d="M384 250L414 220L414 256L384 286Z" fill="#7A4419">
</path>
<ellipse cx="322" cy="234" rx="5" ry="3.5" fill="#C99B4A">
</ellipse>
<ellipse cx="350" cy="252" rx="4" ry="3" fill="#C99B4A">
</ellipse>
<ellipse cx="333" cy="258" rx="3" ry="2.2" fill="#C99B4A">
</ellipse>
<ellipse cx="364" cy="268" rx="3.4" ry="2.4" fill="#C99B4A">
</ellipse>
</svg>
```

### A.4 Miniaturas da Home ("Na cave esta semana")

`style="width: 100%; height: auto; display: block"` dentro do cartão.

A.4.1 Canastra curado

```html
<svg viewBox="0 0 300 190" style="width: 100%; height: auto; display: block" role="img" aria-label="Miniatura 3D do Canastra curado">
<defs>
<radialGradient id="h1" cx="50%" cy="50%" r="50%">
<stop offset="0" stop-color="#C9A24B" stop-opacity="0.18">
</stop>
<stop offset="1" stop-color="#C9A24B" stop-opacity="0">
</stop>
</radialGradient>
<linearGradient id="r1" x1="0" x2="1">
<stop offset="0" stop-color="#6E3D17">
</stop>
<stop offset="0.4" stop-color="#C98B3E">
</stop>
<stop offset="1" stop-color="#5A3112">
</stop>
</linearGradient>
<linearGradient id="t1" x1="0" x2="0" y1="0" y2="1">
<stop offset="0" stop-color="#E6BE6E">
</stop>
<stop offset="1" stop-color="#B98436">
</stop>
</linearGradient>
</defs>
<ellipse cx="150" cy="95" rx="150" ry="95" fill="url(#h1)">
</ellipse>
<ellipse cx="150" cy="164" rx="116" ry="13" fill="#000" fill-opacity="0.55">
</ellipse>
<path d="M40 82V124A110 34 0 0 0 260 124V82Z" fill="url(#r1)">
</path>
<ellipse cx="150" cy="82" rx="110" ry="34" fill="url(#t1)">
</ellipse>
<ellipse cx="150" cy="82" rx="84" ry="25" fill="none" stroke="#8A5A22" stroke-opacity="0.35">
</ellipse>
</svg>
```

A.4.2 Brie francês

```html
<svg viewBox="0 0 300 190" style="width: 100%; height: auto; display: block" role="img" aria-label="Miniatura 3D do brie francês">
<defs>
<radialGradient id="h2" cx="50%" cy="50%" r="50%">
<stop offset="0" stop-color="#C9A24B" stop-opacity="0.18">
</stop>
<stop offset="1" stop-color="#C9A24B" stop-opacity="0">
</stop>
</radialGradient>
<linearGradient id="r2" x1="0" x2="1">
<stop offset="0" stop-color="#B9AF9C">
</stop>
<stop offset="0.4" stop-color="#EEE7D8">
</stop>
<stop offset="1" stop-color="#A69C88">
</stop>
</linearGradient>
<linearGradient id="t2" x1="0" x2="0" y1="0" y2="1">
<stop offset="0" stop-color="#F8F3E8">
</stop>
<stop offset="1" stop-color="#DDD4C2">
</stop>
</linearGradient>
</defs>
<ellipse cx="150" cy="95" rx="150" ry="95" fill="url(#h2)">
</ellipse>
<ellipse cx="150" cy="156" rx="122" ry="12" fill="#000" fill-opacity="0.55">
</ellipse>
<path d="M30 96V122A120 34 0 0 0 270 122V96Z" fill="url(#r2)">
</path>
<ellipse cx="150" cy="96" rx="120" ry="34" fill="url(#t2)">
</ellipse>
<ellipse cx="150" cy="96" rx="96" ry="26" fill="none" stroke="#B8AE9A" stroke-opacity="0.4" stroke-dasharray="2 5">
</ellipse>
</svg>
```

A.4.3 Gorgonzola Dolce (com veios azuis)

```html
<svg viewBox="0 0 300 190" style="width: 100%; height: auto; display: block" role="img" aria-label="Miniatura 3D do Gorgonzola Dolce">
<defs>
<radialGradient id="h3" cx="50%" cy="50%" r="50%">
<stop offset="0" stop-color="#C9A24B" stop-opacity="0.18">
</stop>
<stop offset="1" stop-color="#C9A24B" stop-opacity="0">
</stop>
</radialGradient>
<linearGradient id="r3" x1="0" x2="1">
<stop offset="0" stop-color="#9C8F6E">
</stop>
<stop offset="0.4" stop-color="#D6C9A4">
</stop>
<stop offset="1" stop-color="#857958">
</stop>
</linearGradient>
<linearGradient id="t3" x1="0" x2="0" y1="0" y2="1">
<stop offset="0" stop-color="#F1E8CF">
</stop>
<stop offset="1" stop-color="#D8CBA6">
</stop>
</linearGradient>
</defs>
<ellipse cx="150" cy="95" rx="150" ry="95" fill="url(#h3)">
</ellipse>
<ellipse cx="150" cy="164" rx="110" ry="13" fill="#000" fill-opacity="0.55">
</ellipse>
<path d="M45 74V124A105 32 0 0 0 255 124V74Z" fill="url(#r3)">
</path>
<ellipse cx="150" cy="74" rx="105" ry="32" fill="url(#t3)">
</ellipse>
<path d="M100 70c10-6 18 4 28-2M150 64c8 6 16-2 26 4M120 86c10-4 14 6 24 0M175 82c6 6 14 0 22 6" fill="none" stroke="#4C6070" stroke-width="2.4" stroke-linecap="round">
</path>
<circle cx="110" cy="80" r="2.4" fill="#4C6070">
</circle>
<circle cx="190" cy="70" r="2" fill="#4C6070">
</circle>
<circle cx="160" cy="92" r="2.2" fill="#4C6070">
</circle>
</svg>
```

A.4.4 Cabra com cinzas

```html
<svg viewBox="0 0 300 190" style="width: 100%; height: auto; display: block" role="img" aria-label="Miniatura 3D de queijo de cabra com cinzas">
<defs>
<radialGradient id="h4" cx="50%" cy="50%" r="50%">
<stop offset="0" stop-color="#C9A24B" stop-opacity="0.18">
</stop>
<stop offset="1" stop-color="#C9A24B" stop-opacity="0">
</stop>
</radialGradient>
<linearGradient id="r4" x1="0" x2="1">
<stop offset="0" stop-color="#2C2B28">
</stop>
<stop offset="0.4" stop-color="#5B5A54">
</stop>
<stop offset="1" stop-color="#262522">
</stop>
</linearGradient>
<linearGradient id="t4" x1="0" x2="0" y1="0" y2="1">
<stop offset="0" stop-color="#6E6C65">
</stop>
<stop offset="1" stop-color="#46453F">
</stop>
</linearGradient>
</defs>
<ellipse cx="150" cy="95" rx="150" ry="95" fill="url(#h4)">
</ellipse>
<ellipse cx="150" cy="160" rx="84" ry="12" fill="#000" fill-opacity="0.55">
</ellipse>
<path d="M70 66V122A80 26 0 0 0 230 122V66Z" fill="url(#r4)">
</path>
<ellipse cx="150" cy="66" rx="80" ry="26" fill="url(#t4)">
</ellipse>
<ellipse cx="150" cy="66" rx="56" ry="17" fill="none" stroke="#9A988F" stroke-opacity="0.3" stroke-dasharray="1 4">
</ellipse>
</svg>
```

### A.5 Página de produto

A.5.1 Cortado — "POR DENTRO" (estado padrão), `style="width: 100%; height: auto; display: block; margin-top: 16px"`:

```html
<svg viewBox="0 0 460 340" style="width: 100%; height: auto; display: block; margin-top: 16px" role="img" aria-label="Canastra curado com uma fatia cortada, mostrando a massa e as olhaduras">
<defs>
<radialGradient id="ph" cx="50%" cy="46%" r="50%">
<stop offset="0" stop-color="#C9A24B" stop-opacity="0.30">
</stop>
<stop offset="0.6" stop-color="#C9A24B" stop-opacity="0.08">
</stop>
<stop offset="1" stop-color="#C9A24B" stop-opacity="0">
</stop>
</radialGradient>
<linearGradient id="pr" x1="0" x2="1">
<stop offset="0" stop-color="#6E3D17">
</stop>
<stop offset="0.38" stop-color="#C98B3E">
</stop>
<stop offset="1" stop-color="#5A3112">
</stop>
</linearGradient>
<linearGradient id="pt" x1="0" x2="0" y1="0" y2="1">
<stop offset="0" stop-color="#E6BE6E">
</stop>
<stop offset="1" stop-color="#B98436">
</stop>
</linearGradient>
</defs>
<ellipse cx="230" cy="160" rx="230" ry="160" fill="url(#ph)">
</ellipse>
<ellipse cx="215" cy="268" rx="205" ry="42" fill="#241F1B" stroke="#3A322C">
</ellipse>
<ellipse cx="195" cy="258" rx="160" ry="22" fill="#000" fill-opacity="0.55">
</ellipse>
<path d="M40 150V214A150 46 0 0 0 340 214V150Z" fill="url(#pr)">
</path>
<ellipse cx="190" cy="150" rx="150" ry="46" fill="url(#pt)">
</ellipse>
<ellipse cx="190" cy="150" rx="118" ry="35" fill="none" stroke="#8A5A22" stroke-opacity="0.35">
</ellipse>
<ellipse cx="190" cy="150" rx="78" ry="23" fill="none" stroke="#8A5A22" stroke-opacity="0.25">
</ellipse>
<ellipse cx="362" cy="288" rx="62" ry="9" fill="#000" fill-opacity="0.5">
</ellipse>
<path d="M296 206L414 220L384 250Z" fill="#DDB262">
</path>
<path d="M296 206L384 250L384 286L296 242Z" fill="#F0CF84">
</path>
<path d="M384 250L414 220L414 256L384 286Z" fill="#7A4419">
</path>
<ellipse cx="322" cy="234" rx="5" ry="3.5" fill="#C99B4A">
</ellipse>
<ellipse cx="350" cy="252" rx="4" ry="3" fill="#C99B4A">
</ellipse>
<ellipse cx="333" cy="258" rx="3" ry="2.2" fill="#C99B4A">
</ellipse>
<ellipse cx="364" cy="268" rx="3.4" ry="2.4" fill="#C99B4A">
</ellipse>
</svg>
```

A.5.2 Inteiro — "PEÇA INTEIRA":

```html
<svg viewBox="0 0 460 340" style="width: 100%; height: auto; display: block; margin-top: 16px" role="img" aria-label="Canastra curado, peça inteira">
<defs>
<radialGradient id="wh" cx="50%" cy="46%" r="50%">
<stop offset="0" stop-color="#C9A24B" stop-opacity="0.30">
</stop>
<stop offset="0.6" stop-color="#C9A24B" stop-opacity="0.08">
</stop>
<stop offset="1" stop-color="#C9A24B" stop-opacity="0">
</stop>
</radialGradient>
<linearGradient id="wr" x1="0" x2="1">
<stop offset="0" stop-color="#6E3D17">
</stop>
<stop offset="0.38" stop-color="#C98B3E">
</stop>
<stop offset="1" stop-color="#5A3112">
</stop>
</linearGradient>
<linearGradient id="wt" x1="0" x2="0" y1="0" y2="1">
<stop offset="0" stop-color="#E6BE6E">
</stop>
<stop offset="1" stop-color="#B98436">
</stop>
</linearGradient>
</defs>
<ellipse cx="230" cy="160" rx="230" ry="160" fill="url(#wh)">
</ellipse>
<ellipse cx="230" cy="268" rx="205" ry="42" fill="#241F1B" stroke="#3A322C">
</ellipse>
<ellipse cx="230" cy="258" rx="160" ry="22" fill="#000" fill-opacity="0.55">
</ellipse>
<path d="M80 150V214A150 46 0 0 0 380 214V150Z" fill="url(#wr)">
</path>
<ellipse cx="230" cy="150" rx="150" ry="46" fill="url(#wt)">
</ellipse>
<ellipse cx="230" cy="150" rx="118" ry="35" fill="none" stroke="#8A5A22" stroke-opacity="0.35">
</ellipse>
<ellipse cx="230" cy="150" rx="78" ry="23" fill="none" stroke="#8A5A22" stroke-opacity="0.25">
</ellipse>
</svg>
```

A.5.3 Versão do celular (cortado):

```html
<svg viewBox="0 0 460 340" style="width: 100%; height: auto; display: block" role="img" aria-label="Canastra curado em 3D, com fatia cortada">
<defs>
<radialGradient id="mh" cx="50%" cy="46%" r="50%">
<stop offset="0" stop-color="#C9A24B" stop-opacity="0.30">
</stop>
<stop offset="1" stop-color="#C9A24B" stop-opacity="0">
</stop>
</radialGradient>
<linearGradient id="mr" x1="0" x2="1">
<stop offset="0" stop-color="#6E3D17">
</stop>
<stop offset="0.38" stop-color="#C98B3E">
</stop>
<stop offset="1" stop-color="#5A3112">
</stop>
</linearGradient>
<linearGradient id="mt" x1="0" x2="0" y1="0" y2="1">
<stop offset="0" stop-color="#E6BE6E">
</stop>
<stop offset="1" stop-color="#B98436">
</stop>
</linearGradient>
</defs>
<ellipse cx="230" cy="170" rx="230" ry="160" fill="url(#mh)">
</ellipse>
<ellipse cx="215" cy="268" rx="205" ry="42" fill="#241F1B" stroke="#3A322C">
</ellipse>
<ellipse cx="195" cy="258" rx="160" ry="22" fill="#000" fill-opacity="0.55">
</ellipse>
<path d="M40 150V214A150 46 0 0 0 340 214V150Z" fill="url(#mr)">
</path>
<ellipse cx="190" cy="150" rx="150" ry="46" fill="url(#mt)">
</ellipse>
<ellipse cx="190" cy="150" rx="118" ry="35" fill="none" stroke="#8A5A22" stroke-opacity="0.35">
</ellipse>
<ellipse cx="362" cy="288" rx="62" ry="9" fill="#000" fill-opacity="0.5">
</ellipse>
<path d="M296 206L414 220L384 250Z" fill="#DDB262">
</path>
<path d="M296 206L384 250L384 286L296 242Z" fill="#F0CF84">
</path>
<path d="M384 250L414 220L414 256L384 286Z" fill="#7A4419">
</path>
<ellipse cx="322" cy="234" rx="5" ry="3.5" fill="#C99B4A">
</ellipse>
<ellipse cx="350" cy="252" rx="4" ry="3" fill="#C99B4A">
</ellipse>
<ellipse cx="364" cy="268" rx="3.4" ry="2.4" fill="#C99B4A">
</ellipse>
</svg>
```

### A.6 Gerador de miniaturas do catálogo

Todas as miniaturas do catálogo usam o mesmo desenho (roda de queijo vista de cima em perspectiva), mudando formato e duas cores. `viewBox="0 0 300 190"`.

```tsx
const SHAPES = {
  wide:  { rx: 110, ry: 34, h: 44, ty: 76 },
  tall:  { rx: 84,  ry: 26, h: 66, ty: 62 },
  flat:  { rx: 118, ry: 34, h: 30, ty: 86 },
  small: { rx: 74,  ry: 24, h: 50, ty: 72 },
} as const;

export function CheeseIllustration({ shape, side, top, label }: {
  shape: keyof typeof SHAPES; side: string; top: string; label: string;
}) {
  const g = SHAPES[shape];
  const sideD = `M${150 - g.rx} ${g.ty}V${g.ty + g.h}A${g.rx} ${g.ry} 0 0 0 ${150 + g.rx} ${g.ty + g.h}V${g.ty}Z`;
  return (
    <svg viewBox="0 0 300 190" style={{ width: '100%', height: 'auto', display: 'block' }}
         role="img" aria-label={`${label}, ilustração do queijo`}>
      {/* halo */}
      <ellipse cx="150" cy="95" rx="150" ry="95" fill="#C9A24B" fillOpacity={0.07} />
      {/* sombra */}
      <ellipse cx="150" cy={g.ty + g.h + 10} rx={Math.round(g.rx * 1.05)} ry="12" fill="#000" fillOpacity={0.55} />
      {/* lateral (casca) */}
      <path d={sideD} fill={side} />
      {/* topo */}
      <ellipse cx="150" cy={g.ty} rx={g.rx} ry={g.ry} fill={top} />
      {/* anel interno */}
      <ellipse cx="150" cy={g.ty} rx={Math.round(g.rx * 0.74)} ry={Math.round(g.ry * 0.74)}
               fill="none" stroke="#000" strokeOpacity={0.14} />
    </svg>
  );
}
```

### A.7 Miniatura do cartão no chat (84 px de largura)

```html
<svg viewBox="0 0 300 190" style="width: 84px; height: auto; flex: none" role="img" aria-label="Miniatura 3D do Canastra curado">
<defs>
<linearGradient id="ar" x1="0" x2="1">
<stop offset="0" stop-color="#6E3D17">
</stop>
<stop offset="0.4" stop-color="#C98B3E">
</stop>
<stop offset="1" stop-color="#5A3112">
</stop>
</linearGradient>
<linearGradient id="at" x1="0" x2="0" y1="0" y2="1">
<stop offset="0" stop-color="#E6BE6E">
</stop>
<stop offset="1" stop-color="#B98436">
</stop>
</linearGradient>
</defs>
<ellipse cx="150" cy="164" rx="116" ry="13" fill="#000" fill-opacity="0.55">
</ellipse>
<path d="M40 82V124A110 34 0 0 0 260 124V82Z" fill="url(#ar)">
</path>
<ellipse cx="150" cy="82" rx="110" ry="34" fill="url(#at)">
</ellipse>
</svg>
```

---

## Apêndice B — Glossário de termos usados nos textos

- **Cave**: câmara de maturação de queijos; nome do catálogo e metáfora visual do site.
- **Queijista**: profissional que seleciona, matura e orienta sobre queijos; nome do atendimento humano.
- **Pingo**: fermento natural do queijo da Canastra, recolhido do soro.
- **Selo Arte / SIF / SISBI**: selos de inspeção sanitária que permitem a venda entre estados.
- **DOP / AOP**: denominação de origem protegida (Itália/Espanha e França/Suíça).
