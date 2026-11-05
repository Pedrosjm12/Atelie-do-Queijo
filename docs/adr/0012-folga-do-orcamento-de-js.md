# ADR-0012 — Folga no orçamento de JavaScript: painel de atendimento sob demanda

- **Status:** Aceito
- **Data:** 2026-11-05
- **Contexto da etapa:** 7 (mitigação de riscos ao fim da etapa; desempenho)

## Contexto

Ao fim da etapa 7 a folga do orçamento de JavaScript inicial (`scripts/medir-pacote.mjs`) era zero: compartilhado 184,64 kB gzip (limite 184,69), Home 189,03 (limite 189,03), produto 194,52 (limite 195,27). Qualquer código global novo estouraria. Os limites **não** sobem (alterado na Atualização abaixo).

A medição dos oito arquivos do pacote compartilhado (inspeção dos chunks de `.next/static/chunks`, módulo a módulo; o `next experimental-analyze` falhou neste repositório por causa do caminho com acento, ver "Alternativas") mostrou:

| Contribuinte | gzip (kB) |
| --- | ---: |
| `react-dom` | 70,3 |
| Cliente do Next (roteador do App Router, Link, ações de servidor, etc.) | 45,3 |
| Polyfills `noModule` (`0cz1…js`; o navegador moderno **não baixa**, mas a medição soma) | 38,7 |
| Outros módulos do Next no pacote compartilhado (`1oqv…`, `turbopack`, `global-error` embutido de 1,9) | 13,2 |
| Código do app (Atendimento, painel, sacola, cabeçalho, ícones, botão) | ≈ 17 |

O código do app era ≈ 9 % do total. O maior bloco dele era o `SupportPanel` (conversa, cartões, abas, horário), carregado em todas as páginas embora só apareça depois de um clique, mais a fila de entradas e a entrega ao assistente no `AtendimentoProvider`.

## Decisão

1. **Painel de atendimento em chunk tardio.** `AtendimentoProvider` (layout) passa a guardar só `aberto`, o gatilho, o destino do foco, o fechamento por mudança de rota e o número do WhatsApp. A conversa, a fila de entradas, a entrega ao motor (ADR-0010) e o `<SupportPanel/>` foram para `components/PainelDoAtendimento.tsx`, importado por `lazy(() => import(...))`. O módulo é montado na primeira abertura e **continua montado** depois, então a conversa em memória (P51) sobrevive ao fechamento.
2. **Baixar em tempo ocioso.** Depois da hidratação, `requestIdleCallback` (com `setTimeout` de 2 s como reserva) dispara o `import()`; o chunk não aparece nos `<script>` do HTML e a primeira abertura é quase sempre instantânea. Se o clique chegar antes do fim do download, o diálogo aparece quando o módulo chega (a promessa é a mesma). O motor do roteiro (ADR-0010) e o gerador de ilustrações continuam começando a baixar quando o painel monta aberto.
3. **Contextos separados.** `useAtendimento()` devolve só `aberto`, `abrir`, `fechar` e `numeroDoWhatsApp`; `conversa` e `enviar` passam para `useConversa()`, lido só pelo painel (`components/atendimento.contexto.ts`).
4. **Código que só o painel e as páginas de compra usam sai do pacote global.** `atendimentoHumanoAberto` e os textos do horário foram de `lib/whatsapp.ts` para `lib/horario.ts`; `precificarSacola` e seus tipos foram de `lib/sacola.ts` para `lib/precificarSacola.ts`. Sem mudar comportamento; só os imports mudam.
5. **Trava na medição.** `scripts/medir-pacote.mjs` falha se o título e a linha de status do painel aparecerem em qualquer script inicial. Os limites do orçamento não mudaram (alterado na Atualização abaixo).

## Alternativas consideradas

