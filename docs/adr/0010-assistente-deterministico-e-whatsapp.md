# ADR-0010 — Assistente com roteiro determinístico, horário e links do WhatsApp

- **Status:** Aceito
- **Data:** 2026-11-03
- **Contexto da etapa:** 6 (ver `docs/PLANO.md`)

## Contexto

A spec §8.2 pede, "nesta primeira versão", um assistente com respostas pré-definidas (árvore de opções) e um ponto de integração em `lib/assistant.ts` para a IA futura. A §8.3 define os links `https://wa.me/<numero>?text=<mensagem codificada>`, quatro mensagens pré-preenchidas e o horário do atendimento humano no fuso `America/Sao_Paulo`, com a mensagem de cave fechada. O dono decidiu (D24) roteiro determinístico agora e IA real depois, com ADR próprio.

Quatro pontos técnicos ainda não tinham decisão:

1. Que forma tem o motor do roteiro e como o painel conversa com ele, sem precisar mudar o painel quando a IA chegar.
2. Onde fica o código do roteiro: o `SupportPanel` está no pacote global (o `AtendimentoProvider` fica no `app/layout.tsx`), e na etapa 3 o cartão do chat já foi enxugado (`lib/cartaoDoChat.ts`) para não arrastar o catálogo para todas as páginas.
3. De onde vem o número do WhatsApp no navegador. `numeroDoWhatsApp()` (`data/ficticio.ts`) devolve `null` com `VERCEL_ENV=production` e variável inválida, mas `VERCEL_ENV` **não** tem o prefixo `NEXT_PUBLIC_`: o Next não a substitui no pacote do navegador, então, chamada num Client Component, a função nunca veria `production` e cairia sempre no número fictício.
4. Como calcular "aberto agora" em São Paulo sem biblioteca de datas e sem erro de hidratação.

Versões instaladas: Next.js 16.4.3, React 19.3.0, Zod 4.6.7 (`zod/mini`, ADR-0007).

## Decisão

1. **Motor puro atrás de uma interface assíncrona.** `lib/assistant.ts` define os tipos (`MensagemDoChat`, `EntradaDoCliente`, `EstadoDaConversa`, `RespostaDoAssistente`, `Assistente`) e a função `carregarAssistente(): Promise<Assistente>`, que é o ponto de integração da §8.2. A implementação de hoje, `lib/roteiro.ts`, é uma máquina de estados pura: recebe o estado e a entrada (resposta rápida ou texto) e devolve as mensagens novas, as ações (ex.: pôr na sacola) e, quando for o caso, o motivo da passagem para humano. Ela não usa React, rede, `localStorage` nem relógio (os ids saem de um contador no estado), então é testada só com Vitest. `responder` devolve `Promise` mesmo sendo síncrona por dentro: a futura versão com IA (Route Handler com streaming) entra trocando só `carregarAssistente`, sem mexer no painel.
2. **Ações executadas pelo painel, não pelo motor.** O motor só *descreve* ações (`{ tipo: 'adicionar-a-sacola', … }`); quem chama `useSacola()` é o componente. Assim o motor continua puro e a mesma regra da spec ("ações que alteram dados exigem confirmação explícita") vale para a IA: ação só sai de uma resposta rápida escolhida pela pessoa.
3. **Roteiro carregado sob demanda.** A saudação e as três respostas rápidas iniciais (§8.2, itens 1 e 2) ficam em `lib/assistant.ts`, estáticas, e aparecem assim que o painel abre. O motor (`lib/roteiro.ts`, com as perguntas do quiz, a pontuação de `lib/quiz.ts` e os dados mínimos dos cartões dos 10 queijos em `lib/cartoesDoChat.ts`) é importado por `import()` quando o painel abre. Ele nunca aparece nos `<script>` do HTML de nenhuma página. Um clique que chegue antes do fim da importação espera a mesma promessa, sem perder a entrada. O cartão de produto passa a viajar dentro da mensagem (`{ tipo: 'produto', slug, cartao }`), então o painel não importa mapa de queijos.
4. **Número do WhatsApp resolvido no servidor.** O `app/layout.tsx` (Server Component) chama `numeroDoWhatsApp()` e passa o resultado (`string | null`) ao `AtendimentoProvider` por prop; um componente `LinkDoWhatsApp` lê do contexto e **não renderiza nada** com `null`. Nenhum Client Component chama `numeroDoWhatsApp()`. Como o layout é estático, o valor é fixado no build, que é o mesmo momento em que o Next fixa as variáveis `NEXT_PUBLIC_*`.
5. **`lib/whatsapp.ts` puro, sem depender de `data/`.** Recebe o número já resolvido, valida o formato (`^55\d{10,11}$`) e monta o link com `encodeURIComponent` sobre as mensagens literais da §8.3. Só entram na URL: o número validado, o texto fixo da spec, o nome do queijo vindo do catálogo e o número do pedido validado (`AQ-` + 6 dígitos, o formato gerado por `lib/pedido.server.ts`). **Texto livre digitado pela pessoa nunca entra na URL.**
6. **Horário com `Intl.DateTimeFormat`.** `atendimentoHumanoAberto(agora = new Date())` lê dia da semana, hora e minuto com `timeZone: 'America/Sao_Paulo'` (o mesmo método de `hojeEmSaoPaulo` em `lib/pedido.ts`) e compara com intervalos meio abertos `[abre, fecha)`: seg a sex 9h–18h, sáb 9h–15h, domingo fechado. O estado só é calculado no navegador, dentro do conteúdo do painel, que já só é montado com o painel aberto: não há HTML do servidor para divergir, logo não há erro de hidratação.
7. **Sem dependência nova, sem rede, sem armazenamento.** Nenhum pacote de datas, de NLP ou de chat. O texto livre é reconhecido por uma tabela pequena de palavras-chave (texto em minúsculas e sem acento), com uma resposta de "não entendi" que devolve as respostas rápidas. A conversa vive só na memória do `AtendimentoProvider`; nada vai para `localStorage`, `sessionStorage`, servidor ou log.

