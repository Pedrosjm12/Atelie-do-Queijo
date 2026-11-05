# Guia de conteúdo (para o dono da loja)

Este guia explica como cuidar do que aparece na loja, sem precisar programar. Ele cresce a cada etapa do projeto. Hoje cobre **queijos**, **modelos 3D**, o **assistente, o horário e o WhatsApp**, e as páginas **Presentes (kits)**, **Aprenda (artigos)** e **Nossos produtores**. O que ainda não está aqui está listado no fim, em [O que ainda não está neste guia](#o-que-ainda-não-está-neste-guia).

> **Aviso.** A loja é **simulada**. Alguns dados são **fictícios** (WhatsApp, CNPJ, endereço, frete, prazo, parcelas e produtor do Canastra). Eles ficam todos no arquivo `data/ficticio.ts` e **precisam ser trocados antes de a loja ir ao ar**. O sistema barra a publicação enquanto houver dados fictícios.

## Como cadastrar um novo queijo

Os queijos ficam no arquivo `data/cheeses.ts`. Cada queijo é um bloco com os campos abaixo. Hoje, cadastrar um queijo novo mexe em arquivos de código (a lista de queijos e os testes). Por isso, **peça ajuda a quem mantém o código** para a parte técnica. Esta seção serve para você **reunir as informações certas** antes de pedir.

| Campo            | O que é                                                                          | Exemplo                                          |
| ---------------- | -------------------------------------------------------------------------------- | ------------------------------------------------ |
| `slug`           | Nome do queijo para o endereço do site. Minúsculas, sem acento, com hífen        | `canastra-curado`                                |
| `nome`           | Nome que aparece na loja                                                         | `Canastra curado`                                |
| `origem`         | `brasil` ou `mundo`. Define o filtro do catálogo                                 | `brasil`                                         |
| `tag`            | Linha pequena acima do nome, em MAIÚSCULAS                                       | `BRASIL · SERRA DA CANASTRA, MG`                 |
| `nota`           | Frase curta sobre o sabor. Também aparece nos resultados de busca (Google)       | `Intenso, amanteigado, final picante.`           |
| `formatos`       | Lista de tamanhos, cada um com `id`, `nome`, `peso` e `preco`                    | Peça inteira, ~1 kg, 13600                       |
| `ilustracao`     | Formato do desenho e duas cores (lado e topo) da ilustração do queijo            | `shape: 'wide'`, `side: '#A8642A'`               |
| `destaqueSemana` | Opcional. Posição de 1 a 4 em "Na cave esta semana"                              | `1`                                              |
| `detalhe`        | Textos da página do queijo: produtor, selos, descrição, história, como servir... | veja abaixo                                      |
| `estoque`        | `disponivel`, `ultimas` ou `esgotado`                                            | `{ situacao: 'disponivel' }`                     |

Regras importantes:

- **O preço é escrito em centavos, sem vírgula.** R$ 136,00 vira `13600`. R$ 78,00 vira `7800`.
- O primeiro formato da lista é o que aparece já escolhido na página.
- O `shape` da ilustração é um de `wide` (larga), `tall` (alta), `flat` (achatada) ou `small` (pequena).
- Um queijo **sem ficha pronta** usa o texto `[A DEFINIR]` nos campos de `detalhe`. Esse texto aparece na loja de propósito, para lembrar o que falta. **Não o apague nem invente a informação**: troque pelo texto real quando tiver.
- Os campos de `detalhe` são: produtor, selos, descrição (e uma versão curta para o celular), perfil sensorial (intensidade, cremosidade, salinidade e aroma, de 1 a 5), história, harmonização (vinho, cerveja e acompanhamentos), como servir, como guardar e ficha técnica.

Exemplo de formatos de um queijo (o Canastra curado):

```ts
formatos: [
  { id: 'inteira', nome: 'Peça inteira', nomeCurto: 'Inteira', peso: '~1 kg', preco: 13600 },
  { id: 'meia', nome: 'Meia peça', nomeCurto: 'Meia', peso: '~500 g', preco: 7800 },
  { id: 'fracao', nome: 'Fração', peso: '~250 g', preco: 4900 },
],
```

Hoje só o Canastra curado tem a ficha completa. Os outros nove usam `[A DEFINIR]` nos textos do `detalhe`. Preços dos kits de presente, dias de validade depois de aberto (`[N]`), selo e número de registro (`[SELO E NÚMERO]`), data de validade (`[DATA]`), sugestões de vinho e cerveja e o número de unidades restantes (`[n]`) também seguem como lacuna até você informar.

## Como entregar um modelo 3D

O queijo em 3D aparece na página do produto. **Hoje nenhum queijo tem modelo 3D**: a loja mostra a ilustração (desenho SVG). Quando você entregar o primeiro arquivo, o 3D passa a funcionar sozinho nesse queijo.

### O que é um arquivo GLB

É o formato de modelo 3D usado na web. Quem faz o modelo (o designer 3D) exporta o arquivo como `.glb`. Cada queijo pode ter até **dois** arquivos:

- **inteiro**: a peça inteira (obrigatório, se houver 3D);
- **cortado**: a peça cortada, mostrando o interior (opcional).

### Passo a passo

1. **Dê o nome certo ao arquivo.** O padrão é `<slug>-inteiro.glb` ou `<slug>-cortado.glb`, onde `<slug>` é o nome do queijo no `data/cheeses.ts`. Exemplos: `canastra-curado-inteiro.glb` e `canastra-curado-cortado.glb`. Só letras minúsculas, números e hífen. Qualquer outro nome é recusado.
2. **Coloque o arquivo na pasta `public/models/`.** Direto nela, sem subpastas.
3. **Registre o queijo no arquivo `data/modelos3d.ts`.** Hoje a lista está vazia (`{}`). Para o Canastra, com os dois arquivos, ela fica assim:

   ```ts
   export const MODELOS_3D = {
     'canastra-curado': { inteiro: true, cortado: true },
   };
   ```

   Se houver só o arquivo inteiro, use `cortado: false`. Uma entrada só vale se os arquivos existirem.

4. **Rode a conferência.** No terminal, na pasta do projeto: `npm run modelos:validar`. Ela confere tudo o que está descrito abaixo. O mesmo teste roda automaticamente quando o código é enviado ao GitHub, e o envio é barrado se algo estiver errado.

### Regras dos arquivos

| Regra                    | Detalhe                                                                                                                                                                          |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tamanho                  | No máximo **3 MiB** (3.145.728 bytes) por arquivo. Acima disso, é erro                                                                                                           |
| Texturas (imagens do GLB) | No máximo **2048 px** no lado maior. Acima disso, é erro                                                                                                                         |
| Tudo dentro do arquivo   | Texturas e dados precisam estar embutidos no `.glb`. Arquivos externos são recusados                                                                                             |
| Compressão Draco ou KTX2 | Permitidas, mas exigem os decodificadores em `public/decodificadores/` (pastas `draco/` e `basis/`). Sem eles, o navegador buscaria no servidor do Google. Por isso é recusado   |
| Compressão Meshopt       | **Não aceita.**                                                                                                                                                                  |
| Outras extensões         | Só uma lista curta e testada. Qualquer outra é recusada                                                                                                                          |

Uma textura sem compressão KTX2 gera só um **aviso** (usa mais memória no celular), não um erro.

### Como ler as mensagens do `npm run modelos:validar`

- `modelos:validar: manifesto vazio e nenhum GLB em public/models/. Nada a validar.` Tudo certo, só não há modelos.
- `modelos:validar: 1 queijo(s) com modelo, tudo em ordem.` Tudo certo.
- Linhas começando com **`erro:`** impedem a entrega. Leia o nome do arquivo no começo da linha. Exemplos:
  - `nome fora da convenção <slug>-(inteiro|cortado).glb`: renomeie o arquivo;
  - `arquivo sem entrada "..." em data/modelos3d.ts`: falta registrar o queijo no passo 3;
  - `listado no manifesto, mas o arquivo não existe`: o queijo está registrado, mas o arquivo não está na pasta;
  - `acima do limite`: o arquivo passou de 3 MiB; peça ao designer um modelo mais leve;
  - `acima de 2048 px`: peça texturas menores;
  - `usa KHR_draco_mesh_compression, mas falta em public/decodificadores/`: o modelo usa compressão e faltam os decodificadores locais;
  - `GLB inválido`: o arquivo está corrompido ou não é um GLB 2.0.
- Linhas começando com **`aviso:`** não impedem a entrega, mas vale ler.

### O que o visitante vê

| Situação                                    | O que aparece                                                                                                              |
| ------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Queijo **sem** GLB (hoje, todos)            | A ilustração, com o corte funcionando entre peça inteira e por dentro. Nenhum arquivo 3D é baixado                         |
| Queijo **com** GLB                          | A ilustração aparece primeiro. Depois, com a página já pronta, o modelo é carregado e a substitui. Enquanto carrega, aparece **Preparando a peça…** |
| Queijo com GLB, mas navegador **sem WebGL** | A ilustração e a mensagem **Seu navegador não exibe o 3D. Veja as fotos abaixo.**                                          |
| O arquivo falha ao carregar (ou passa de 20 segundos) | O visitante continua vendo a ilustração, sem mensagem                                                            |

Detalhes úteis:

- **No Canastra, a página abre já no corte** ("Por dentro"). Se só existir o arquivo **inteiro**, o visitante vê a ilustração do corte primeiro e o 3D só aparece quando ele alterna o botão **Ver por dentro** para a peça inteira. Se existirem os dois arquivos, o corte também aparece em 3D.
- Quem ativa a **economia de dados** no celular não baixa o 3D sozinho e continua vendo a ilustração.
- **"Ver na mesa" (realidade aumentada) fica escondido.** Só entra quando houver um GLB real aprovado (decisão D23). Pode exigir arquivos extras para iPhone.
- **Luz e ambiente (spec §11):** a luz quente de cerca de 3200 K e o ambiente (HDR) próprio da loja estão **previstos para o primeiro GLB real**. Hoje vale a luz neutra padrão da biblioteca.
- **Hero da Home e giro no cartão do catálogo** também só entram com o primeiro GLB. Para o hero, será preciso aprovar uma variante do desenho sem o queijo.

## Assistente, horário e WhatsApp

O painel de atendimento (botão flutuante) tem um assistente que **não é inteligência artificial**: ele segue um roteiro fixo e reconhece algumas palavras. Tudo o que ele diz está em poucos lugares, listados abaixo. Como são arquivos de código, **peça ajuda a quem mantém o projeto** para editar; use esta seção para saber o que escrever e onde.

### Textos que faltam (você escreve)

A especificação não traz estes textos, então eles aparecem na conversa como `[A DEFINIR: …]`, de propósito. **Não os apague nem peça para inventar**: escreva o texto e troque a lacuna inteira, com os colchetes. Eles ficam no objeto `TEXTOS_DO_ROTEIRO`, no arquivo `lib/roteiro.ts`.

| Nome no arquivo        | Quando aparece                                                                  |
| ---------------------- | ------------------------------------------------------------------------------- |
| `transicaoSugestao`    | Antes da primeira pergunta de **Sugira um queijo**                              |
| `tabua`                | Antes dos três queijos de **Montar uma tábua**                                  |
| `pedidoPedirNumero`    | Ao escolher **Onde está meu pedido?** (peça o número no formato AQ-123456)      |
| `pedidoNumeroInvalido` | Quando o número digitado não está no formato                                    |
| `pedidoEncaminhar`     | Com o número certo: ainda não há consulta real, então encaminha ao WhatsApp     |
| `harmonizar`           | Antes da pergunta "Vai acompanhar com…"                                         |
| `outrasOpcoes`         | Ao escolher **Ver outras opções** (Manchego e Parmigiano Reggiano)              |
| `presenteFormato`      | Pergunta do tamanho antes de pôr o presente na sacola                           |
| `depoisDaAcao`         | Depois que o assistente põe o queijo na sacola                                  |
| `continuar`            | Depois de cada sugestão, antes de voltar às três opções iniciais                |
| `naoEntendi`           | Quando o assistente não reconhece a mensagem                                    |
| `saude`                | Perguntas de saúde (gravidez, alergia, leite cru…)                              |
| `avisoNovaAba`         | Aviso lido só por leitor de tela: o WhatsApp abre em nova aba (fica em `lib/whatsapp.ts`) |

Exemplo, antes e depois:

```ts
// antes
tabua: A_DEFINIR('texto antes dos cartões da tábua'),
// depois
tabua: 'Uma tábua começa pela casca bonita. Veja três queijos que fazem sucesso:',
```

Dois cuidados:

- O texto de **saúde** deve **só recomendar consultar um médico**, sem sugerir queijo. Peça a revisão de um profissional antes de publicar.
- **Não prometa prazo de entrega** em nenhum texto. Perguntas sobre entrega vão para um queijista.

Os textos que **já estão aprovados** (saudação, "Vou chamar um queijista da nossa equipe…", a sugestão do Canastra para presente e as perguntas do quiz) vêm da especificação. Não mude sem aprovação do dono do projeto.

### Horário de atendimento

O horário fica em `lib/whatsapp.ts`:

- `HORARIO_DO_ATENDIMENTO` é uma lista de sete dias, do domingo (primeira posição) ao sábado. Cada dia é `null` (fechado) ou `{ abre, fecha }`, em **minutos desde a meia-noite**: 9h vale `540`, 15h vale `900`, 18h vale `1080`. A hora de fechar já é "fechado" (18h00 é fechado; 17h59 é aberto).
- `TEXTO_DO_HORARIO` é a linha mostrada quando a cave está aberta ("Seg a sex, 9h às 18h · sáb, 9h às 15h").
- `TEXTO_DA_CAVE_FECHADA` é a mensagem mostrada quando está fechada. O botão verde do WhatsApp continua aparecendo.

Se mudar o horário, **mude os dois textos junto** com a lista, e peça aprovação do dono do projeto, pois eles vêm da especificação. A hora é sempre a de **São Paulo**, qualquer que seja o fuso de quem visita.

**Feriados não contam** (decisão do dono, P50): vale só o dia da semana. Se um dia quiser fechar em feriados, é preciso uma lista de datas; peça a quem mantém o código.

### Palavras que o assistente reconhece

Quando alguém digita no campo, o assistente procura palavras-chave, **sem se importar com acento ou maiúsculas**. A primeira intenção que casar vence, nesta ordem:

1. **Saúde** (gravidez, alergia, lactose, diabetes, doença, bebê, glúten…): responde com o texto `saude`, sem recomendar queijo. A lista é ampla de propósito.
2. **Falar com uma pessoa** (atendente, queijista, reclamação, problema, entrega, prazo, frete, troca, devolução, empresa, corporativo…): passa para o WhatsApp.
3. **Pedido** ("meu pedido", status, rastreio, "onde está", ou um número como AQ-123456).
4. **Presente com vinho tinto**: a conversa do protótipo.
5. **Tábua** (tábua, frios, petisco).
6. **Combinação** (harmonizar, vinho, cerveja, espumante…).
7. **Sugestão** (sugerir, recomendar, indicar, queijo, presente).
8. Qualquer outra coisa: "não entendi", com as três opções iniciais.

As listas estão em `lib/roteiro.ts` (`PALAVRAS_DE_SAUDE`, `PALAVRAS_DE_HUMANO`, `PALAVRAS_DE_PEDIDO`, `PALAVRAS_DE_TABUA` e vizinhas). Para acrescentar uma palavra, peça a quem mantém o código: a lista usa um formato próprio e uma palavra a mais pode mudar a prioridade.

### Número do WhatsApp

O número aparece nos botões verdes e em **Fale com um queijista**. Hoje é **fictício** (`data/ficticio.ts`). O número real se configura pela variável de ambiente descrita em [`docs/ambiente.md`](ambiente.md). Sem número em produção, os botões e a linha **Dúvidas sobre este queijo? Fale com um queijista** não aparecem.

O que vai na mensagem do WhatsApp é sempre um texto fixo da especificação (geral, de um queijo, de um pedido ou de empresa). **O que a pessoa digitou no chat nunca vai para o link.**

## Páginas de conteúdo: kits, artigos e produtores

Presentes, Aprenda e Nossos produtores leem os textos de três arquivos da pasta `data/`. Como nos queijos, mexer neles é mexer em código: **peça ajuda a quem mantém o projeto** para salvar a alteração. Esta seção diz o que reunir antes de pedir. O que ainda não tem texto aparece na loja entre colchetes (`[PREÇO]`, `[TEXTO DO ARTIGO]`...) de propósito. **Não apague nem invente**: troque pelo texto real.

### Onde ficam os textos de cada página

| Página | Onde mudar |
| --- | --- |
| Presentes: título, parágrafo, "Em todo kit", bloco para empresas | `app/presentes/page.tsx` e `app/presentes/_presentes/` (textos da especificação; só mude com aprovação) |
| Presentes: nome, descrição e preço de cada kit | `data/kits.ts` |
| Aprenda: título e parágrafo | `app/aprenda/page.tsx` |
| Aprenda: título, categoria, foto, texto e queijos de cada artigo | `data/artigos.ts` |
| Nossos produtores: título e texto de abertura | `app/produtores/page.tsx` |
| Nossos produtores: nome, região, ano, foto e queijos de cada produtor | `data/produtores.ts` (nome e ano do produtor de exemplo ficam em `data/ficticio.ts`) |
| Página não encontrada (404) | `app/not-found.tsx` |

### Kits de presente (`data/kits.ts`)

Os mesmos três kits aparecem na Home e em `/presentes`. Campos:

| Campo | O que é | Exemplo |
| --- | --- | --- |
| `id` | Nome técnico, sem acento e com hífen | `primeira-degustacao` |
| `nome` | Nome do kit | `Primeira Degustação` |
| `descricao` | Frase curta do que vem no kit | `3 queijos suaves, mel de flores e guia de degustação.` |
| `preco` | Preço em **centavos**, sem vírgula. `null` mostra `R$ [PREÇO]` | `null` (hoje) ou `18900` para R$ 189,00 |

Para informar o preço de um kit, troque `preco: null` por um número em centavos (R$ 189,00 vira `18900`). **Nunca use `0`.** Os kits não têm botão de compra nem página própria: o cartão só mostra nome, descrição e preço. Para pedidos de empresa, o botão **Pedir orçamento** abre o WhatsApp com uma mensagem pronta (precisa do número configurado, ver [Número do WhatsApp](#número-do-whatsapp)). A quantidade mínima do bloco para empresas (`[n]`) está em `app/presentes/_presentes/BlocoCorporativo.tsx`.

Não há filtros em Presentes: com três kits eles não ajudariam (decisão P54).

### Artigos da Escola do Ateliê (`data/artigos.ts`)

Cada artigo é um bloco com:

| Campo | O que é | Exemplo |
| --- | --- | --- |
| `slug` | Final do endereço (`/aprenda/<slug>`). Sem acento, com hífen | `queijo-e-vinho` |
| `titulo` | Título do artigo | `Queijo e vinho: um guia sem regras chatas` |
| `categoria` | Uma de: `primeiros-passos`, `harmonizacao`, `servir-e-guardar`, `regioes-e-produtores` | `harmonizacao` |
| `foto` | Descrição da foto que ainda vai existir | `queijo e taça de vinho` |
| `corpo` | O texto: uma lista de parágrafos, **ao menos um**. `null` mostra `[TEXTO DO ARTIGO]` | veja abaixo |
| `queijosCitados` | Queijos que o artigo cita, pelo `slug` do queijo, **ao menos um**. `null` mostra `[A DEFINIR: queijos citados]` | veja abaixo |

Exemplo preenchido:

```ts
{
  slug: 'queijo-e-vinho',
  titulo: 'Queijo e vinho: um guia sem regras chatas',
  categoria: 'harmonizacao',
  foto: 'queijo e taça de vinho',
  corpo: [
    'Primeiro parágrafo do artigo.',
    'Segundo parágrafo do artigo.',
  ],
  queijosCitados: ['canastra-curado', 'manchego', 'brie-frances'],
},
```

Regras:

- Cada texto entre aspas é **um parágrafo**. Separe os parágrafos por vírgula. Uma lista vazia (`[]`) não é aceita: use `null` enquanto não houver texto.
- Os `slug` dos queijos são os da lista em [Rotas do README](../README.md#rotas) (por exemplo `canastra-curado`). Um slug que não existe é recusado na verificação do código.
- O primeiro parágrafo do `corpo` também vira a descrição do artigo nos resultados de busca. Escreva-o como um resumo de até 160 caracteres.
- A categoria **Regiões e produtores** não tem artigo ainda e mostra `[A DEFINIR: artigos]`.
- Para **criar um artigo novo** (além dos três da especificação), peça ajuda a quem mantém o código: o `slug` precisa ser registrado também no tipo `SlugDoArtigo`. O artigo novo aparece na Escola da Home e em `/aprenda`.
- As fotos ainda são espaços reservados com a descrição `[FOTO: …]`.

### Produtores (`data/produtores.ts`)

| Campo | O que é | Exemplo |
| --- | --- | --- |
| `id` | Nome técnico, sem acento | `canastra` |
| `nome` | Nome do produtor. Deve ser **igual** ao campo `produtor` do queijo dele em `data/cheeses.ts` | `Queijaria Produtor Exemplo` |
| `regiao` | Região, como aparece | `Serra da Canastra, MG` |
| `desde` | Só o ano; a loja escreve "desde" antes. Use `[ano]` se não souber | `1985` |
| `foto` | Descrição da foto | `produtor na câmara de maturação, Serra da Canastra` |
| `queijos` | Queijos dele (`slug`), **ao menos um**. Cada um vira um link `Nome do queijo →` | `['canastra-curado']` |

Hoje só há um produtor, e o **nome e o ano são fictícios** (ficam em `data/ficticio.ts`, junto dos demais dados de teste). Troque antes de a loja ir ao ar. Cada produtor novo é mais um bloco na lista. Não existe página individual de produtor: o link leva ao queijo.

## O que ainda não está neste guia

Entram quando as etapas correspondentes forem concluídas, sem prometer data:

- trocar fotos, preços e o valor do frete grátis e o desconto do Pix;
- onde ficam os textos das demais páginas (Home, catálogo, produto, sacola e checkout);
- cadastro de queijos por uma plataforma, se um dia houver.

As variáveis de configuração estão em [`docs/ambiente.md`](ambiente.md).
