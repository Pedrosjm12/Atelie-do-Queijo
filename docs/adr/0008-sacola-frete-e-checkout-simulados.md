# ADR-0008 — Sacola persistida, frete e checkout simulados: fronteiras e persistência

- **Status:** Aceito
- **Data:** 2026-10-27
- **Contexto da etapa:** 4 (ver `docs/PLANO.md`). Complementa o ADR-0003 sem mudar a decisão dele.

## Contexto

O ADR-0003 decidiu usar um contexto React com `useReducer`, persistido em `localStorage` com chave versionada, preços sempre derivados do catálogo e leitura depois da montagem. A etapa 4 precisa fechar o que ele deixou em aberto:

1. O formato exato do dado salvo e o que fazer com dados inválidos, antigos ou adulterados.
2. Como validar `slug`/`formatoId` no provider global sem levar `data/cheeses` para o pacote de todas as páginas, um problema já resolvido no painel de atendimento com `lib/cartaoDoChat.ts`.
3. Onde rodam `calcularFrete` e `criarPedido` (spec §2): no navegador ou no servidor.
4. Como organizar as rotas `/sacola` e `/checkout` (spec §2 e §10.2) e a confirmação (mapa do site da §1: "Sacola → Checkout → Confirmação").
5. O que acontece com os dados pessoais digitados no checkout.

Ambiente: Next.js 16.4.3 e React 19.3.0. Na documentação instalada (`guides/server-actions.md`), Server Actions são POSTs públicos, com verificação de CSRF por `Origin`, limite de 1 MB no corpo e envio sequencial no cliente. A documentação diz que é preciso tratar cada um como entrada não confiável e validar dentro dele.

## Decisão

### 1. Dado salvo e tolerância a falhas

- Chave `atelie:sacola:v1`. Valor: `{"v":1,"itens":[{"slug":"…","formatoId":"…","quantidade":1}],"presente":false}`. **Nada além disso:** sem preço, nome, total ou dado pessoal.
- A leitura (`lerSacolaSalva(bruto: string | null): Sacola`) **nunca lança exceção**. Na ordem:
  1. `null`, texto com mais de 8 KB ou `JSON.parse` que falha → sacola vazia.
  2. Esquema (`zod/mini`, ADR-0007) com `v` literal `1`. Outra versão → sacola vazia. Quando houver a v2, o `v` antigo passa por uma função de migração antes do esquema.
  3. Cada item que não passa no esquema é descartado sozinho, sem esvaziar a sacola inteira.
  4. Item cujo `slug`/`formatoId` não existe no índice do catálogo → descartado.
  5. Quantidade: inteiro de 1 a `QUANTIDADE_MAXIMA_POR_ITEM` (fora disso, limitada ao intervalo). Linhas repetidas (mesmo `slug` + `formatoId`) são somadas e limitadas. No máximo `MAXIMO_DE_LINHAS` linhas.
  6. Se algo foi descartado ou corrigido, a versão limpa é regravada.
- **Gravação:** só depois da primeira leitura (`pronta === true`), para que a renderização inicial vazia nunca apague a sacola salva. `setItem` fica em `try/catch`: se o armazenamento estiver cheio, desligado ou em modo privado, a sacola continua só em memória, sem mensagem de erro e sem quebrar a página.
- **Outras abas:** o evento `storage` com a mesma chave relê o valor e o sanitiza. `newValue === null` significa sacola vazia. Se duas abas gravarem ao mesmo tempo, vale a última gravação (aceitável).
- **Hidratação:** o servidor e a primeira renderização do cliente usam a sacola vazia com `pronta: false`. O contador mostra 0, e a página `/sacola` não mostra a mensagem de sacola vazia enquanto `pronta` for `false`.

### 2. Índice do catálogo para o provider