## Alternativas consideradas

- **Árvore como dados JSON interpretados em tempo de execução:** mais flexível para o dono editar, mas perde a checagem de tipos dos slugs e das ações e exige um interpretador. Rejeitada; os textos ficam reunidos num único objeto de `lib/roteiro.ts`, fácil de editar (guia em `docs/conteudo.md`).
- **Motor dentro do componente (`useReducer` com a árvore no JSX):** menos arquivos, mas mistura regra e interface e obriga a mexer no painel para trocar pela IA. Rejeitada.
- **Roteiro no pacote global, sem `import()`:** mais simples, mas soma o quiz e os dados dos cartões ao JavaScript de todas as páginas, o contrário do que a etapa 3 fez com o `cartaoDoChat`. Rejeitada; se a medição mostrar menos de 1 kB gzip, o `performance-e-seo` pode propor voltar atrás.
- **Ler o número no cliente com `NEXT_PUBLIC_VERCEL_ENV`:** depende de a Vercel expor as variáveis de sistema e espalha a regra de produção em dois lugares. Rejeitada; o servidor já tem a regra pronta.
- **Falhar o build em produção sem número válido:** mais seguro contra erro de configuração, mas contraria a regra registrada em `docs/ambiente.md` (esconder os links). Fica como sugestão para a etapa 9; hoje a trava de dados fictícios já impede o build de produção.
- **Biblioteca de datas com fusos (ex.: `date-fns-tz`):** desnecessária; o `Intl` do Node 24 e dos navegadores atuais cobre o caso. Rejeitada.
- **Pôr o resumo da conversa (texto livre) na mensagem do WhatsApp:** cumpriria ao pé da letra "já com o resumo desta conversa", mas levaria texto arbitrário, talvez com dados pessoais, para a URL e para o histórico do navegador. Rejeitada; o "resumo" é a mensagem da §8.3 escolhida pelo contexto da conversa (pendência P47 do plano).

## Consequências

- O painel continua só renderizando `MensagemDoChat[]` (contrato da etapa 3), agora com o cartão dentro da mensagem de produto. `ROTEIRO_DO_PROTOTIPO` e `lib/cartaoDoChat.ts` saem; o roteiro do protótipo passa a ser reproduzido digitando a frase da §8.2, item 3 (o e2e faz isso para a comparação visual).
- Novo *chunk* tardio (o motor), com orçamento no plano; o pacote compartilhado só pode crescer o previsto lá.
- `AtendimentoProvider` ganha a prop `numeroDoWhatsApp`; testes de componente passam o número explicitamente (inclusive `null`).
- Feriados não são considerados (pendência P50 do plano); trocar a regra é mudar uma tabela em `lib/whatsapp.ts`.
- A versão com IA exigirá ADR próprio (provedor, custo, Route Handler, limite de taxa, LGPD do registro de conversas, defesa contra *prompt injection*). Este ADR só garante que o painel não muda.
- Para a etapa 8 (CSP): os links para `wa.me` são navegação, não `connect-src`; nada muda na política por causa desta etapa.
