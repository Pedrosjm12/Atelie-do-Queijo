# Aviso de privacidade do Ateliê do Queijo (RASCUNHO)

> **RASCUNHO. NÃO PUBLICADO. VALIDAR COM PROFISSIONAL DE DIREITO ANTES DE QUALQUER USO.**
>
> **Este arquivo não é o aviso de privacidade vigente do site.** Nenhum aviso está em vigor.
>
> - Este texto foi redigido pelo agente a partir do [inventário LGPD da etapa 8](PLANO.md#inventário-lgpd-para-o-rascunho-do-aviso-d33-etapa-9) e de uma conferência do código em 2026-11-26 (D33, tarefa 17 do bloco E da etapa 9).
> - Não é parecer jurídico. As bases legais aparecem como **sugestão** para a pessoa que fizer a validação.
> - **Nenhuma página, rota ou link do site aponta para este arquivo.** A publicação (página própria e link antes de **Confirmar pedido**, com texto novo aprovado pelo dono) fica para o item R6, depois da validação.
> - Lacunas entre colchetes continuam visíveis até o dono preenchê-las.
> - Este rascunho descreve o site **como ele está hoje**: loja simulada, sem gateway de pagamento, sem transportadora, sem provedor de newsletter e sem banco de dados. Quando qualquer um desses entrar, o aviso precisa ser revisto (ver [Quando revisar](#quando-revisar-este-aviso)).

---

## 1. Quem é o controlador

O controlador dos dados pessoais tratados neste site é:

- Razão social: **[RAZÃO SOCIAL]**
- CNPJ: **[CNPJ]**
- Endereço: **[ENDEREÇO DA EMPRESA]**
- Encarregado pelo tratamento de dados pessoais (art. 41 da LGPD): **[NOME DO ENCARREGADO OU INDICAÇÃO DE DISPENSA]**
- Contato do encarregado: **[E-MAIL OU CANAL DO ENCARREGADO]**

> Nota para o dono: a Resolução CD/ANPD nº 2/2022 prevê regras próprias para agentes de pequeno porte, inclusive sobre a indicação do encarregado. Se a dispensa for aplicável, o canal de comunicação com o titular continua obrigatório. Confirmar com o profissional de direito.

## 2. Que dados tratamos, para quê e onde eles ficam

### 2.1 Newsletter ("Receba primeiro os lotes raros.")

| Item | Situação atual (conferida no código) |
| --- | --- |
| Dado pedido | E-mail. |
| Finalidade pretendida | Avisar sobre lotes raros e novidades. |
| O que acontece hoje | **Nada é gravado nem enviado.** O formulário só confere o formato no navegador e troca o campo pela mensagem de sucesso (`app/_home/Newsletter.tsx`, decisões P9 e D25). |
| Sai do navegador? | Não, depois que a página carrega. O formulário usa `method="post"`: se a pessoa enviar antes de o JavaScript carregar, o e-mail vai no corpo de uma requisição ao próprio site e não fica na URL. Não é lido nem guardado pelo servidor. |
| Armazenamento, log ou URL | Nenhum. |

> **Atenção, bloqueia a publicação:** a mensagem de sucesso atual da newsletter promete algo que não ocorre ("Você vai receber os próximos lotes raros"), porque nada é gravado nem enviado. Ligar a newsletter de verdade ou retirá-la antes de publicar, sem exceção.

> **Antes de ligar a newsletter de verdade:** escolher o provedor (que vira operador), definir a base legal (sugestão: **consentimento**, art. 7º, I, com caixa de opção desmarcada e registro de data, hora e texto aceito), oferecer descadastro em cada e-mail e reescrever esta seção.

### 2.2 Calculadora de frete (página do produto e checkout)

| Item | Situação atual |
| --- | --- |
| Dado pedido | CEP. |
| Finalidade | Informar prazo e valor do frete. |
| O que acontece hoje | O CEP vai ao servidor do site (Server Action `consultarFrete`, em `app/_acoes/frete.ts`), que consulta uma **tabela simulada** (`lib/pedido.server.ts`) e devolve só o resultado. Nenhuma transportadora é consultada. |
| Armazenamento, log ou URL | Nenhum. A resposta não repete o CEP, não há `console.*` no servidor e o formulário usa `method="post"`. |

> O CEP sozinho, em geral, identifica uma região e não uma pessoa, mas junto com outros dados pode tornar alguém identificável. Por isso aparece aqui.

### 2.3 Checkout (etapas 1. Entrega, 2. Pagamento e 3. Confirmação)

| Item | Situação atual |
| --- | --- |
| Dados pedidos (P32) | Nome completo, e-mail, telefone, CEP, rua ou avenida, número, complemento (opcional), bairro, cidade e estado. Se o pedido for presente: mensagem do cartão (até 200 caracteres) e data de entrega. Forma de pagamento: Pix ou cartão, **sem nenhum dado de cartão** (só a escolha, P33). |
| Dados que **não** pedimos | CPF, data de nascimento, número de cartão, gênero ou qualquer dado sensível (art. 5º, II). O CPF só entra se o gateway real exigir (P32). |
| Finalidades | Entregar o pedido (nome, endereço, CEP); enviar a confirmação e falar sobre o pedido (e-mail); contato sobre a entrega (telefone, ver [seção 4](#4-telefone-decisão-pendente-do-dono)); montar o presente (mensagem e data); calcular o total com ou sem o desconto do Pix (forma de pagamento). |
| O que acontece hoje | Os dados ficam **só na memória da página** (estado do React, P37): recarregar a página apaga tudo. Ao confirmar, vão ao servidor do site (Server Action `confirmarPedido`, em `app/_acoes/pedido.ts`), que valida com Zod, recalcula preço e frete, gera um número de pedido de exibição e descarta os dados. **Nenhum pedido é gravado, nenhum e-mail é enviado e nada é cobrado.** |
| Resposta do servidor | Só o número do pedido, o e-mail (que a tela de confirmação mostra) e os totais. |
| Armazenamento, log ou URL | Nenhum. Testes automatizados conferem que nenhum dado pessoal vai para a URL, `localStorage`, `sessionStorage` ou cookies (`e2e/checkout.spec.ts`). |

> **Quando o pedido for real**, entram novos tratamentos que este rascunho ainda não cobre: gravação do pedido em banco de dados, envio de e-mail transacional, gateway de pagamento (Mercado Pago, D32, que passa a ser operador e pode exigir CPF), transportadora e emissão de nota fiscal.

### 2.4 Assistente do Ateliê (painel de atendimento)

| Item | Situação atual |
| --- | --- |
| Dado pedido | Nenhum. A pessoa pode digitar texto livre e, por conta própria, escrever algum dado pessoal. |
| Finalidade | Ajudar a escolher queijos e tirar dúvidas. |
| O que acontece hoje | O assistente funciona por roteiro **dentro do próprio navegador** (motor determinístico, ADR-0010). **Nenhuma inteligência artificial externa é usada.** Do que a pessoa digita no assistente, só um número de pedido no formato `AQ-000000`, quando reconhecido (`lib/roteiro.ts`, `lerNumeroDoPedido` em `lib/whatsapp.ts`), entra na mensagem pronta do WhatsApp (seção 2.5); o resto do texto não sai do navegador. A conversa some ao fechar ou recarregar a página. |
| Armazenamento, log ou URL | Nenhum. |

> Se no futuro o assistente passar a usar um serviço de IA, esse serviço vira operador (e talvez haja transferência internacional), e o aviso precisa dizer isso antes da primeira mensagem.

### 2.5 Botões de WhatsApp

| Item | Situação atual |
| --- | --- |
| O que acontece | O botão abre o WhatsApp (`wa.me`) em nova aba com uma **mensagem pronta** conforme o motivo (dúvida geral, dúvida sobre um queijo, pedido com o número de exibição `AQ-…`, orçamento para empresa). Do que se digita no assistente, só um número de pedido `AQ-000000`, quando reconhecido, entra nessa mensagem; o resto não sai do navegador. |
| Quem trata os dados a partir daí | Ao clicar, a pessoa sai do site e passa a usar o WhatsApp, serviço da **WhatsApp LLC / Meta**, sob os termos e a política de privacidade da própria Meta. **Já ao clicar, e mesmo que a pessoa não envie mensagem, a Meta recebe a URL com o texto pronto (nome do queijo ou número do pedido), o IP, o navegador e a origem do site** (`Referrer-Policy: strict-origin-when-cross-origin`). A conversa com o Ateliê no WhatsApp (número de telefone, nome de perfil e mensagens) é tratada pelo Ateliê para responder ao atendimento. |

### 2.6 Armazenamento no navegador (`localStorage` e `sessionStorage`)

| Chave | O que guarda | Para quê | Dado pessoal? |
| --- | --- | --- | --- |
| `atelie:sacola:v1` (`localStorage`) | Itens da sacola (identificador do queijo, formato e quantidade) e se a sacola é para presente (sim ou não) | Manter a sacola entre visitas e entre abas | Não |
| `atelie:bolha-atendimento-vista` (`sessionStorage`) | Só o valor `1` | Mostrar a bolha do atendimento uma vez por sessão | Não |

- Os dois são **estritamente necessários** para funções que a própria pessoa pediu (a sacola e o aviso do atendimento). Não identificam a pessoa, não são lidos por terceiros e não servem para análise ou publicidade.
- Para apagar: limpar os dados do site nas configurações do navegador. A sacola também se esvazia removendo os itens.

### 2.7 Cookies, análise de audiência e serviços de terceiros

- **No site publicado, não usa cookies**, nem próprios nem de terceiros (no Preview, a proteção da Vercel grava cookies próprios).
- **Não há** ferramenta de análise de audiência, pixel de publicidade, mapa de calor ou vídeo incorporado.
- As fontes são servidas pelo próprio site (baixadas no momento do build, sem chamada ao Google durante a visita).
- O site não carrega scripts, fontes ou imagens de terceiros e não envia dados a serviços externos; a única saída é quando você clica num link do WhatsApp. (O detalhe técnico, a política de segurança de conteúdo, está na conferência do código no fim do arquivo.)

> Se um dia entrarem cookies de análise ou de marketing, será preciso pedir consentimento antes de ativá-los (banner com opção de recusar tão fácil quanto aceitar) e atualizar esta seção.

### 2.8 Registros técnicos da hospedagem

- O site é hospedado na **Vercel Inc.** A cada acesso, a Vercel registra dados técnicos da requisição, como **endereço IP, navegador e sistema (user-agent), página acessada, data e hora**.
- Finalidade: funcionamento, segurança e diagnóstico do site.
- O código do Ateliê não acrescenta nada a esses registros (não há `console.*` no servidor) e nenhum dado pessoal vai para a URL.
- Prazo de guarda desses registros: o definido pela Vercel para o plano contratado, **[PRAZO DOS LOGS DA VERCEL NO PLANO CONTRATADO]**.

## 3. Base legal (sugestão para validação)

| Tratamento | Base legal sugerida | Observação |
| --- | --- | --- |
| Dados do checkout (nome, e-mail, endereço, CEP, forma de pagamento, mensagem e data do presente) | **Execução de contrato** ou procedimentos preliminares a pedido do titular (art. 7º, V) | É o necessário para vender e entregar. |
| Telefone | Art. 7º, V, **se** for necessário para a entrega; se não for, tornar opcional (ver seção 4) | Decisão do dono. |
| Guarda do pedido e dos dados para a nota fiscal, quando o pedido for real | **Cumprimento de obrigação legal ou regulatória** (art. 7º, II), pela legislação fiscal | O prazo vem da legislação fiscal e contábil (seção 5). |
| Defesa em eventual reclamação ou processo (ex.: Código de Defesa do Consumidor) | **Exercício regular de direitos** (art. 7º, VI) | Sugestão; confirmar. |
| CEP na calculadora de frete | Procedimentos preliminares a pedido do titular (art. 7º, V) | O CEP não é guardado. |
| Registros técnicos da hospedagem | **Legítimo interesse** (art. 7º, IX) na segurança e no funcionamento do site; avaliar também a obrigação do art. 15 do Marco Civil da Internet | Confirmar se o Ateliê se enquadra como provedor de aplicação obrigado ao art. 15 e se é preciso registro do teste de legítimo interesse. |
| `localStorage` e `sessionStorage` | Estritamente necessários; não envolvem dado pessoal | Sem consentimento, por não haver dado pessoal nem rastreamento. Confirmar. |
| Newsletter (quando existir) | **Consentimento** (art. 7º, I) | Hoje nada é coletado. |
| Conversa no WhatsApp | Art. 7º, V, quando for sobre compra ou pedido; legítimo interesse (art. 7º, IX) nos demais contatos | Sugestão; confirmar. |

## 4. Telefone: decisão pendente do dono

Hoje o telefone é **obrigatório** no checkout (`lib/pedido.ts`, DDD + 8 ou 9 dígitos). O princípio da necessidade (art. 6º, III) exige justificar cada dado. O dono precisa escolher:

- **A) Manter obrigatório**, com justificativa no aviso: **[JUSTIFICATIVA, por exemplo "a transportadora exige um telefone para contato na entrega" ou "precisamos avisar sobre a entrega de produto perecível"]**.
- **B) Tornar opcional** (rótulo "Telefone (opcional)"), dizendo para que ele serve quando informado. Exige mudança no esquema, na interface e nos testes, com texto novo aprovado pelo dono.

**Decisão do dono: [A OU B].**

## 5. Por quanto tempo guardamos

- **Hoje:** nada é guardado pelo Ateliê. Os dados do checkout são descartados assim que o servidor responde; o restante fica só no navegador da pessoa.
- **Quando o pedido for real:**
  - dados do pedido e da nota fiscal: **[PRAZO DE RETENÇÃO DOS PEDIDOS, a definir com o contador e o profissional de direito conforme a legislação fiscal]**;
  - dados de contato usados só no atendimento (e-mail, telefone, WhatsApp): **[PRAZO DE RETENÇÃO DO ATENDIMENTO]**;
  - e-mail da newsletter: até o descadastro, **[OU OUTRO PRAZO]**;
  - registros técnicos da hospedagem: **[PRAZO DOS LOGS DA VERCEL NO PLANO CONTRATADO]**.
- Ao fim do prazo, os dados são **[ELIMINADOS OU ANONIMIZADOS]**.

## 6. Com quem compartilhamos (operadores e terceiros)

| Quem | Papel | O que recebe | Quando |
| --- | --- | --- | --- |
| **Vercel Inc.** (hospedagem) | Operador | Tudo o que passa pelo servidor do site: os registros técnicos da seção 2.8 e, durante o processamento, o CEP e os dados do checkout (sem guardá-los por iniciativa do Ateliê) | Em todo acesso |
| **WhatsApp LLC / Meta** | Serviço que a própria pessoa escolhe usar ao clicar; o enquadramento (operador, controlador próprio ou ambos) deve ser confirmado | Ao clicar: a URL com o texto pronto (nome do queijo ou nº do pedido), IP, navegador e origem do site, mesmo sem enviar mensagem. Depois: número de telefone, nome de perfil e mensagens da conversa | Quando a pessoa clica num botão do WhatsApp |
| **[GATEWAY DE PAGAMENTO, Mercado Pago (D32)]** | Operador (ou controlador próprio, a confirmar) | **[DADOS ENVIADOS AO GATEWAY]** | Ainda não existe: fase 2 |
| **[TRANSPORTADORA]** | Operador | **[NOME, ENDEREÇO, CEP, TELEFONE?]** | Ainda não existe |
| **[PROVEDOR DE NEWSLETTER]** | Operador | E-mail | Ainda não existe |
| **[PROVEDOR DE E-MAIL TRANSACIONAL]** | Operador | Nome, e-mail, número do pedido | Ainda não existe |
| Autoridades públicas | Terceiros | O que a lei ou ordem judicial exigir | Quando houver obrigação legal |

**O Ateliê não vende dados pessoais.**

### Transferência internacional

A Vercel e a Meta são empresas sediadas nos Estados Unidos e podem tratar dados fora do Brasil. Região de processamento das funções do site na Vercel: **[REGIÃO CONFIGURADA NA VERCEL]**. O mecanismo do art. 33 da LGPD e da Resolução CD/ANPD nº 19/2024 (por exemplo, cláusulas-padrão contratuais) precisa ser confirmado nos termos de cada fornecedor.

## 7. Dados do presenteado: pendência do dono

- **Hoje:** o checkout tem **um endereço só**. Quando o pedido é presente, esse endereço e o nome digitado podem ser de quem compra **ou** de quem recebe, e a mensagem do cartão pode citar o nome do presenteado. Não há campos próprios para o presenteado.
- **Decisão pendente (tabela de pendências do `docs/PLANO.md`):** haverá nome e endereço próprios do presenteado? **[DECISÃO DO DONO]**
- Se houver, o aviso precisa dizer:
  - que quem compra informa dados de outra pessoa;
  - para quê (só a entrega e o cartão);
  - por quanto tempo esses dados ficam guardados;
  - que o presenteado também é titular e pode exercer os direitos da seção 8.
- Em qualquer caso, a nota fiscal vai **sem valor visível ao presenteado** (D9).

## 8. Seus direitos e como exercê-los

Pelo art. 18 da LGPD, você pode pedir ao Ateliê, a qualquer momento:

- confirmação de que tratamos seus dados e acesso a eles;
- correção de dados incompletos, inexatos ou desatualizados;
- anonimização, bloqueio ou eliminação de dados desnecessários ou tratados em desconformidade com a lei;
- portabilidade;
- eliminação dos dados tratados com base no consentimento;
- informação sobre com quem compartilhamos seus dados;
- informação sobre a possibilidade de não consentir e suas consequências;
- revogação do consentimento.

Você também pode apresentar reclamação à **Autoridade Nacional de Proteção de Dados (ANPD)**.

- **Canal para o titular:** **[E-MAIL OU FORMULÁRIO DO CANAL DO TITULAR]**
- **Prazo de resposta:** **[PRAZO DE RESPOSTA]** (o art. 19, II, prevê até 15 dias para a declaração completa)
- **Como confirmamos a identidade de quem pede:** **[PROCEDIMENTO, por exemplo resposta pelo mesmo e-mail usado no pedido]**

> Hoje, como nada é guardado, a resposta a um pedido de acesso é "não temos dados seus", exceto pelos registros técnicos da hospedagem e pelas conversas no WhatsApp.

## 9. Segurança

- Conexão sempre criptografada (HTTPS com `Strict-Transport-Security`).
- **Dados de cartão nunca passam pelo servidor do Ateliê.** Hoje não há campo de cartão; com o gateway real, os dados serão digitados no ambiente do próprio gateway (tokenização).
- Toda entrada que chega ao servidor é validada ali, e o preço é sempre recalculado no servidor.
- O site não registra dados pessoais em log e não os coloca na URL.
- **[MEDIDAS ADICIONAIS QUANDO HOUVER BANCO DE DADOS: controle de acesso, criptografia, cópias de segurança]**
- Em caso de incidente de segurança que possa causar risco ou dano relevante, o Ateliê comunicará a ANPD e os titulares afetados, nos termos da Resolução CD/ANPD nº 15/2024.

## 10. Crianças e adolescentes

O site é voltado a adultos. **[DECISÃO DO DONO: declarar que não coleta intencionalmente dados de menores de 18 anos? Há restrição de venda a menores para algum item, por exemplo kits com vinho?]**

## 11. Alterações deste aviso

- Última atualização: **[DATA DA PUBLICAÇÃO]**.
- Mudanças relevantes serão avisadas no site **[E, SE HOUVER CADASTRO, POR E-MAIL]**.

---

## Quando revisar este aviso

Revisar o aviso (e repetir a validação jurídica) **antes** de publicar qualquer uma destas mudanças:

1. pedidos gravados em banco de dados ou e-mail de confirmação enviado de verdade;
2. gateway de pagamento real (D32), inclusive se ele exigir CPF;
3. transportadora real consultada pela calculadora de frete;
4. newsletter ligada a um provedor;
5. assistente usando IA externa ou guardando conversas;
6. qualquer cookie, ferramenta de análise ou pixel;
7. campos próprios do presenteado;
8. telefone tornado opcional ou retirado.

## Conferência do código (base deste rascunho, 2026-11-26)

| Linha do inventário | Onde foi conferido | Resultado |
| --- | --- | --- |
| Newsletter | `app/_home/Newsletter.tsx` | E-mail validado só no navegador; nada gravado nem enviado (a mensagem de sucesso promete o contrário: bloqueia a publicação). O achado médio do e-mail na URL (`/?email=…`) **já foi corrigido**: o formulário tem `method="post"`. |
| Frete | `app/_acoes/frete.ts`, `lib/pedido.server.ts`, `app/queijos/[slug]/_produto/ShippingCalculator.tsx` | CEP limitado a 9 caracteres; tabela simulada; resposta sem a entrada; sem log; `method="post"`. |
| Checkout | `app/checkout/_checkout/dados.ts`, `lib/pedido.ts`, `app/_acoes/pedido.ts` | Campos exatamente os do P32 (sem CPF); telefone obrigatório; mensagem do presente até 200 caracteres e 6 linhas; data de amanhã a +60 dias; sem dado de cartão; dados descartados depois da resposta. |
| Assistente | `components/PainelDoAtendimento.tsx`, `lib/assistant.ts`, `lib/roteiro.ts` | Motor no navegador; nenhum `fetch`; o texto digitado não sai do navegador, exceto o número de pedido `AQ-000000` reconhecido, que vai na mensagem do WhatsApp. O único `console.error` é de cliente e só fora de produção. |
| WhatsApp | `lib/whatsapp.ts`, `lib/whatsapp.server.ts` | Mensagens fixas por motivo; do texto digitado, só o número de pedido `AQ-000000` reconhecido (`lerNumeroDoPedido`) entra no link; número do WhatsApp só no servidor (ADR-0013). |
| Armazenamento no navegador | `components/SacolaProvider.tsx`, `components/ReservaDaSacola.tsx`, `components/SupportFab.tsx` | Só `atelie:sacola:v1` (`localStorage`) e `atelie:bolha-atendimento-vista` (`sessionStorage`); nenhum cookie. |
| Terceiros | `lib/cabecalhos.ts`, `app/layout.tsx` | CSP com `connect-src 'self'` e `font-src 'self'` (impede a página de enviar dados a outros endereços); fontes de `next/font` servidas pelo site; nenhuma biblioteca de análise. |
| Hospedagem | `docs/ambiente.md` | Vercel; registros técnicos do provedor. |

---

## Perguntas para o profissional de direito

1. **Controlador e encarregado:** com o CNPJ definido, o Ateliê se enquadra como agente de pequeno porte (Resolução CD/ANPD nº 2/2022)? Pode dispensar o encarregado? Que canal mínimo é exigido mesmo assim?
2. **Base legal do checkout:** o art. 7º, V, cobre todos os campos (nome, e-mail, telefone, endereço, mensagem e data do presente)? Qual a base para guardar o pedido depois da entrega: art. 7º, II (obrigação fiscal), art. 7º, VI (defesa em processo, CDC) ou ambas?
3. **Telefone:** a justificativa proposta pelo dono basta para mantê-lo obrigatório pelo princípio da necessidade, ou é mais seguro torná-lo opcional?
4. **Retenção:** quais prazos se aplicam a pedidos, notas fiscais e dados de atendimento? Considerar a legislação fiscal e contábil (federal e estadual, ICMS), o prazo de prescrição do CDC (art. 27) e a guarda de registros de acesso do Marco Civil da Internet (art. 15), se aplicável.
5. **Registros da Vercel:** o Ateliê é provedor de aplicação obrigado a guardar registros de acesso (Marco Civil, art. 15)? Os registros da Vercel cumprem essa obrigação ou é preciso um registro próprio? Que base legal citar para eles?
6. **Transferência internacional:** a Vercel e a Meta tratam dados nos EUA. Os termos desses fornecedores atendem à Resolução CD/ANPD nº 19/2024 (cláusulas-padrão)? O que o aviso precisa dizer?
7. **WhatsApp:** ao clicar no botão, a Meta atua como operadora do Ateliê, como controladora independente ou como ambas? Como descrever isso no aviso? Que base legal usar para as conversas de atendimento?
8. **Presenteado:** quem compra pode informar nome e endereço de outra pessoa sem a ciência dela? Que base legal se aplica aos dados do presenteado e o que o aviso deve dizer a ele? Isso muda se houver campos próprios para o presenteado?
9. **Armazenamento no navegador:** o `localStorage` da sacola e o `sessionStorage` da bolha, sem dado pessoal, dispensam consentimento e banner de cookies? Basta descrevê-los no aviso (à luz do Guia Orientativo de Cookies da ANPD)?
10. **Newsletter:** quando for ligada, o consentimento precisa de caixa de opção própria ou basta o envio do formulário com texto claro? Como registrar e provar o consentimento?
11. **Menores de idade:** é preciso declarar algo sobre menores de 18 anos (art. 14)? Há restrição de venda para algum item (por exemplo, kits com vinho) que exija confirmação de idade?
12. **Forma de apresentação:** onde e como o aviso deve aparecer (link antes de **Confirmar pedido**, no rodapé, no formulário da newsletter)? É necessário aceite expresso no checkout ou basta a informação, já que a base sugerida não é o consentimento?
13. **Direitos do titular:** qual prazo de resposta adotar (art. 19) e como confirmar a identidade de quem pede sem coletar dados a mais?
14. **Incidentes:** o que o Ateliê precisa ter pronto (registro, prazo e modelo de comunicação) para cumprir a Resolução CD/ANPD nº 15/2024?
15. **Loja simulada:** enquanto nenhum pedido é gravado e nada é cobrado, o site pode ir ao ar com um aviso que descreva só o que acontece hoje, ou é melhor publicar já o aviso completo da operação real?