- **`next experimental-analyze`:** a versão instalada (16.4.3) o oferece, mas o comando falha ao ler `.next/diagnostics/analyze/history/history.json` neste caminho com acento. A análise foi feita lendo os chunks.
- **Carregar o painel só no clique (sem pré-busca ociosa):** economiza ≈ 5,5 kB de rede em quem nunca abre o atendimento, mas o primeiro clique esperaria um download e o `<dialog>` apareceria atrasado. Rejeitada; a pré-busca ociosa não pesa na renderização nem entra na medição do JS inicial.
- **Trocar o `AtendimentoProvider` por um store externo (`useSyncExternalStore`):** tiraria o estado do React, mas troca de arquitetura sem ganho de bytes relevante. Rejeitada.
- **Medir ignorando os scripts `noModule`:** os 38,7 kB gzip do polyfill nunca são baixados por navegadores com módulos ES, então o JS inicial real é menor do que o número medido. Mudar o método de medição altera o significado do orçamento; **decisão do dono**, não aplicada.
- **`app/global-error.tsx` próprio:** o `global-error` embutido do Next custa ≈ 1,9 kB gzip no pacote compartilhado; um próprio custaria ≈ 0,4 kB, mas traz texto e visual novos (não há na spec). **Decisão do dono**, não aplicada.
- **Adiar o reducer da sacola:** o provider precisa ler o `localStorage` e contar itens em toda página (selo da sacola); o reducer e o serializador são ≈ 1,4 kB gzip. Adiá-los exige mudar a semântica de hidratação e o `adicionar` síncrono. Rejeitada por risco.

## Consequências

- Pacote compartilhado −5,1 kB gzip e Home −5,0 kB (ver relatório da tarefa com os números por rota).
- Um chunk tardio novo de ≈ 5,6 kB gzip (painel), sem limite próprio no script; fica fora do HTML.
- Os testes que abrem o painel passam a esperar o diálogo assíncrono (`findByRole`). No `SupportFab.test.tsx` o relógio simulado volta ao real antes da espera, porque a importação dinâmica não avança com `vi.advanceTimersByTime`.
- Se o `import()` do painel falhar (sem rede, deploy novo), o `lazy` lançaria no render e derrubaria o site (não há `app/error.tsx`). Uma borda de erro local mínima (`BordaDoPainel`, classe com `getDerivedStateFromError`/`componentDidCatch`, renderiza `null`) envolve o `Suspense`: ao falhar, fecha o painel, zera o pedido de montagem, devolve o foco ao gatilho e recria o `lazy` (contador de tentativa + `useMemo`), então a próxima abertura tenta baixar de novo. Custo de JS desprezível. Teste em `components/Atendimento.falha.test.tsx`.
- Fora do `AtendimentoProvider`, nada novo no pacote global deve importar `SupportPanel`, `PainelDoAtendimento` ou `lib/horario`; a trava do script cobre o painel.

## Atualização (2026-11-05): medição sem `noModule`, limites recalibrados

O dono decidiu medir o JavaScript inicial **sem** os `<script noModule>` (polyfills que navegadores com módulos ES não baixam) e **não** criar `app/global-error.tsx` (o embutido do Next permanece). As duas alternativas acima marcadas como "decisão do dono" foram assim resolvidas: a primeira aplicada, a segunda recusada.

**Método.** `scripts/medir-pacote.mjs` lê cada tag `<script>` do HTML pré-renderizado e descarta as que têm o atributo `noModule`; o restante segue igual (gzip de cada arquivo, compartilhado = interseção). Cada limite passa a ser **valor medido + 3 kB gzip por rota**. As travas de falha (3D, `CheeseIllustration`, painel de atendimento e motor do assistente nos scripts iniciais ou no HTML) e os limites dos chunks tardios (3D 350 kB, motor 12 kB) não mudaram.

| Rota | Antes (com polyfills) | Depois (sem `noModule`) | Limite novo | Limite antigo |
| --- | ---: | ---: | ---: | ---: |
| Compartilhado | 179,57 | 140,88 | 143,88 | 184,69 |
| `/` | 184,03 | 145,34 | 148,34 | 189,03 |
| `/queijos` (só o compartilhado) | 179,57 | 140,88 | 143,88 | 184,69 |
| `/queijos/canastra-curado` | 190,68 | 151,99 | 154,99 | 195,27 |
| `/checkout` (informativo) | 205,51 | 166,81 | sem limite | sem limite |
| `/sacola` (informativo) | 182,66 | 143,96 | sem limite | sem limite |

Valores em kB gzip. Os números "antes" são os do medidor antigo sobre o mesmo build (já com o painel em chunk tardio); a diferença de ≈ 38,7 kB por rota é o polyfill. Os novos números **não são comparáveis** com os anteriores a esta data.