- `lib/formatosDaSacola.ts` exporta um mapa estático `slug → formatoIds` (e a lista de esgotados), escrito à mão. Ele **não importa** `data/cheeses`.
- Um teste de paridade compara o índice com `QUEIJOS` (mesmo padrão de `lib/cartaoDoChat.ts`). Se alguém mudar o catálogo sem atualizar o índice, o teste falha.
- Nomes e preços só chegam ao cliente nas rotas que precisam deles (`/sacola`, `/checkout`), como *props* serializadas de um Server Component (`resumoParaSacola()` em `lib/catalogo.ts`), e não como JavaScript global.

### 3. Frete e pedido atrás de Server Actions

- `lib/commerce.ts` guarda as regras **puras**, importáveis no cliente (totais, frete grátis, CEP, `precoNoPix`). As implementações **simuladas** que um dia falarão com a rede (`calcularFrete`, `criarPedido`) ficam em `lib/pedido.server.ts`, com `import 'server-only'` (o pacote npm é opcional no Next; nenhuma dependência nova). As funções de rede são `async` desde já, para que a troca pela integração real não mude quem as chama.
- O número do pedido (`AQ-` + 6 dígitos) é só rótulo de exibição e **não é único por si**: são apenas 1 milhão de números. Quando houver persistência, a unicidade tem de ser garantida **no banco** (índice único, com nova tentativa em caso de colisão) ou o número passa a ter 8 dígitos.
- Os componentes **não** chamam `lib/pedido.server.ts` (frete e pedido). Eles chamam dois Server Actions finos, em `app/_acoes/frete.ts` (`consultarFrete`) e `app/_acoes/pedido.ts` (`confirmarPedido`), com `'use server'`. Cada um:
  - valida a entrada com os esquemas compartilhados (ADR-0007);
  - **recalcula tudo no servidor** a partir de `data/cheeses` (preços, esgotados, frete grátis, desconto do Pix e o próprio frete pelo CEP), sem aceitar preço nem total vindo do cliente;
  - devolve só o que a interface mostra: uniões discriminadas `{ ok: true, … } | { ok: false, motivo }`, sem pilha de erro nem detalhe interno;
  - `consultarFrete` usa a chave `erro` (`'cep-invalido' | 'indisponivel'`; falha interna vira `indisponivel`) e `confirmarPedido` usa `motivo`; o corpo de qualquer Server Action é limitado a 32 KB (`experimental.serverActions.bodySizeLimit`);
  - não registra em log nem guarda dado pessoal.
- Funções puras e baratas, como `precoNoPix`, `faltaParaFreteGratis` e `mascararCep`, continuam importáveis no cliente.
- Quando houver gateway real, a implementação de rede sai para um módulo exclusivo do servidor, com segredos em variável de ambiente e ADR próprio. Os Server Actions e os componentes não mudam.

### 4. Rotas

- `/sacola` e `/checkout`, como na §2. Cada uma é um Server Component estático (metadados e `robots: { index: false }`) que renderiza uma ilha client (`ConteudoDaSacola`, `FluxoDoCheckout`) com o resumo do catálogo.
- As três etapas do checkout (§10.2: Entrega · Pagamento · Confirmação) vivem **na mesma rota**, com o estado no cliente. Não há `/checkout/confirmacao` nem `/pedido/[numero]`. Sem banco, uma rota de confirmação não teria o que mostrar ao ser recarregada.
- Depois de `confirmarPedido` responder `ok: true`, o cliente esvazia a sacola e mostra a etapa 3. Se a página for recarregada, a confirmação some, e isso é aceitável numa simulação.

### 5. Dados pessoais

- Os dados do cliente, o endereço e a mensagem do presente ficam **só no estado do React** do `FluxoDoCheckout`. Não vão para `localStorage`, `sessionStorage`, cookie, log nem servidor, que só os valida e os esquece.
- O checkout simulado **não coleta** número de cartão, CVV, validade nem CPF.

## Alternativas consideradas

