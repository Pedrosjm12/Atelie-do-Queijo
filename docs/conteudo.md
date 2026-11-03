# Guia de conteúdo (para o dono da loja)

Este guia explica como cuidar do que aparece na loja, sem precisar programar. Ele cresce a cada etapa do projeto. Hoje cobre **queijos** e **modelos 3D**. O que ainda não está aqui está listado no fim, em [O que ainda não está neste guia](#o-que-ainda-não-está-neste-guia).

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

## O que ainda não está neste guia

Entram quando as etapas correspondentes forem concluídas, sem prometer data:

- trocar fotos, preços e o valor do frete grátis, o desconto do Pix e o horário de atendimento (o assistente e o horário vêm na etapa 6);
- onde ficam os textos de cada página (Presentes, Aprenda e Produtores vêm na etapa 7);
- cadastro de queijos por uma plataforma, se um dia houver.

As variáveis de configuração estão em [`docs/ambiente.md`](ambiente.md).