- **Chamar `calcularFrete` direto no cliente:** é mais simples hoje, mas a integração real (transportadora ou gateway) precisa de servidor e segredo. Trocar depois mudaria a fronteira de todos os componentes. Rejeitada.
- **Route Handlers (`app/api/...`) em vez de Server Actions:** fazem sentido para webhooks e clientes externos, que ainda não existem. Para mutações da própria interface, o Server Action é o padrão do projeto (princípio *server-first*). Rejeitada por ora; os webhooks do gateway real usarão Route Handlers.
- **Importar `data/cheeses` no provider para validar:** é o caminho mais direto, mas leva os 10 queijos (textos do Canastra inclusive) para o pacote de todas as páginas. Rejeitada.
- **`useSyncExternalStore` com o `localStorage` como fonte:** evita o efeito de leitura, mas exige um *snapshot* estável e um cache próprio, além de se afastar do `useReducer` do ADR-0003. Rejeitada por simplicidade. Fica como opção se aparecer cintilação perceptível.
- **Etapas do checkout em rotas separadas:** dariam URLs por etapa e botão Voltar nativo, mas exigiriam guardar os dados pessoais entre rotas (em armazenamento) ou num contexto a mais. Rejeitada.
- **Guardar o formulário do checkout em `sessionStorage`:** seria mais cômodo ao recarregar, mas deixaria dado pessoal no navegador. Rejeitada; o dono pode reabrir (pendência P37 do plano).

## Consequências

- Server Actions exigem servidor Node em produção, o que `/queijos` (dinâmica) já exigia. A hospedagem continua uma pendência do dono.
- Depois de uma nova publicação, um cliente com a página antiga aberta pode receber "Failed to find Server Action". A interface mostra a mensagem de erro genérica e permite tentar de novo (documentação do Next, *Deployment considerations*).
- Um teste de paridade a mais (índice × catálogo).
- O `auditor-de-seguranca` revisa a sanitização do `localStorage`, os dois Server Actions e o tratamento dos dados pessoais antes dos commits do frete e do checkout.
- Nenhuma dependência nova além do Zod (ADR-0007).

## Atualização ao fim da etapa 4 (tarefa 17)

Registra o que a implementação acrescentou, sem mudar nenhuma decisão acima.

- **`lerSacolaSalva`** devolve `{ sacola, corrigida }` (a flag `corrigida` indica que é preciso regravar) e usa um *type guard* à mão no lugar do Zod, por causa do orçamento de pacote do [ADR-0007](0007-validacao-com-zod-mini.md). O Zod ficou só em `lib/pedido.ts` (rota `/checkout` e `confirmarPedido`).
- **`confirmarPedido`** ganhou o motivo `'indisponivel'` (falha interna, sem repetir a mensagem do erro), além de `'dados-invalidos'`, `'pagamento-recusado'`, `'fora-de-area'` e `'sacola-invalida'`. A interface mostra o mesmo texto de erro aprovado para os motivos de pagamento e só `dados-invalidos` e `fora-de-area` voltam à etapa 1.
- **`serverActions.bodySizeLimit: '32kb'`** (em `experimental` no `next.config.ts`) foi antecipado para a tarefa 9 (frete) e vale para todas as Server Actions; há e2e que recusa um corpo de ~40 KB.
- **`SacolaVazia`** mora em `components/`, porque `/sacola` e `/checkout` compartilham o estado vazio. O `QuantityStepper` também foi movido para `components/`.
- **Máscara de CEP:** a regra de texto fica em `mascararCep` (`lib/commerce.ts`) e os auxiliares de cursor em `lib/mascara.ts`. Os textos e a lógica de tela do frete, comuns ao produto e ao checkout, ficam em `lib/freteNaTela.ts`. Nenhum dos dois usa Zod nem servidor.
- **Gatilho de teste do pagamento recusado:** `recusa@exemplo.com`, só na implementação simulada de `criarPedido` (`lib/pedido.server.ts`), marcado com `// SIMULAÇÃO: remover com o gateway`. Deve ser removido quando o gateway real entrar.
